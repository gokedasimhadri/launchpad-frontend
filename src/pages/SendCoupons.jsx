import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Ticket,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Eye,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Layers,
  AlertCircle,
  Sparkles,
  ExternalLink,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Info,
  QrCode,
  Barcode,
  RotateCcw
} from 'lucide-react';
import BarcodeSVG from '../utils/barcodeGenerator';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import './SendCoupons.css';

const SendCoupons = () => {
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

  const [searchParams, setSearchParams] = useSearchParams();
  const initialEventFilter = searchParams.get('eventId') || 'all';

  const [coupons, setCoupons] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState(initialEventFilter);
  const [filterStatus, setFilterStatus] = useState('all');

  // Checkbox selection for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pass View Modal
  const [previewStudent, setPreviewStudent] = useState(null);
  const passCardRef = useRef(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  // Bulk Dispatch Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    inProgress: false,
    total: 0,
    current: 0,
    sent: 0,
    failed: 0,
    results: []
  });

  // Single Sending State
  const [sendingId, setSendingId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  // SMTP Info Modal
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [smtpModalOpen, setSmtModalOpen] = useState(false);

  // Feedback Toast & Copied state
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch Coupons
  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (!isDean && currentUsername) {
        params.append('role', currentUsername);
      }
      if (filterEvent && filterEvent !== 'all') {
        params.append('eventId', filterEvent);
      }
      if (filterStatus && filterStatus !== 'all') {
        params.append('sentStatus', filterStatus);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const queryString = params.toString();
      const res = await fetch(`${backendUrl}/api/club-events/coupons${queryString ? `?${queryString}` : ''}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setCoupons(data.data);
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEventsList(data.events);
        }
      } else {
        showToast(data.message || 'Failed to load coupons', 'error');
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      showToast('Network error while loading coupons', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Check SMTP Status
  const fetchSmtpStatus = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/club-events/coupons/smtp-status`);
      const data = await res.json();
      if (data.success) {
        setSmtpStatus(data);
      }
    } catch (err) {
      console.error('Error checking SMTP status:', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchSmtpStatus();
  }, [filterEvent, filterStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleEventFilterChange = (val) => {
    setFilterEvent(val);
    setCurrentPage(1);
    setSelectedIds(new Set());
    if (val && val !== 'all') {
      setSearchParams({ eventId: val });
    } else {
      setSearchParams({});
    }
  };

  // Checkbox selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(coupons.map((c) => c.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Single Email Send or Resend
  const handleSendSingleEmail = async (student) => {
    if (!student.email || !student.email.includes('@')) {
      showToast(`Student ${student.name} (${student.rNo}) does not have a valid email address.`, 'error');
      return;
    }

    const isResend = student.couponSentStatus === 'sent';
    setSendingId(student.id);
    try {
      const res = await fetch(`${backendUrl}/api/club-events/coupons/send-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: student.registrationId,
          memberId: student.memberId,
          email: student.email,
          couponCode: student.couponCode,
          studentName: student.name,
          eventName: student.eventName,
          rNo: student.rNo,
          branch: student.branch,
          teamName: student.teamName,
          isLeader: student.isLeader
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          isResend
            ? `Coupon pass resent to ${student.email} successfully!`
            : `Coupon pass sent to ${student.email}!`,
          'success'
        );
        const sentTime = data.sentAt || new Date().toISOString();
        // Update local status
        setCoupons((prev) =>
          prev.map((item) =>
            item.id === student.id
              ? { ...item, couponSentStatus: 'sent', couponSentAt: sentTime }
              : item
          )
        );
        if (previewStudent && previewStudent.id === student.id) {
          setPreviewStudent((prev) => ({
            ...prev,
            couponSentStatus: 'sent',
            couponSentAt: sentTime
          }));
        }
        if (!isResend) {
          setStats((prev) => ({
            ...prev,
            sent: prev.sent + 1,
            pending: Math.max(0, prev.pending - 1)
          }));
        }
      } else {
        showToast(data.message || 'Failed to send email', 'error');
      }
    } catch (err) {
      console.error('Error sending single email:', err);
      showToast('Network error while sending email', 'error');
    } finally {
      setSendingId(null);
    }
  };

  // Regenerate Coupon Code
  const handleRegenerateCode = async (student) => {
    setRegeneratingId(student.id);
    try {
      const res = await fetch(`${backendUrl}/api/club-events/coupons/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: student.registrationId,
          memberId: student.memberId,
          rNo: student.rNo,
          eventName: student.eventName
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`New code generated: ${data.couponCode}`);
        setCoupons((prev) =>
          prev.map((item) =>
            item.id === student.id
              ? { ...item, couponCode: data.couponCode, couponSentStatus: 'pending' }
              : item
          )
        );
        if (previewStudent && previewStudent.id === student.id) {
          setPreviewStudent((prev) => ({ ...prev, couponCode: data.couponCode, couponSentStatus: 'pending' }));
        }
      } else {
        showToast(data.message || 'Failed to regenerate coupon code', 'error');
      }
    } catch (err) {
      console.error('Error regenerating coupon:', err);
      showToast('Network error while regenerating coupon', 'error');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Target recipients for Bulk Send
  const getBulkRecipients = () => {
    if (selectedIds.size > 0) {
      return coupons.filter((c) => selectedIds.has(c.id));
    }
    // Default: all pending in current view/filter
    return coupons.filter((c) => c.couponSentStatus !== 'sent');
  };

  const handleOpenBulkModal = () => {
    const targets = getBulkRecipients();
    if (targets.length === 0) {
      showToast('No eligible paid students found to send coupons to.', 'error');
      return;
    }
    setBulkProgress({
      inProgress: false,
      total: targets.length,
      current: 0,
      sent: 0,
      failed: 0,
      results: []
    });
    setBulkModalOpen(true);
  };

  // Execute Bulk Send in Fast Streaming Batches
  const handleExecuteBulkSend = async () => {
    const targets = getBulkRecipients();
    if (targets.length === 0) return;

    setBulkProgress({
      inProgress: true,
      total: targets.length,
      current: 0,
      sent: 0,
      failed: 0,
      results: []
    });

    const BATCH_SIZE = 12; // 12 emails per batch with 4 concurrent workers on server
    let totalSent = 0;
    let totalFailed = 0;
    const accumulatedResults = [];

    try {
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);

        const res = await fetch(`${backendUrl}/api/club-events/coupons/bulk-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: batch })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          totalSent += (data.summary?.sent ?? 0);
          totalFailed += (data.summary?.failed ?? 0);
          if (Array.isArray(data.results)) {
            accumulatedResults.push(...data.results);
          }
        } else {
          totalFailed += batch.length;
          batch.forEach((b) => {
            accumulatedResults.push({
              rNo: b.rNo,
              name: b.name,
              success: false,
              error: data.message || 'Batch failed'
            });
          });
        }

        const isLastBatch = i + BATCH_SIZE >= targets.length;
        setBulkProgress({
          inProgress: !isLastBatch,
          total: targets.length,
          current: Math.min(i + BATCH_SIZE, targets.length),
          sent: totalSent,
          failed: totalFailed,
          results: [...accumulatedResults]
        });
      }

      showToast(`Bulk email dispatch completed! Sent: ${totalSent}, Failed: ${totalFailed}`, totalFailed > 0 ? 'info' : 'success');
      fetchCoupons();
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Error executing bulk send:', err);
      showToast('Network error during bulk dispatch', 'error');
      setBulkProgress((prev) => ({ ...prev, inProgress: false }));
    }
  };

  // Download Pass as Image (PNG) using html2canvas
  const handleDownloadPassPNG = async (student) => {
    if (!passCardRef.current) return;
    setIsDownloadingImage(true);
    try {
      const canvas = await html2canvas(passCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Aditya_Event_Pass_${student.rNo}_${student.couponCode}.png`;
      link.href = imgData;
      link.click();
      showToast('Downloaded official coupon pass image!');
    } catch (err) {
      console.error('Error downloading pass image:', err);
      showToast('Failed to download image. Try printing instead.', 'error');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  // Download Pass as PDF using direct fetch blob
  const handleDownloadPassPDF = async (student) => {
    try {
      showToast('Generating official event pass PDF...');
      const params = new URLSearchParams({
        registrationId: student.registrationId,
        rNo: student.rNo,
      });
      if (student.memberId) {
        params.append('memberId', student.memberId);
      }
      const downloadUrl = `${backendUrl}/api/club-events/coupons/download-pdf?${params.toString()}`;
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cleanRNo = String(student.rNo || 'student').replace(/[^a-zA-Z0-9]/g, '');
      const cleanCode = String(student.couponCode || 'PASS').replace(/[^a-zA-Z0-9-]/g, '');
      a.download = `Aditya_Event_Pass_${cleanRNo}_${cleanCode}.pdf`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Official PDF Pass downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF download error:', err);
      // Fallback to opening directly in browser
      const params = new URLSearchParams({
        registrationId: student.registrationId,
        rNo: student.rNo,
      });
      if (student.memberId) params.append('memberId', student.memberId);
      window.open(`${backendUrl}/api/club-events/coupons/download-pdf?${params.toString()}`, '_blank');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (coupons.length === 0) {
      showToast('No records to export', 'error');
      return;
    }

    const headers = [
      'Roll Number',
      'Name',
      'Email',
      'Phone',
      'Branch',
      'Event Name',
      'Team Name',
      'Role',
      'Coupon Code',
      'Payment Status',
      'Amount Paid',
      'Transaction ID',
      'Coupon Sent Status',
      'Coupon Sent At'
    ];

    const escapeCSV = (val) => {
      const str = String(val || '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = coupons.map((c) => [
      escapeCSV(c.rNo),
      escapeCSV(c.name),
      escapeCSV(c.email),
      escapeCSV(c.phone),
      escapeCSV(c.branch),
      escapeCSV(c.eventName),
      escapeCSV(c.teamName),
      escapeCSV(c.isLeader ? 'Leader' : 'Member'),
      escapeCSV(c.couponCode),
      escapeCSV(c.paymentStatus),
      escapeCSV(c.amountPaid),
      escapeCSV(c.transactionId),
      escapeCSV(c.couponSentStatus),
      escapeCSV(c.couponSentAt ? new Date(c.couponSentAt).toLocaleString('en-IN') : 'Not Sent')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Paid_Student_Coupons_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported coupons CSV successfully!');
  };

  // Pagination calculation
  const totalItems = coupons.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentItems = coupons.slice(startIndex, startIndex + pageSize);

  const isAllSelected = coupons.length > 0 && selectedIds.size === coupons.length;

  return (
    <div className="send-coupons-page">
      {/* Toast Feedback */}
      {toast && (
        <div className={`send-coupons-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-container">
        <div className="page-title-group">
          <div className="title-badge-row">
            <h1>
              <Ticket size={28} style={{ color: 'var(--primary-color)' }} />
              Event Coupons & Email Dispatch
            </h1>
          </div>
          <p>
            Generate unique coupon codes for all paid team members event-wise, preview official passes, and bulk send coupons to emails.
          </p>
        </div>

        <div className="header-action-buttons">
          {/* SMTP Status Indicator */}
          <button
            className={`smtp-status-pill ${smtpStatus?.isConfigured ? 'configured' : 'simulated'}`}
            onClick={() => setSmtModalOpen(true)}
            title="Click to view Email/SMTP delivery status"
          >
            <ShieldCheck size={14} />
            <span>{smtpStatus?.isConfigured ? 'Live SMTP Ready' : 'Preview Mode (Ethereal)'}</span>
          </button>

          {/* Refresh */}
          <button className="btn-secondary-action" onClick={fetchCoupons} title="Refresh records">
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          {/* Export CSV */}
          <button className="btn-secondary-action" onClick={handleExportCSV} title="Export to CSV">
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {/* Bulk Send Mail Button */}
          <button
            className="btn-bulk-send"
            onClick={handleOpenBulkModal}
            disabled={isLoading || coupons.length === 0}
            title="Bulk send or resend coupon emails to paid members"
          >
            {selectedIds.size > 0 ? <RotateCcw size={16} /> : <Mail size={18} />}
            <span>
              {selectedIds.size > 0
                ? `Bulk Resend / Send (${selectedIds.size})`
                : `Bulk Send Mail (${stats.pending || 0})`}
            </span>
          </button>

          {/* Scan Attendance Quick Button */}
          <Link
            to="/dashboard/events/scan-attendance"
            className="btn-secondary-action"
            style={{
              borderColor: 'var(--primary-color)',
              color: 'var(--primary-color)',
              background: 'rgba(235, 131, 23, 0.08)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
            title="Scan Pass to Mark Attendance"
          >
            <QrCode size={16} />
            <span>Scan Attendance</span>
          </Link>

          {/* Direct link back to registrations */}
          <Link to="/dashboard/events/registrations" className="btn-secondary-action" title="Back to registrations">
            <span>&larr; Registrations</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="coupons-stats-grid">
        <div className="stat-box">
          <div className="stat-box-icon blue">
            <Users size={26} />
          </div>
          <div className="stat-box-content">
            <span className="stat-box-title">Paid Participants</span>
            <span className="stat-box-number">{stats.total}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-icon green">
            <CheckCircle2 size={26} />
          </div>
          <div className="stat-box-content">
            <span className="stat-box-title">Coupons Sent</span>
            <span className="stat-box-number">{stats.sent}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-icon amber">
            <Clock size={26} />
          </div>
          <div className="stat-box-content">
            <span className="stat-box-title">Coupons Pending</span>
            <span className="stat-box-number">{stats.pending}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-icon purple">
            <Layers size={26} />
          </div>
          <div className="stat-box-content">
            <span className="stat-box-title">Events With Paid</span>
            <span className="stat-box-number">{eventsList.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="coupons-controls-bar">
        <div className="controls-left-group">
          {/* Search Box */}
          <div className="search-field-container">
            <Search size={18} className="search-field-icon" />
            <input
              type="text"
              placeholder="Search by roll no, name, email, coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-field-input"
            />
            {searchQuery && (
              <button className="clear-search-icon-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Event Filter */}
          <div className="filter-field-wrapper">
            <Layers size={16} className="filter-field-icon" />
            <select
              value={filterEvent}
              onChange={(e) => handleEventFilterChange(e.target.value)}
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

          {/* Sent Status Filter */}
          <div className="filter-field-wrapper">
            <Filter size={16} className="filter-field-icon" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-dropdown-select"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="pending">Pending Sending</option>
              <option value="sent">Sent via Email</option>
            </select>
          </div>
        </div>

        {/* Selection indicator */}
        {selectedIds.size > 0 && (
          <div className="selection-info-bar">
            <span>{selectedIds.size} student(s) selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Coupons Table */}
      <div className="coupons-table-card">
        <div className="table-responsive-wrapper">
          <table className="coupons-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    title="Select all"
                  />
                </th>
                <th>PARTICIPANT</th>
                <th>EVENT & TEAM</th>
                <th>EMAIL ADDRESS</th>
                <th>PHONE</th>
                <th>UNIQUE COUPON CODE</th>
                <th>DISPATCH STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem' }}>
                    <RefreshCw size={28} className="spinning" style={{ color: 'var(--primary-color)', margin: '0 auto 0.75rem auto' }} />
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading paid participants & coupon codes...</div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-table-state">
                      <Ticket size={48} />
                      <h3>No Paid Students Found</h3>
                      <p>Try adjusting your search query, event filter, or status filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isSent = item.couponSentStatus === 'sent';
                  const isSending = sendingId === item.id;
                  const isRegenerating = regeneratingId === item.id;

                  return (
                    <tr key={item.id} className={isSelected ? 'selected-row' : ''}>
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                        />
                      </td>

                      {/* Participant */}
                      <td>
                        <div className="participant-meta-cell">
                          <span className="participant-name">
                            {item.name}
                            <span className={`role-badge ${item.isLeader ? 'leader' : 'member'}`}>
                              {item.isLeader ? 'Leader' : 'Member'}
                            </span>
                          </span>
                          <div className="participant-submeta">
                            <span className="meta-pill">{item.rNo}</span>
                            <span>{item.branch}</span>
                          </div>
                        </div>
                      </td>

                      {/* Event & Team */}
                      <td>
                        <div className="event-name-text">{item.eventName}</div>
                        {item.teamName && (
                          <div className="team-indicator">Team: {item.teamName}</div>
                        )}
                      </td>

                      {/* Email Address */}
                      <td>
                        {item.email ? (
                          <a
                            href={`mailto:${item.email}`}
                            style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}
                            title="Click to write email"
                          >
                            {item.email}
                          </a>
                        ) : (
                          <span style={{ color: '#ef4444', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            No email registered
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td>{item.phone || 'N/A'}</td>

                      {/* Unique Coupon Code */}
                      <td>
                        <div className="coupon-code-badge-container">
                          <span className="coupon-code-text">{item.couponCode}</span>
                          <button
                            className="coupon-copy-btn"
                            onClick={() => copyToClipboard(item.couponCode, item.id)}
                            title="Copy Coupon Code"
                          >
                            {copiedId === item.id ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                          </button>
                          <button
                            className="coupon-regen-btn"
                            onClick={() => handleRegenerateCode(item)}
                            disabled={isRegenerating}
                            title="Generate new unique code"
                          >
                            <RefreshCw size={13} className={isRegenerating ? 'spinning' : ''} />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill ${isSent ? 'sent' : 'pending'}`}>
                          {isSent ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          <span>{isSent ? 'Sent' : 'Pending'}</span>
                        </span>
                        {item.couponSentAt && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {new Date(item.couponSentAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="table-actions-cell" style={{ justifyContent: 'center' }}>
                          {/* View Option */}
                          <button
                            className="action-icon-btn btn-view-pass"
                            onClick={() => setPreviewStudent(item)}
                            title="View official coupon pass"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Send or Resend Single Mail */}
                          {isSent ? (
                            <button
                              className="action-pill-btn btn-resend-action"
                              onClick={() => handleSendSingleEmail(item)}
                              disabled={isSending || !item.email}
                              title={item.email ? `Resend coupon pass email to ${item.email}` : 'No email registered'}
                            >
                              <RotateCcw size={13} className={isSending ? 'spinning' : ''} />
                              <span>{isSending ? 'Sending...' : 'Resend'}</span>
                            </button>
                          ) : (
                            <button
                              className="action-pill-btn btn-send-action"
                              onClick={() => handleSendSingleEmail(item)}
                              disabled={isSending || !item.email}
                              title={item.email ? `Send coupon pass email to ${item.email}` : 'No email registered'}
                            >
                              <Send size={13} className={isSending ? 'spinning' : ''} />
                              <span>{isSending ? 'Sending...' : 'Send'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalItems)} of {totalItems} participants
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn-secondary-action"
                style={{ padding: '0.4rem 0.8rem' }}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn-secondary-action"
                style={{ padding: '0.4rem 0.8rem' }}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== VIEW COUPON PASS MODAL ==================== */}
      {previewStudent && (
        <div className="coupon-modal-backdrop" onClick={() => setPreviewStudent(null)}>
          <div className="coupon-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="coupon-modal-header">
              <h2>
                <Ticket size={20} style={{ color: '#f59e0b' }} />
                <span>Official Event Coupon Pass</span>
              </h2>
              <button className="modal-close-btn" onClick={() => setPreviewStudent(null)} title="Close Pass">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Digital Pass Card */}
            <div className="coupon-modal-body">
              <div className="digital-pass-card" ref={passCardRef}>
                {/* Header Strip */}
                <div className="pass-header-strip">
                  <div className="pass-header-brand">
                    <img
                      src="/ADITYA LOGO2.png"
                      alt="Aditya University"
                      className="pass-brand-logo"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="pass-univ-meta">
                      <div className="pass-univ-name">Aditya University</div>
                      <div className="pass-univ-sub">Official Event Pass</div>
                    </div>
                  </div>
                  <div className="pass-verified-badge">&#10003; Paid &amp; Verified</div>
                </div>

                {/* Content Area */}
                <div className="pass-content-area">
                  <div className="pass-event-title">{previewStudent.eventName}</div>

                  {/* Details Grid */}
                  <div className="pass-info-grid">
                    <div className="pass-info-cell">
                      <div className="label">Participant Name</div>
                      <div className="value">{previewStudent.name}</div>
                    </div>
                    <div className="pass-info-cell">
                      <div className="label">Roll Number</div>
                      <div className="value">{previewStudent.rNo}</div>
                    </div>
                    <div className="pass-info-cell">
                      <div className="label">Branch / Dept</div>
                      <div className="value">{previewStudent.branch || 'General'}</div>
                    </div>
                    <div className="pass-info-cell">
                      <div className="label">Role &amp; Team</div>
                      <div className="value">
                        {previewStudent.teamName
                          ? `${previewStudent.teamName} (${previewStudent.isLeader ? 'Leader' : 'Member'})`
                          : (previewStudent.isLeader ? 'Individual Participant' : 'Team Member')}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Stub Divider with Cutout Notches */}
                  <div className="pass-stub-divider">
                    <span className="stub-notch notch-left"></span>
                    <span className="stub-line"></span>
                    <span className="stub-notch notch-right"></span>
                  </div>

                  {/* Official Barcode Strip */}
                  <div className="pass-barcode-strip">
                    <div className="barcode-strip-header">
                      <div className="barcode-badge-wrap">
                        <Barcode size={13} style={{ marginRight: '4px' }} />
                        <span className="barcode-tag-badge">OFFICIAL VERIFICATION BARCODE</span>
                      </div>
                      <div className="barcode-code-display">
                        <span className="barcode-code-val">{previewStudent.couponCode}</span>
                        <button
                          className="code-copy-mini-btn"
                          onClick={() => copyToClipboard(previewStudent.couponCode, 'card-copy')}
                          title="Copy Coupon Code"
                          type="button"
                        >
                          {copiedId === 'card-copy' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Laser / Scanner Optimized Barcode */}
                    <div className="barcode-visual-box">
                      <BarcodeSVG
                        value={previewStudent.couponCode}
                        height={64}
                        showText={false}
                      />
                    </div>

                    <div className="barcode-strip-footer">
                      <span className="barcode-instruction">
                        ⚡ Scan barcode at venue entrance for instant gate verification
                      </span>
                      <span className="barcode-standard-badge">CODE-128</span>
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="pass-footer-strip">
                  <div>Issued by Aditya University</div>
                  <div className="pass-security-tag">Non-Transferable</div>
                </div>
              </div>
            </div>

            {/* Dispatch Status Pill in Modal */}
            {previewStudent.couponSentAt && (
              <div className="modal-dispatch-info-pill">
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>
                  Official pass email already dispatched on{' '}
                  <strong>
                    {new Date(previewStudent.couponSentAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </strong>
                  . You can resend again anytime below.
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="coupon-modal-actions">
              <button
                className="btn-secondary-action"
                onClick={() => copyToClipboard(previewStudent.couponCode, 'modal-copy')}
                title="Copy Coupon Code"
              >
                {copiedId === 'modal-copy' ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                <span>{copiedId === 'modal-copy' ? 'Copied' : 'Copy Code'}</span>
              </button>

              <button
                className="btn-secondary-action"
                onClick={() => window.print()}
                title="Print official pass"
              >
                <Printer size={15} />
                <span>Print</span>
              </button>

              <button
                className="btn-secondary-action"
                onClick={() => handleDownloadPassPNG(previewStudent)}
                disabled={isDownloadingImage}
                title="Download high-resolution PNG image"
              >
                <Download size={15} />
                <span>{isDownloadingImage ? 'Generating...' : 'PNG Image'}</span>
              </button>

              <button
                className="btn-primary-action download-pdf-btn"
                onClick={() => handleDownloadPassPDF(previewStudent)}
                title="Download high-resolution official vector PDF admit pass"
              >
                <Download size={15} />
                <span>Download Pass (PDF)</span>
              </button>

              {previewStudent.couponSentStatus === 'sent' ? (
                <button
                  className="btn-bulk-send send-email-btn resend-email-btn"
                  onClick={() => handleSendSingleEmail(previewStudent)}
                  disabled={sendingId === previewStudent.id || !previewStudent.email}
                  title={previewStudent.email ? `Resend email pass to ${previewStudent.email}` : 'No email address on record'}
                >
                  <RotateCcw size={15} className={sendingId === previewStudent.id ? 'spinning' : ''} />
                  <span>{sendingId === previewStudent.id ? 'Resending...' : 'Resend to Email'}</span>
                </button>
              ) : (
                <button
                  className="btn-bulk-send send-email-btn"
                  onClick={() => handleSendSingleEmail(previewStudent)}
                  disabled={sendingId === previewStudent.id || !previewStudent.email}
                  title={previewStudent.email ? `Email pass to ${previewStudent.email}` : 'No email address on record'}
                >
                  <Mail size={15} />
                  <span>{sendingId === previewStudent.id ? 'Sending...' : 'Send to Email'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== BULK SEND PROGRESS MODAL ==================== */}
      {bulkModalOpen && (
        <div className="coupon-modal-backdrop" onClick={() => !bulkProgress.inProgress && setBulkModalOpen(false)}>
          <div className="coupon-modal-container" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h2>
                <Mail size={22} style={{ color: '#f59e0b' }} />
                Bulk Coupon Email Dispatch
              </h2>
              {!bulkProgress.inProgress && (
                <button className="modal-close-btn" onClick={() => setBulkModalOpen(false)}>
                  <X size={20} />
                </button>
              )}
            </div>

            <div style={{ padding: '1.75rem' }}>
              {!bulkProgress.inProgress && bulkProgress.results.length === 0 ? (
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Confirm Email Dispatch
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                    You are about to send customized digital event coupon passes to{' '}
                    <strong style={{ color: 'var(--text-main)' }}>{bulkProgress.total}</strong> paid team members.
                  </p>

                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', margin: '1.25rem 0', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Each email will include:</div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <li>Personalized student greeting with roll number & branch</li>
                      <li>Official Coupon Pass ticket card embedded in email body</li>
                      <li>Scannable QR code verification badge</li>
                      <li>Attached standalone downloadable/printable coupon pass</li>
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button className="btn-secondary-action" onClick={() => setBulkModalOpen(false)}>
                      Cancel
                    </button>
                    <button className="btn-bulk-send" onClick={handleExecuteBulkSend}>
                      <Send size={16} />
                      <span>Start Bulk Email Send ({bulkProgress.total})</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {bulkProgress.inProgress ? 'Dispatching Coupon Emails...' : 'Bulk Dispatch Completed!'}
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.round(((bulkProgress.sent + bulkProgress.failed) / (bulkProgress.total || 1)) * 100)}%`
                      }}
                    ></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <span>
                      Processed: {bulkProgress.sent + bulkProgress.failed} / {bulkProgress.total}
                    </span>
                    <span>
                      Success: <strong style={{ color: '#10b981' }}>{bulkProgress.sent}</strong> | Failed:{' '}
                      <strong style={{ color: '#ef4444' }}>{bulkProgress.failed}</strong>
                    </span>
                  </div>

                  {/* Results List */}
                  {bulkProgress.results.length > 0 && (
                    <div className="bulk-results-list">
                      {bulkProgress.results.map((res, idx) => (
                        <div key={idx} className="bulk-result-row">
                          <div>
                            <strong style={{ color: 'var(--text-main)' }}>{res.name}</strong> ({res.rNo})
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.email}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {res.success ? (
                              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>
                                &#10003; Sent
                              </span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>
                                &#10007; {res.error || 'Failed'}
                              </span>
                            )}
                            {res.previewUrl && (
                              <div>
                                <a
                                  href={res.previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="preview-link-btn"
                                >
                                  <span>View Preview</span>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!bulkProgress.inProgress && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                      <button className="btn-primary-action" onClick={() => setBulkModalOpen(false)}>
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SMTP STATUS / INFO MODAL ==================== */}
      {smtpModalOpen && (
        <div className="coupon-modal-backdrop" onClick={() => setSmtModalOpen(false)}>
          <div className="coupon-modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h2>
                <ShieldCheck size={20} style={{ color: '#2563eb' }} />
                Email / SMTP Configuration
              </h2>
              <button className="modal-close-btn" onClick={() => setSmtModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              <div style={{ background: smtpStatus?.isConfigured ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)', border: `1px solid ${smtpStatus?.isConfigured ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`, padding: '1.25rem', borderRadius: '14px', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: smtpStatus?.isConfigured ? '#059669' : '#2563eb', marginBottom: '0.5rem' }}>
                  {smtpStatus?.isConfigured ? 'Live SMTP Configured' : 'Running in Ethereal Preview Mode'}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {smtpStatus?.isConfigured
                    ? `Emails are delivered directly via ${smtpStatus.host} using sender account: ${smtpStatus.user}.`
                    : 'Real SMTP credentials are not yet configured in backend .env. The system is operating in safe simulation mode with live web preview links.'}
                </p>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <p>
                  To switch to real delivery (e.g. your Gmail or university SMTP), add the following to your backend <code>.env</code> file:
                </p>
                <pre style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                  {`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@aditya.ac.in
SMTP_PASS=your_gmail_app_password
SMTP_FROM_NAME="Aditya University Events"`}
                </pre>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button className="btn-secondary-action" onClick={() => setSmtModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendCoupons;
