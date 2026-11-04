import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Camera,
  UploadCloud,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Users,
  Layers,
  ArrowLeft,
  X,
  Volume2,
  VolumeX,
  UserCheck,
  Ticket,
  FileText
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import './ScanAttendance.css';

const ScanAttendance = () => {
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('userAccount') || '{}');
      const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
      const username = (user.username || '').trim();
      const isDean = userRole === 'dean' || username.toLowerCase() === 'dean';
      return { user, userRole, username, isDean };
    } catch {
      return { user: {}, userRole: '', username: '', isDean: false };
    }
  };

  const { isDean, username: currentUsername } = getCurrentUser();

  const [searchParams] = useSearchParams();
  const initialEventFilter = searchParams.get('eventId') || 'all';

  // State
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'file' | 'manual'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Manual input
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // File drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Sound feedback
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Last Scanned Result
  const [lastScanned, setLastScanned] = useState(null);

  // Roster / Attendance data
  const [couponsList, setCouponsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(initialEventFilter);
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'present' | 'pending'
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);

  // Toast
  const [toast, setToast] = useState(null);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sound Chime using Web Audio API
  const playSound = (type = 'success') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High chime
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      } else if (type === 'warning') {
        // Double tone warning
        osc.frequency.setValueAtTime(587, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
      } else {
        // Error buzz
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
      }

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  // Fetch all paid students for attendance stats & live roster
  const fetchRoster = async () => {
    setIsLoadingRoster(true);
    try {
      const params = new URLSearchParams();
      if (!isDean && currentUsername) {
        params.append('role', currentUsername);
      }
      if (selectedEvent && selectedEvent !== 'all') {
        params.append('eventId', selectedEvent);
      }
      const res = await fetch(`${backendUrl}/api/club-events/coupons${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCouponsList(data.data);
        if (Array.isArray(data.events)) {
          setEventsList(data.events);
        }
      }
    } catch (err) {
      console.error('Error fetching roster:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedEvent]);

  // Main verification handler
  const handleVerifyCode = async (rawCode) => {
    if (!rawCode || !rawCode.trim()) return;
    const cleanCode = rawCode.trim();

    setIsVerifying(true);
    try {
      const res = await fetch(`${backendUrl}/api/club-events/coupons/verify-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeOrRollNo: cleanCode,
          eventId: selectedEvent !== 'all' ? selectedEvent : undefined,
          markedBy: 'Gate Attendance Scanner'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.alreadyPresent) {
          playSound('warning');
          showToast(data.message, 'error');
        } else {
          playSound('success');
          showToast(data.message, 'success');
        }

        setLastScanned({
          ...data.student,
          alreadyPresent: data.alreadyPresent,
          scannedAtTime: new Date().toLocaleTimeString('en-IN')
        });

        // Update roster locally
        setCouponsList((prev) =>
          prev.map((item) =>
            item.id === data.student.id ||
            item.couponCode === data.student.couponCode ||
            (item.rNo === data.student.rNo && item.eventName === data.student.eventName)
              ? { ...item, attendanceStatus: 'present', attendedAt: data.student.attendedAt }
              : item
          )
        );
      } else {
        playSound('error');
        showToast(data.message || 'Pass not found or invalid.', 'error');
      }
    } catch (err) {
      console.error('Scan error:', err);
      playSound('error');
      showToast('Network error while verifying pass.', 'error');
    } finally {
      setIsVerifying(false);
      setManualCode('');
    }
  };

  // Toggle Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('attendance-qr-reader');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Prevent multiple triggers within short interval
          if (!isVerifying) {
            handleVerifyCode(decodedText);
          }
        },
        () => {
          // scan failure / frame without QR - ignore
        }
      );
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or use File/Manual mode.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error('Error stopping camera:', err);
    } finally {
      setIsCameraActive(false);
    }
  };

  // Manage Camera on tab change & unmount
  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanMode]);

  // Handle Drag & Drop / File Upload (PDF or Image)
  const handleFileUpload = async (file) => {
    if (!file) return;

    // 1. If PDF file: extract coupon code text via regex
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        // Fast path 1: Check if coupon code is embedded in the downloaded file name
        // e.g. Aditya_Event_Pass_585858_AU-DPP-585858-B0VU.pdf
        const fnMatch = file.name.match(/AU-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+/i);
        if (fnMatch && fnMatch[0]) {
          showToast(`Extracted pass coupon: ${fnMatch[0]}`);
          handleVerifyCode(fnMatch[0]);
          return;
        }

        // Fast path 2: Check if roll number is in the filename
        const fnRNoMatch = file.name.match(/(?:Pass_)?([A-Za-z0-9]{4,12})/i);

        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target.result || '';
          // Match standard code: AU-EVENT-RNO-SALT
          const match = text.match(/AU-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+/i);
          if (match && match[0]) {
            showToast(`Scanned coupon pass: ${match[0]}`);
            handleVerifyCode(match[0]);
            return;
          }

          // Check if Title contains coupon code in PDF metadata
          const titleMatch = text.match(/\/Title\s*\(([^)]+)\)/i);
          if (titleMatch && titleMatch[1]) {
            const metaCode = titleMatch[1].match(/AU-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+/i);
            if (metaCode && metaCode[0]) {
              showToast(`Scanned coupon pass: ${metaCode[0]}`);
              handleVerifyCode(metaCode[0]);
              return;
            }
          }

          // Check for student roll number in text or filename
          const rNoMatch = text.match(/\b([0-9]{4,10}|[0-9]{2}[A-Za-z0-9]{2}[0-9][A-Za-z0-9]{4})\b/) || fnRNoMatch;
          if (rNoMatch && rNoMatch[1]) {
            showToast(`Found student roll no ${rNoMatch[1]} in PDF pass`);
            handleVerifyCode(rNoMatch[1]);
          } else {
            showToast('Could not automatically read coupon code from PDF. Enter code manually below.', 'error');
          }
        };
        reader.readAsText(file);
      } catch (err) {
        console.error('PDF parsing error:', err);
        showToast('Failed to parse PDF pass', 'error');
      }
      return;
    }

    // 2. If Image file: decode QR code with html5-qrcode
    if (file.type.startsWith('image/')) {
      try {
        const scanner = new Html5Qrcode('attendance-file-helper', false);
        const result = await scanner.scanFile(file, true);
        if (result) {
          handleVerifyCode(result);
        }
      } catch (err) {
        console.error('Image QR scan error:', err);
        showToast('No QR code detected in the uploaded image. Please try another image.', 'error');
      }
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Toggle Attendance Status Manually
  const handleToggleAttendance = async (student) => {
    const newStatus = student.attendanceStatus === 'present' ? 'pending' : 'present';
    try {
      const res = await fetch(`${backendUrl}/api/club-events/coupons/toggle-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: student.registrationId,
          memberId: student.memberId,
          rNo: student.rNo,
          status: newStatus
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setCouponsList((prev) =>
          prev.map((item) =>
            item.id === student.id
              ? { ...item, attendanceStatus: newStatus, attendedAt: data.attendedAt }
              : item
          )
        );
        if (lastScanned && lastScanned.id === student.id) {
          setLastScanned((prev) => ({ ...prev, attendanceStatus: newStatus }));
        }
      } else {
        showToast(data.message || 'Failed to update attendance', 'error');
      }
    } catch (err) {
      console.error('Toggle attendance error:', err);
      showToast('Network error while updating attendance', 'error');
    }
  };

  // Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    if (couponsList.length === 0) {
      showToast('No records to export', 'error');
      return;
    }

    const headers = [
      'Roll Number',
      'Name',
      'Branch',
      'Event Name',
      'Team Name',
      'Role',
      'Coupon Code',
      'Attendance Status',
      'Attended Timestamp',
      'Marked By'
    ];

    const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

    const rows = couponsList.map((c) => [
      escapeCSV(c.rNo),
      escapeCSV(c.name),
      escapeCSV(c.branch),
      escapeCSV(c.eventName),
      escapeCSV(c.teamName),
      escapeCSV(c.isLeader ? 'Leader' : 'Member'),
      escapeCSV(c.couponCode),
      escapeCSV((c.attendanceStatus || 'pending').toUpperCase()),
      escapeCSV(c.attendedAt ? new Date(c.attendedAt).toLocaleString('en-IN') : 'N/A'),
      escapeCSV(c.attendanceMarkedBy || 'N/A')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Attendance_Report_${selectedEvent}_${Date.now()}.csv`;
    link.click();
    showToast('Exported attendance report successfully!');
  };

  // Stats calculation
  const totalStudents = couponsList.length;
  const presentCount = couponsList.filter((c) => c.attendanceStatus === 'present').length;
  const pendingCount = totalStudents - presentCount;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Filtered Roster
  const filteredRoster = couponsList.filter((item) => {
    // Search filter
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      const match =
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.rNo && item.rNo.toLowerCase().includes(q)) ||
        (item.couponCode && item.couponCode.toLowerCase().includes(q)) ||
        (item.branch && item.branch.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Status filter
    if (statusFilter === 'present') return item.attendanceStatus === 'present';
    if (statusFilter === 'pending') return item.attendanceStatus !== 'present';
    return true;
  });

  return (
    <div className="scan-attendance-page">
      {/* Toast Feedback */}
      {toast && (
        <div className={`send-coupons-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hidden container for file-based QR decoding */}
      <div id="attendance-file-helper" style={{ display: 'none' }}></div>

      {/* Header */}
      <div className="scan-header-container">
        <div className="scan-title-group">
          <h1>
            <QrCode size={28} style={{ color: 'var(--primary-color)' }} />
            Event Pass Attendance Scanner
          </h1>
          <p>
            Scan pass QR codes (from printed or mobile PDF passes), drop downloaded PDF passes, or enter roll numbers to mark attendance.
          </p>
        </div>

        <div className="scan-header-actions">
          {/* Sound Toggle */}
          <button
            className="btn-secondary-action"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Refresh Roster */}
          <button className="btn-secondary-action" onClick={fetchRoster} title="Refresh live roster">
            <RefreshCw size={16} className={isLoadingRoster ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          {/* Export Attendance CSV */}
          <button className="btn-secondary-action" onClick={handleExportAttendanceCSV} title="Export attendance CSV">
            <Download size={16} />
            <span>Export Sheet</span>
          </button>

          {/* Navigation link to Send Coupons */}
          <Link to="/dashboard/events/sendcoupons" className="btn-secondary-action" title="Back to send coupons">
            <Ticket size={16} />
            <span>Send Coupons</span>
          </Link>
        </div>
      </div>

      {/* Live Attendance Statistics Cards */}
      <div className="scan-stats-grid">
        <div className="scan-stat-card">
          <div className="scan-stat-icon blue">
            <Users size={24} />
          </div>
          <div className="scan-stat-info">
            <span className="scan-stat-label">Total Registered</span>
            <span className="scan-stat-val">{totalStudents}</span>
          </div>
        </div>

        <div className="scan-stat-card">
          <div className="scan-stat-icon green">
            <UserCheck size={24} />
          </div>
          <div className="scan-stat-info">
            <span className="scan-stat-label">Present (Attended)</span>
            <span className="scan-stat-val">{presentCount}</span>
          </div>
        </div>

        <div className="scan-stat-card">
          <div className="scan-stat-icon amber">
            <Clock size={24} />
          </div>
          <div className="scan-stat-info">
            <span className="scan-stat-label">Pending Entry</span>
            <span className="scan-stat-val">{pendingCount}</span>
          </div>
        </div>

        <div className="scan-stat-card">
          <div className="scan-stat-icon purple">
            <CheckCircle2 size={24} />
          </div>
          <div className="scan-stat-info">
            <span className="scan-stat-label">Attendance Rate</span>
            <span className="scan-stat-val">{attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Split Layout: Scanner Controls on Left, Verified Participant Card on Right */}
      <div className="scanner-split-layout">
        {/* Left: Multi-Mode Scanner */}
        <div className="scanner-card">
          {/* Mode Selector Tabs */}
          <div className="scanner-mode-tabs">
            <button
              className={`scanner-tab-btn ${scanMode === 'camera' ? 'active' : ''}`}
              onClick={() => setScanMode('camera')}
            >
              <Camera size={16} />
              <span>Camera Scanner</span>
            </button>
            <button
              className={`scanner-tab-btn ${scanMode === 'file' ? 'active' : ''}`}
              onClick={() => setScanMode('file')}
            >
              <UploadCloud size={16} />
              <span>Upload PDF / Pass</span>
            </button>
            <button
              className={`scanner-tab-btn ${scanMode === 'manual' ? 'active' : ''}`}
              onClick={() => setScanMode('manual')}
            >
              <Search size={16} />
              <span>Manual Entry</span>
            </button>
          </div>

          {/* Mode 1: Camera Scanner */}
          {scanMode === 'camera' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="camera-scanner-viewport">
                <div id="attendance-qr-reader"></div>
                {isCameraActive && <div className="camera-laser-line"></div>}
                {!isCameraActive && !cameraError && (
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                    <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 0.5rem auto' }} />
                    <div>Initializing Camera Scanner...</div>
                  </div>
                )}
                {cameraError && (
                  <div style={{ color: '#f87171', padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 0.5rem auto' }} />
                    <div>{cameraError}</div>
                  </div>
                )}
              </div>

              <div className="camera-controls-bar">
                <button
                  className="btn-secondary-action"
                  onClick={isCameraActive ? stopCamera : startCamera}
                >
                  <Camera size={15} />
                  <span>{isCameraActive ? 'Pause Camera' : 'Start Camera'}</span>
                </button>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Point camera at the QR code on the PDF pass or phone
                </span>
              </div>
            </div>
          )}

          {/* Mode 2: Drag and Drop PDF / Image */}
          {scanMode === 'file' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div
                className={`file-dropzone-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon-circle">
                  <UploadCloud size={32} />
                </div>
                <div className="dropzone-text">
                  <h4>Drop Downloaded PDF Pass or Image</h4>
                  <p>Click to browse or drag & drop the official ticket PDF file</p>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Manual Input */}
          <div className="manual-input-box">
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Quick Roll No or Coupon Code Scanner:
            </div>
            <form
              className="manual-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCode(manualCode);
              }}
            >
              <input
                type="text"
                placeholder="Scan / Type coupon code (e.g. AU-DD-1234-WTQZ) or Roll No (e.g. 1234)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="manual-scan-field"
                disabled={isVerifying}
              />
              <button
                type="submit"
                className="btn-verify-scan"
                disabled={isVerifying || !manualCode.trim()}
              >
                <CheckCircle2 size={18} />
                <span>{isVerifying ? 'Verifying...' : 'Mark Present'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Live Verified Result Card */}
        {lastScanned ? (
          <div className={`scan-result-card ${lastScanned.alreadyPresent ? 'already-marked' : ''}`}>
            <div className="result-header-row">
              <div className="result-avatar">
                {lastScanned.name ? lastScanned.name[0].toUpperCase() : 'S'}
              </div>
              <div className="result-main-meta">
                <div className="result-name">{lastScanned.name}</div>
                <div className="result-rno-pill">Roll No: {lastScanned.rNo}</div>
              </div>
              <div className={`attendance-status-badge ${lastScanned.alreadyPresent ? 'already' : 'present'}`}>
                <CheckCircle2 size={16} />
                <span>{lastScanned.alreadyPresent ? 'Already Marked' : 'Marked Present'}</span>
              </div>
            </div>

            <div className="result-details-grid">
              <div className="result-cell">
                <div className="lbl">Event Name</div>
                <div className="val">{lastScanned.eventName}</div>
              </div>
              <div className="result-cell">
                <div className="lbl">Branch / Department</div>
                <div className="val">{lastScanned.branch || 'General'}</div>
              </div>
              <div className="result-cell">
                <div className="lbl">Role & Team</div>
                <div className="val">
                  {lastScanned.teamName
                    ? `${lastScanned.teamName} (${lastScanned.isLeader ? 'Leader' : 'Member'})`
                    : (lastScanned.isLeader ? 'Individual Participant' : 'Team Member')}
                </div>
              </div>
              <div className="result-cell">
                <div className="lbl">Coupon Code</div>
                <div className="val" style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>
                  {lastScanned.couponCode}
                </div>
              </div>
              <div className="result-cell">
                <div className="lbl">Attendance Timestamp</div>
                <div className="val">
                  {lastScanned.attendedAt
                    ? new Date(lastScanned.attendedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : lastScanned.scannedAtTime || 'Just now'}
                </div>
              </div>
              <div className="result-cell">
                <div className="lbl">Verification Status</div>
                <div className="val" style={{ color: '#10b981' }}>
                  &#10003; Paid Registration Verified
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn-secondary-action"
                onClick={() => setLastScanned(null)}
                style={{ fontSize: '0.85rem' }}
              >
                Clear Card
              </button>
            </div>
          </div>
        ) : (
          <div className="scanner-placeholder-card">
            <QrCode size={54} />
            <h3>Awaiting Pass Scan</h3>
            <p>
              Point camera at student's pass QR code, upload the downloaded PDF pass, or enter their Roll Number to record attendance.
            </p>
          </div>
        )}
      </div>

      {/* Live Attendance Roster */}
      <div className="attendance-roster-card">
        <div className="roster-header-bar">
          <div className="roster-title-group">
            <h2>
              <CheckCircle2 size={20} style={{ color: '#10b981' }} />
              Live Event Attendance Roster
            </h2>
            <span>Real-time status of all verified paid participants</span>
          </div>

          <div className="roster-actions-group">
            {/* Event Dropdown Filter */}
            <div className="filter-field-wrapper">
              <Layers size={16} className="filter-field-icon" />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="filter-dropdown-select"
              >
                <option value="all">All Events ({eventsList.length})</option>
                {eventsList.map((evt) => (
                  <option key={evt.eventId} value={evt.eventId}>
                    {evt.eventName} ({evt.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-dropdown-select"
            >
              <option value="all">All Statuses ({totalStudents})</option>
              <option value="present">Present ({presentCount})</option>
              <option value="pending">Pending ({pendingCount})</option>
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search roster..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="search-field-input"
              style={{ minWidth: '180px', padding: '0.55rem 1rem' }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive-wrapper">
          <table className="roster-table">
            <thead>
              <tr>
                <th>ROLL NO</th>
                <th>PARTICIPANT NAME</th>
                <th>BRANCH</th>
                <th>EVENT NAME & TEAM</th>
                <th>COUPON CODE</th>
                <th>ATTENDANCE STATUS</th>
                <th>CHECK-IN TIME</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRoster ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 0.5rem auto', color: 'var(--primary-color)' }} />
                    <div>Loading attendance records...</div>
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No participants found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((student) => {
                  const isPresent = student.attendanceStatus === 'present';

                  return (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 700 }}>{student.rNo}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{student.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {student.isLeader ? 'Team Leader' : 'Team Member'}
                        </div>
                      </td>
                      <td>{student.branch || 'General'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{student.eventName}</div>
                        {student.teamName && (
                          <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                            Team: {student.teamName}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>
                          {student.couponCode}
                        </span>
                      </td>
                      <td>
                        <span className={`roster-status-chip ${isPresent ? 'present' : 'pending'}`}>
                          {isPresent ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          <span>{isPresent ? 'Present' : 'Pending'}</span>
                        </span>
                      </td>
                      <td>
                        {student.attendedAt ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {new Date(student.attendedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not scanned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="toggle-attendance-btn"
                          onClick={() => handleToggleAttendance(student)}
                          title={isPresent ? 'Mark as Pending' : 'Mark as Present'}
                        >
                          {isPresent ? 'Undo' : 'Mark Present'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScanAttendance;
