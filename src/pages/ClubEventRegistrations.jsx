import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ClipboardList,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Users,
  CreditCard,
  X,
  Phone,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  Layers,
  AlertCircle,
  ShieldCheck,
  Ticket
} from 'lucide-react';
import './ClubEventRegistrations.css';

const ClubEventRegistrations = () => {
  // Current user info
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

  const [registrations, setRegistrations] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [filterRole, setFilterRole] = useState(isDean ? 'all' : (currentUsername || ''));
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, free: 0, totalRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState(initialEventFilter);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedTeamRecord, setSelectedTeamRecord] = useState(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [manualTxnInput, setManualTxnInput] = useState('');
  const [isVerifyingSingle, setIsVerifyingSingle] = useState(false);

  const handleSyncAllPending = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${backendUrl}/api/club-events/sync-all-pending`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Synced ${data.syncedCount || 0} payment(s)`);
        fetchRegistrations();
      } else {
        showToast(data.message || 'Failed to sync payments', 'error');
      }
    } catch (err) {
      console.error('Sync error:', err);
      showToast('Network error while syncing payments', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerifySinglePayment = async (reg, customTxnId = '') => {
    setIsVerifyingSingle(true);
    try {
      const res = await fetch(`${backendUrl}/api/club-events/verify-razorpay-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: reg._id,
          rNo: reg.rNo,
          razorpayPaymentId: customTxnId || manualTxnInput
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Verified & Paid for ${reg.rNo}!`);
        setSelectedRecord(null);
        setManualTxnInput('');
        fetchRegistrations();
      } else {
        showToast(data.message || 'Verification failed.', 'error');
      }
    } catch (err) {
      console.error('Verification error:', err);
      showToast('Network error during verification.', 'error');
    } finally {
      setIsVerifyingSingle(false);
    }
  };

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch available roles (for Dean)
  const fetchRoles = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/club-events/roles`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailableRoles(data.data);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    if (isDean) {
      fetchRoles();
    }
  }, [isDean]);

  // Fetch events list for dropdown
  const fetchEventsList = async () => {
    try {
      const activeRole = !isDean ? currentUsername : (filterRole !== 'all' ? filterRole : '');
      const queryParams = new URLSearchParams();
      if (activeRole) {
        queryParams.append('role', activeRole);
      }
      const qs = queryParams.toString();
      const res = await fetch(`${backendUrl}/api/club-events${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        let list = data.data;
        if (!isDean && currentUsername) {
          list = list.filter(e => (e.role || '').trim().toLowerCase() === currentUsername.toLowerCase());
        }
        setEventsList(list);
      }
    } catch (err) {
      console.error('Error fetching events list:', err);
    }
  };

  // Fetch registrations
  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const activeRole = !isDean ? currentUsername : (filterRole !== 'all' ? filterRole : '');
      const queryParams = new URLSearchParams();
      if (activeRole) {
        queryParams.append('role', activeRole);
      }
      if (filterEvent && filterEvent !== 'all') {
        queryParams.append('eventId', filterEvent);
      }
      if (filterStatus && filterStatus !== 'all') {
        queryParams.append('status', filterStatus);
      }
      if (filterBranch && filterBranch !== 'all') {
        queryParams.append('branch', filterBranch);
      }
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      const queryString = queryParams.toString();
      const url = `${backendUrl}/api/club-events/registrations${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setRegistrations(data.data);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        showToast(data.message || 'Failed to fetch registrations', 'error');
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      showToast('Network error while fetching registrations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsList();
  }, [filterRole]);

  useEffect(() => {
    fetchRegistrations();
  }, [filterEvent, filterStatus, filterBranch, filterRole]);

  // Handle live search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRegistrations();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Update URL params when event filter changes
  const handleEventFilterChange = (newVal) => {
    setFilterEvent(newVal);
    setCurrentPage(1);
    if (newVal && newVal !== 'all') {
      setSearchParams({ eventId: newVal });
    } else {
      setSearchParams({});
    }
  };

  // Unique branches from current data
  const uniqueBranches = useMemo(() => {
    const set = new Set();
    registrations.forEach(r => {
      if (r.branch && r.branch !== 'N/A') set.add(r.branch.toUpperCase());
    });
    return Array.from(set).sort();
  }, [registrations]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterEvent('all');
    setFilterStatus('all');
    setFilterBranch('all');
    setSearchParams({});
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || filterEvent !== 'all' || filterStatus !== 'all' || filterBranch !== 'all';

  // Pagination calculation
  const totalItems = registrations.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentRegistrations = registrations.slice(startIndex, startIndex + pageSize);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // CSV Export with all team members in a single row
  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    // Find the max team members count across the registrations to create columns
    const maxTeamMembers = Math.max(
      1,
      ...registrations.map(r => (r.teamMembers && r.teamMembers.length) || (r.teamSize || 1))
    );

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Build headers with leader details
    const headers = [
      'S.No',
      'Roll Number (Leader)',
      'Student Name (Leader)',
      'Team Type',
      'Total Team Members',
      'Event Name',
      'Branch (Leader)',
      'Gender (Leader)',
      'Phone Number (Leader)',
      'Email (Leader)'
    ];

    // Additional columns for Member 2, Member 3, etc.
    for (let i = 2; i <= maxTeamMembers; i++) {
      headers.push(
        `Member ${i} Roll No`,
        `Member ${i} Name`,
        `Member ${i} Branch`,
        `Member ${i} Gender`,
        `Member ${i} Phone`,
        `Member ${i} Email`
      );
    }

    // Payment and transaction headers
    headers.push(
      'Amount Paid (INR)',
      'Payment Status',
      'Transaction ID',
      'Razorpay Payment ID',
      'Razorpay Order ID',
      'Registered Date',
      'All Team Members (Summary)'
    );

    const rows = registrations.map((r, index) => {
      // Normalize team members list
      const membersList = (r.teamMembers && r.teamMembers.length > 0)
        ? r.teamMembers
        : [{
            rNo: r.rNo,
            name: r.name,
            branch: r.branch,
            gender: r.gender,
            phone: r.phone,
            email: r.email,
            isLeader: true
          }];

      const leader = membersList[0] || {};

      const row = [
        index + 1,
        escapeCSV(leader.rNo || r.rNo || ''),
        escapeCSV(leader.name || r.name || ''),
        escapeCSV(r.teamType === 'per_team' ? 'Per Team' : 'Individual'),
        membersList.length || r.teamSize || 1,
        escapeCSV(r.eventName || ''),
        escapeCSV(leader.branch || r.branch || ''),
        escapeCSV(leader.gender || r.gender || ''),
        escapeCSV(leader.phone || r.phone || ''),
        escapeCSV(leader.email || r.email || '')
      ];

      // Columns for Member 2 to maxTeamMembers
      for (let i = 1; i < maxTeamMembers; i++) {
        const m = membersList[i];
        if (m) {
          row.push(
            escapeCSV(m.rNo || ''),
            escapeCSV(m.name || ''),
            escapeCSV(m.branch || ''),
            escapeCSV(m.gender || ''),
            escapeCSV(m.phone || ''),
            escapeCSV(m.email || '')
          );
        } else {
          row.push('""', '""', '""', '""', '""', '""');
        }
      }

      // Combined summary of all members in one cell for convenience
      const summaryText = membersList.map((m, idx) => {
        const role = idx === 0 ? 'Leader' : `Member ${idx + 1}`;
        const parts = [
          m.name || 'Unnamed',
          m.rNo ? `Roll: ${m.rNo}` : '',
          m.branch ? `Branch: ${m.branch}` : '',
          m.phone ? `Phone: ${m.phone}` : '',
          m.gender ? `Gender: ${m.gender}` : '',
          m.email ? `Email: ${m.email}` : ''
        ].filter(Boolean);
        return `[${role}] ${parts.join(', ')}`;
      }).join(' | ');

      row.push(
        Math.floor(r.amountPaid !== undefined ? r.amountPaid : 0),
        escapeCSV((r.paymentStatus || '').toUpperCase()),
        escapeCSV(r.transactionId || r.razorpayPaymentId || ''),
        escapeCSV(r.razorpayPaymentId || ''),
        escapeCSV(r.razorpayOrderId || ''),
        escapeCSV(formatDate(r.createdAt)),
        escapeCSV(summaryText)
      );

      return row.join(',');
    });

    // Prefix UTF-8 BOM so Microsoft Excel correctly reads special characters and UTF-8 formatting
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event_registrations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${registrations.length} registrations with team members in single row to Excel CSV`);
  };

  return (
    <div className="registrations-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sub Navigation Tabs under Events */}
      <div className="sub-nav-tabs">
        <Link to="/dashboard/events/club-events" className="sub-nav-tab">
          <Sparkles size={16} />
          <span>Club Events</span>
        </Link>
        <button className="sub-nav-tab active">
          <ClipboardList size={16} />
          <span>Registrations</span>
          <span className="tab-badge">{stats.total || registrations.length}</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="registrations-header">
        <div className="header-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={28} style={{ color: 'var(--primary-color)' }} />
              Event Registrations
            </h1>
            {!isDean && currentUsername && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: '600',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                background: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                color: '#1d4ed8'
              }}>
                <User size={14} />
                <span>Role: {currentUsername}</span>
              </span>
            )}
          </div>
          <p style={{ marginTop: '0.35rem' }}>
            {!isDean && currentUsername
              ? `Real-time records for events managed under role "${currentUsername}".`
              : 'Real-time records of registered students, roll numbers, branches, payment transactions, and fees.'}
          </p>
        </div>
        <div className="header-actions">
          <button className="header-refresh-btn" onClick={fetchRegistrations} title="Refresh records">
            <RefreshCw size={17} className={isLoading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button
            className="export-csv-btn"
            onClick={handleSyncAllPending}
            disabled={isSyncing}
            title="Scan and sync all pending registrations against Razorpay live transactions"
            style={{ background: '#10b981', borderColor: '#10b981' }}
          >
            <ShieldCheck size={18} className={isSyncing ? 'spinning' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Razorpay'}</span>
          </button>
          <button
            className="export-csv-btn"
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
            title="Export filtered records to CSV"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <Link
            to="/dashboard/events/sendcoupons"
            className="export-csv-btn"
            title="Send Unique Coupon Codes to Paid Students & Team Members"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderColor: '#d97706',
              color: '#ffffff',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)'
            }}
          >
            <Ticket size={18} />
            <span>Send Coupons</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="registrations-stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper blue">
            <Users size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Total Registrations</div>
            <div className="stat-val">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Paid Registrations</div>
            <div className="stat-val">{stats.paid}</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper amber">
            <AlertCircle size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Pending Payment</div>
            <div className="stat-val">{stats.pending || 0}</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper purple">
            <Sparkles size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Free Registrations</div>
            <div className="stat-val">{stats.free}</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper amber">
            <IndianRupee size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Total Collections</div>
            <div className="stat-val">₹{Math.floor(Number(stats.totalRevenue || 0)).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls Bar */}
      <div className="registrations-controls-bar glass-card">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by roll no, name, phone, transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Role (Dean) or Role Badge (Club Manager) */}
        {isDean ? (
          <div className="filter-item">
            <User size={16} className="filter-icon" />
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setFilterEvent('all');
                setCurrentPage(1);
              }}
              className="filter-select"
              title="Filter by Role"
            >
              <option value="all">All Roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>Role: {r}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="role-locked-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.85rem',
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: '8px',
            color: '#1d4ed8',
            fontWeight: '600',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap'
          }}>
            <User size={16} />
            <span>Role: {currentUsername}</span>
          </div>
        )}

        {/* Filter Event */}
        <div className="filter-item">
          <Layers size={16} className="filter-icon" />
          <select
            value={filterEvent}
            onChange={(e) => handleEventFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events</option>
            {eventsList.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="filter-item">
          <Filter size={16} className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending Payment</option>
          </select>
        </div>

        {/* Filter Branch */}
        {uniqueBranches.length > 0 && (
          <div className="filter-item">
            <GraduationCap size={16} className="filter-icon" />
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map((br) => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button className="reset-filters-btn" onClick={handleResetFilters}>
            <X size={15} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Registrations Table Container */}
      <div className="registrations-table-card glass-card">
        {isLoading ? (
          <div className="table-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading registrations data...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon-wrapper">
              <ClipboardList size={40} />
            </div>
            <h3>No registrations found</h3>
            <p>
              {hasActiveFilters
                ? 'No student registrations match your filter criteria. Try clearing search or filters.'
                : 'No students have registered for club events yet.'}
            </p>
            {hasActiveFilters && (
              <button className="clear-filters-action-btn" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="registrations-table">
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>ROLL NO</th>
                    <th>STUDENT / TEAM</th>
                    <th>EVENT NAME</th>
                    <th>BRANCH</th>
                    <th>GENDER</th>
                    <th>PHONE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>TRANSACTION ID</th>
                    <th>REGISTERED AT</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRegistrations.map((reg, index) => {
                    const rowNumber = startIndex + index + 1;
                    const txn = reg.transactionId || reg.razorpayPaymentId || '-';
                    return (
                      <tr key={reg._id || index} className="reg-row">
                        <td className="sno-cell">{rowNumber}</td>
                        <td className="roll-cell">
                          <button
                            className="badge-copy-btn"
                            onClick={() => copyToClipboard(reg.rNo, `roll-${reg._id}`)}
                            title="Click to copy roll number"
                          >
                            <span className="roll-badge">{reg.rNo}</span>
                            {copiedId === `roll-${reg._id}` ? (
                              <Check size={13} className="copy-success" />
                            ) : (
                              <Copy size={13} className="copy-icon" />
                            )}
                          </button>
                        </td>
                        <td className="name-cell">
                          <span className="student-name">{reg.name}</span>
                          {reg.teamType === 'per_team' && (
                            <div style={{ marginTop: '4px' }}>
                              <button
                                type="button"
                                className="team-count-clickable-badge"
                                onClick={() => setSelectedTeamRecord(reg)}
                                title="Click to view all team members data"
                              >
                                <Users size={12} />
                                <span>Team ({reg.teamMembers?.length || reg.teamSize || 1} members)</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="event-cell">
                          <span className="event-name-tag" title={reg.eventName}>
                            {reg.eventName}
                          </span>
                        </td>
                        <td className="branch-cell">
                          <span className="branch-badge">{reg.branch || 'N/A'}</span>
                        </td>
                        <td className="gender-cell">{reg.gender || '-'}</td>
                        <td className="phone-cell">
                          {reg.phone && reg.phone !== 'N/A' ? (
                            <a href={`tel:${reg.phone}`} className="phone-link">
                              <Phone size={12} />
                              <span>{reg.phone}</span>
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="amount-cell">
                          <span className="amount-val">
                            {reg.amountPaid && Number(reg.amountPaid) > 0
                              ? `₹${Math.floor(Number(reg.amountPaid))}`
                              : '0'}
                          </span>
                        </td>
                        <td className="status-cell">
                          <span className={`status-pill ${reg.paymentStatus || 'free'}`}>
                            {reg.paymentStatus === 'paid' ? (
                              <>
                                <span className="pill-dot green"></span>
                                PAID
                              </>
                            ) : reg.paymentStatus === 'pending' ? (
                              <>
                                <span className="pill-dot amber"></span>
                                PENDING
                              </>
                            ) : (
                              <>
                                <span className="pill-dot purple"></span>
                                FREE
                              </>
                            )}
                          </span>
                        </td>
                        <td className="txn-cell">
                          {txn !== '-' ? (
                            <button
                              className="badge-copy-btn txn-badge"
                              onClick={() => copyToClipboard(txn, `txn-${reg._id}`)}
                              title="Click to copy Transaction ID"
                            >
                              <span className="txn-text">{txn}</span>
                              {copiedId === `txn-${reg._id}` ? (
                                <Check size={12} className="copy-success" />
                              ) : (
                                <Copy size={12} className="copy-icon" />
                              )}
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="date-cell">
                          <span className="date-text">{formatDate(reg.createdAt)}</span>
                        </td>
                        <td className="action-cell" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          {reg.paymentStatus === 'pending' && (
                            <button
                              className="view-btn"
                              onClick={() => handleVerifySinglePayment(reg)}
                              disabled={isVerifyingSingle}
                              title="Verify & Sync Payment with Razorpay Gateway"
                              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                            >
                              <ShieldCheck size={16} />
                            </button>
                          )}
                          <button
                            className="view-btn"
                            onClick={() => setSelectedRecord(reg)}
                            title="View Full Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="table-pagination-bar">
              <div className="pagination-info">
                Showing <strong>{startIndex + 1}</strong> to{' '}
                <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> of{' '}
                <strong>{totalItems}</strong> entries
              </div>

              <div className="pagination-controls">
                <div className="page-size-selector">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per page</span>
                </div>

                <div className="page-nav-btns">
                  <button
                    className="page-nav-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    <ChevronLeft size={16} />
                    <span>Prev</span>
                  </button>
                  <span className="page-indicator">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="page-nav-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="reg-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="reg-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="reg-modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-title-icon">
                  <User size={22} />
                </div>
                <div>
                  <h2>Student Registration Details</h2>
                  <p>Registered for {selectedRecord.eventName}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedRecord(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="reg-modal-body">
              {/* Event Section */}
              <div className="modal-section">
                <h3>Event Information</h3>
                <div className="modal-grid">
                  <div className="detail-item">
                    <span className="label">Event Name</span>
                    <span className="value strong">{selectedRecord.eventName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Event Slug</span>
                    <span className="value code-val">/event/{selectedRecord.eventSlug}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Team Type</span>
                    <span className="value strong">
                      {selectedRecord.teamType === 'per_team' ? 'Per Team' : 'Per Head (Individual)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Information Section (If Per Team) */}
              {selectedRecord.teamType === 'per_team' && (
                <div className="modal-section" style={{ background: 'rgba(99, 102, 241, 0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4f46e5' }}>
                      <Users size={18} /> Team Information
                    </h3>
                    <span style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#4f46e5',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {selectedRecord.teamMembers?.length || selectedRecord.teamSize || 1} Persons
                    </span>
                  </div>
                  <div className="modal-grid" style={{ marginBottom: '0.75rem' }}>
                    <div className="detail-item">
                      <span className="label">Total Members</span>
                      <span className="value strong">
                        {selectedRecord.teamMembers?.length || selectedRecord.teamSize || 1} Persons
                      </span>
                    </div>
                  </div>

                  {selectedRecord.teamMembers && selectedRecord.teamMembers.length > 0 && (
                    <div style={{ marginTop: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '7px 10px' }}>#</th>
                            <th style={{ padding: '7px 10px' }}>Roll No</th>
                            <th style={{ padding: '7px 10px' }}>Name</th>
                            <th style={{ padding: '7px 10px' }}>Branch</th>
                            <th style={{ padding: '7px 10px' }}>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRecord.teamMembers.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < selectedRecord.teamMembers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <td style={{ padding: '7px 10px', color: '#64748b' }}>
                                {idx === 0 ? '👑 1' : idx + 1}
                              </td>
                              <td style={{ padding: '7px 10px', fontWeight: 600 }}>{m.rNo}</td>
                              <td style={{ padding: '7px 10px' }}>
                                {m.name} {idx === 0 && <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700 }}>(Leader)</span>}
                              </td>
                              <td style={{ padding: '7px 10px', color: '#64748b' }}>{m.branch || '-'}</td>
                              <td style={{ padding: '7px 10px', color: '#64748b' }}>{m.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Student Section */}
              <div className="modal-section">
                <h3>{selectedRecord.teamType === 'per_team' ? 'Team Leader / Primary Contact' : 'Student Profile'}</h3>
                <div className="modal-grid">
                  <div className="detail-item">
                    <span className="label">Roll Number</span>
                    <span className="value strong roll-tag">{selectedRecord.rNo}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Full Name</span>
                    <span className="value strong">{selectedRecord.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email Address</span>
                    <span className="value">{selectedRecord.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Branch</span>
                    <span className="value">{selectedRecord.branch || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Gender</span>
                    <span className="value">{selectedRecord.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone Number</span>
                    <span className="value">
                      {selectedRecord.phone ? (
                        <a href={`tel:${selectedRecord.phone}`} className="phone-link">
                          <Phone size={13} />
                          {selectedRecord.phone}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="modal-section">
                <h3>Payment & Registration Meta</h3>
                <div className="modal-grid">
                  <div className="detail-item">
                    <span className="label">Payment Status</span>
                    <span className={`status-pill ${selectedRecord.paymentStatus || 'free'}`}>
                      {selectedRecord.paymentStatus === 'paid'
                        ? 'PAID'
                        : selectedRecord.paymentStatus === 'pending'
                        ? 'PENDING PAYMENT'
                        : 'FREE'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Amount</span>
                    <span className="value strong amount-highlight">
                      ₹{Math.floor(Number(selectedRecord.amountPaid || 0))}
                    </span>
                  </div>
                  {selectedRecord.paymentStatus === 'pending' && (
                    <div className="detail-item full-width" style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', marginTop: '0.5rem' }}>
                      <span className="label" style={{ color: '#10b981', fontWeight: '700', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={16} />
                        <span>Verify Payment with Razorpay</span>
                      </span>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        If amount was deducted from student's account but status is pending, enter Razorpay Payment ID below (or leave blank to auto-search order).
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Enter Razorpay Payment ID (e.g. pay_TlHaG6rJi1aaqi)"
                          value={manualTxnInput}
                          onChange={(e) => setManualTxnInput(e.target.value)}
                          style={{ flex: 1, fontSize: '0.88rem', height: '40px', padding: '0 0.75rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifySinglePayment(selectedRecord, manualTxnInput)}
                          disabled={isVerifyingSingle}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0 1rem',
                            fontWeight: '600',
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <ShieldCheck size={15} />
                          <span>{isVerifyingSingle ? 'Verifying...' : 'Verify & Mark Paid'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedRecord.paymentStatus === 'pending' && (
                    <div className="detail-item full-width" style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <span className="label" style={{ color: '#f59e0b', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>Direct Payment Link for Student</span>
                      <div className="copyable-box">
                        <code>{`${window.location.origin}/event/${selectedRecord.eventSlug}/payment/${selectedRecord.rNo}`}</code>
                        <button
                          className="copy-mini-btn"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/event/${selectedRecord.eventSlug}/payment/${selectedRecord.rNo}`,
                              'modal-pay-link'
                            )
                          }
                          title="Copy Payment Link"
                        >
                          {copiedId === 'modal-pay-link' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="detail-item full-width">
                    <span className="label">Transaction ID / Razorpay Payment ID</span>
                    <div className="copyable-box">
                      <code>{selectedRecord.transactionId || selectedRecord.razorpayPaymentId || 'N/A'}</code>
                      {(selectedRecord.transactionId || selectedRecord.razorpayPaymentId) && (
                        <button
                          className="copy-mini-btn"
                          onClick={() =>
                            copyToClipboard(
                              selectedRecord.transactionId || selectedRecord.razorpayPaymentId,
                              'modal-txn'
                            )
                          }
                        >
                          {copiedId === 'modal-txn' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedRecord.razorpayOrderId && (
                    <div className="detail-item full-width">
                      <span className="label">Razorpay Order ID</span>
                      <div className="copyable-box">
                        <code>{selectedRecord.razorpayOrderId}</code>
                        <button
                          className="copy-mini-btn"
                          onClick={() => copyToClipboard(selectedRecord.razorpayOrderId, 'modal-order')}
                        >
                          {copiedId === 'modal-order' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="detail-item full-width">
                    <span className="label">Registered Timestamp</span>
                    <span className="value">{formatDate(selectedRecord.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="reg-modal-footer">
              <button className="modal-close-action-btn" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Data Popup Modal */}
      {selectedTeamRecord && (
        <div className="reg-modal-overlay" onClick={() => setSelectedTeamRecord(null)}>
          <div
            className="reg-modal team-popup-modal glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '820px' }}
          >
            <div className="reg-modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-title-icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
                  <Users size={22} />
                </div>
                <div>
                  <h2>Team Members Data</h2>
                  <p>
                    {selectedTeamRecord.eventName} • Leader: <strong>{selectedTeamRecord.name}</strong> ({selectedTeamRecord.rNo})
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedTeamRecord(null)}
                title="Close Popup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="reg-modal-body" style={{ gap: '1.25rem' }}>
              {/* Quick Summary Pill Bar */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.85rem 1.1rem',
                background: 'rgba(37, 99, 235, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(37, 99, 235, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Members:</span>
                  <span style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '2px 9px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    {selectedTeamRecord.teamMembers?.length || selectedTeamRecord.teamSize || 1} Persons
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Payment:</span>
                  <span className={`status-pill ${selectedTeamRecord.paymentStatus || 'free'}`}>
                    {selectedTeamRecord.paymentStatus === 'paid' ? 'PAID' : selectedTeamRecord.paymentStatus === 'pending' ? 'PENDING' : 'FREE'}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                    ₹{Math.floor(Number(selectedTeamRecord.amountPaid || 0))}
                  </span>
                </div>
              </div>

              {/* Team Members Detailed Table */}
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--bg-card)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="team-popup-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>ROLL NO</th>
                        <th>STUDENT NAME</th>
                        <th>BRANCH</th>
                        <th>GENDER</th>
                        <th>PHONE</th>
                        <th>EMAIL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const membersList = (selectedTeamRecord.teamMembers && selectedTeamRecord.teamMembers.length > 0)
                          ? selectedTeamRecord.teamMembers
                          : [{
                              rNo: selectedTeamRecord.rNo,
                              name: selectedTeamRecord.name,
                              branch: selectedTeamRecord.branch,
                              gender: selectedTeamRecord.gender,
                              phone: selectedTeamRecord.phone,
                              email: selectedTeamRecord.email,
                              isLeader: true
                            }];

                        return membersList.map((m, idx) => {
                          const isLeader = idx === 0 || m.isLeader;
                          return (
                            <tr
                              key={idx}
                              style={{
                                background: isLeader ? 'rgba(37, 99, 235, 0.03)' : 'transparent'
                              }}
                            >
                              <td>
                                {isLeader ? (
                                  <span className="team-leader-pill">
                                    👑 Leader
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                    {idx + 1}
                                  </span>
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="badge-copy-btn"
                                  onClick={() => copyToClipboard(m.rNo, `team-roll-${idx}`)}
                                  title="Copy roll number"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span className="roll-badge" style={{ fontWeight: 700 }}>{m.rNo}</span>
                                  {copiedId === `team-roll-${idx}` ? (
                                    <Check size={12} className="copy-success" />
                                  ) : (
                                    <Copy size={12} className="copy-icon" />
                                  )}
                                </button>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {m.name}
                              </td>
                              <td>
                                <span className="branch-badge">{m.branch || '-'}</span>
                              </td>
                              <td>{m.gender || '-'}</td>
                              <td>
                                {m.phone ? (
                                  <a href={`tel:${m.phone}`} className="phone-link" style={{ fontSize: '0.82rem' }}>
                                    <Phone size={12} />
                                    <span>{m.phone}</span>
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {m.email ? (
                                  <a href={`mailto:${m.email}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                                    {m.email}
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const members = selectedTeamRecord.teamMembers || [];
                    const allRolls = members.map(m => m.rNo).filter(Boolean).join(', ');
                    copyToClipboard(allRolls, 'all-team-rolls');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.55rem 0.95rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={14} />
                  <span>{copiedId === 'all-team-rolls' ? 'Copied All Rolls!' : 'Copy All Roll Numbers'}</span>
                </button>

                <button
                  type="button"
                  className="clear-filters-action-btn"
                  onClick={() => setSelectedTeamRecord(null)}
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.84rem' }}
                >
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

export default ClubEventRegistrations;
