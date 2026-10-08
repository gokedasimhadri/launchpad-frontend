import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  Users,
  Layers,
  IndianRupee,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  Lock
} from 'lucide-react';
import './ClubEvents.css';

const ClubEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegistration, setFilterRegistration] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [formError, setFormError] = useState('');

  // Toast notification
  const [toast, setToast] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    registration: 'open',
    slug_link: '',
    status: 'active',
    role: '',
    password: ''
  });

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper to slugify string
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fetch events
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/club-events`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setEvents(data.data);
      } else {
        showToast(data.message || 'Failed to fetch events', 'error');
      }
    } catch (err) {
      console.error('Error fetching club events:', err);
      showToast('Network error while connecting to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle open Add Modal
  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      amount: '',
      registration: 'open',
      slug_link: '',
      status: 'active',
      role: '',
      password: ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name || '',
      amount: event.amount !== undefined ? event.amount : '',
      registration: event.registration || 'open',
      slug_link: event.slug_link || '',
      status: event.status || 'active',
      role: event.role || '',
      password: event.password || ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Name change handler with auto-slug generation
  const handleNameChange = (e) => {
    const val = e.target.value;
    // Auto-update slug if user hasn't explicitly customized it or it was empty/matching
    const currentGenerated = generateSlug(formData.name);
    const shouldAutoSlug = !editingEvent && (!formData.slug_link || formData.slug_link === currentGenerated);

    setFormData(prev => ({
      ...prev,
      name: val,
      slug_link: shouldAutoSlug ? generateSlug(val) : prev.slug_link
    }));
  };

  // Form submit (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter the Club Event Name.');
      return;
    }

    if (formData.amount === '' || isNaN(Number(formData.amount)) || Number(formData.amount) < 0) {
      setFormError('Please enter a valid amount (0 or greater).');
      return;
    }

    const cleanSlug = generateSlug(formData.slug_link || formData.name);
    if (!cleanSlug) {
      setFormError('Please provide a valid slug link.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        amount: Number(formData.amount),
        registration: formData.registration,
        slug_link: cleanSlug,
        status: formData.status,
        role: formData.role ? formData.role.trim() : '',
        password: formData.password ? formData.password.trim() : ''
      };

      const url = editingEvent
        ? `${backendUrl}/api/club-events/${editingEvent._id}`
        : `${backendUrl}/api/club-events`;
      
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setFormError(result.message || 'Failed to save club event.');
        setIsSubmitting(false);
        return;
      }

      showToast(
        editingEvent
          ? `Event "${result.data.name}" updated successfully!`
          : `Event "${result.data.name}" created successfully!`,
        'success'
      );

      setIsFormModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      setFormError('An unexpected server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleOpenDeleteModal = (event) => {
    setEventToDelete(event);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/club-events/${eventToDelete._id}`, {
        method: 'DELETE'
      });
      const result = await res.json();

      if (res.ok && result.success) {
        showToast(`Event "${eventToDelete.name}" deleted successfully.`, 'success');
        setIsDeleteModalOpen(false);
        setEventToDelete(null);
        fetchEvents();
      } else {
        showToast(result.message || 'Failed to delete event', 'error');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('Network error while deleting event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle Registration (open/closed)
  const handleToggleRegistration = async (event) => {
    try {
      const res = await fetch(`${backendUrl}/api/club-events/${event._id}/toggle-registration`, {
        method: 'PATCH'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`Registration for "${event.name}" is now ${result.data.registration.toUpperCase()}.`);
        setEvents(prev => prev.map(ev => ev._id === event._id ? result.data : ev));
      }
    } catch (err) {
      console.error('Error toggling registration:', err);
    }
  };

  // Quick toggle Status (active/inactive)
  const handleToggleStatus = async (event) => {
    try {
      const res = await fetch(`${backendUrl}/api/club-events/${event._id}/toggle-status`, {
        method: 'PATCH'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`Status for "${event.name}" is now ${result.data.status.toUpperCase()}.`);
        setEvents(prev => prev.map(ev => ev._id === event._id ? result.data : ev));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Copy slug link to clipboard
  const handleCopySlug = (slug) => {
    const fullUrl = `${window.location.origin}/event/${slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedSlug(slug);
      showToast(`Link copied: ${fullUrl}`);
      setTimeout(() => setCopiedSlug(null), 2500);
    });
  };

  // Filtered Events
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      (event.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.slug_link || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesReg =
      filterRegistration === 'all' ||
      (event.registration || '').toLowerCase() === filterRegistration;

    const matchesStatus =
      filterStatus === 'all' ||
      (event.status || '').toLowerCase() === filterStatus;

    return matchesSearch && matchesReg && matchesStatus;
  });

  // Calculate Statistics
  const totalCount = events.length;
  const activeCount = events.filter(e => e.status === 'active').length;
  const openCount = events.filter(e => e.registration === 'open').length;
  const inactiveCount = events.filter(e => e.status === 'inactive').length;

  return (
    <div className="club-events-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sub Navigation Tabs under Events */}
      <div className="sub-nav-tabs">
        <button className="sub-nav-tab active">
          <Sparkles size={16} />
          <span>Club Events</span>
          <span className="tab-badge">{totalCount}</span>
        </button>
        <Link to="/dashboard/events/registrations" className="sub-nav-tab">
          <ClipboardList size={16} />
          <span>Registrations</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="club-events-header">
        <div className="header-title-area">
          <h1>
            <Sparkles size={28} style={{ color: 'var(--primary-color)' }} />
            Club Events Management
          </h1>
          <p>Create, customize, and oversee student club events, registration fees, and public slugs.</p>
        </div>
        <button className="create-event-btn" onClick={handleOpenAddModal}>
          <Plus size={20} />
          <span>Add Club Event</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="events-stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper blue">
            <Layers size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Total Events</div>
            <div className="stat-val">{totalCount}</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Active Events</div>
            <div className="stat-val">{activeCount}</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper purple">
            <Users size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Registrations Open</div>
            <div className="stat-val">{openCount}</div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper amber">
            <AlertCircle size={22} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Inactive Events</div>
            <div className="stat-val">{inactiveCount}</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="events-controls-bar glass-card">
        <div className="events-search-box">
          <Search size={18} className="events-search-icon" />
          <input
            type="text"
            placeholder="Search by event name or slug link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="events-filter-box">
          <Filter size={18} className="events-filter-icon" />
          <select
            value={filterRegistration}
            onChange={(e) => setFilterRegistration(e.target.value)}
          >
            <option value="all">All Registrations</option>
            <option value="open">Open Only</option>
            <option value="closed">Closed Only</option>
          </select>
        </div>

        <div className="events-filter-box">
          <Filter size={18} className="events-filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <button className="refresh-btn" onClick={fetchEvents} title="Refresh list">
          <RefreshCw size={16} className={isLoading ? 'spin-icon' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table Data View */}
      <div className="events-table-wrapper glass-card">
        <table className="events-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>S.No</th>
              <th>Club Event Name</th>
              <th>Role Username</th>
              <th>Amount</th>
              <th>Registration</th>
              <th>Slug Link</th>
              <th>Status</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p style={{ color: 'var(--text-muted)' }}>Loading club events...</p>
                </td>
              </tr>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <tr key={event._id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="event-name-cell">
                      <div className="event-icon-avatar">
                        {event.name ? event.name.charAt(0).toUpperCase() : 'E'}
                      </div>
                      <div className="event-name-title">{event.name}</div>
                    </div>
                  </td>
                  <td>
                    {event.role ? (
                      <span style={{
                        background: 'rgba(13, 35, 59, 0.08)',
                        color: 'var(--primary-color)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.82rem'
                      }}>
                        {event.role}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className="amount-tag">
                      ₹{event.amount !== undefined ? event.amount : 0}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`status-pill ${event.registration}`}
                      onClick={() => handleToggleRegistration(event)}
                      title="Click to toggle registration state"
                    >
                      <span className="status-dot"></span>
                      <span>{event.registration}</span>
                    </button>
                  </td>
                  <td>
                    <div className="slug-cell" title={`Full Link: ${window.location.origin}/event/${event.slug_link}`}>
                      <span>/{event.slug_link}</span>
                      <button
                        className="copy-slug-btn"
                        onClick={() => handleCopySlug(event.slug_link)}
                        title="Copy full slug link"
                      >
                        {copiedSlug === event.slug_link ? (
                          <Check size={14} style={{ color: '#10b981' }} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`status-pill ${event.status}`}
                      onClick={() => handleToggleStatus(event)}
                      title="Click to toggle status"
                    >
                      <span className="status-dot"></span>
                      <span>{event.status}</span>
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <Link
                        to={`/dashboard/events/registrations?eventId=${event._id}`}
                        className="action-btn"
                        style={{ color: 'var(--primary-color)' }}
                        title="View Event Registrations"
                      >
                        <ClipboardList size={16} />
                      </Link>
                      <button
                        className="action-btn edit"
                        onClick={() => handleOpenEditModal(event)}
                        title="Edit Event"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleOpenDeleteModal(event)}
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  <div className="empty-events-state">
                    <div className="empty-events-icon">
                      <Calendar size={32} />
                    </div>
                    <h3>No Club Events Found</h3>
                    <p>
                      {searchQuery || filterRegistration !== 'all' || filterStatus !== 'all'
                        ? 'No events match your current filter settings. Try adjusting the search or filters.'
                        : 'There are no club events created yet. Click the button below to add your first event.'}
                    </p>
                    {(!searchQuery && filterRegistration === 'all' && filterStatus === 'all') && (
                      <button className="create-event-btn" onClick={handleOpenAddModal} style={{ marginTop: '0.5rem' }}>
                        <Plus size={18} />
                        <span>Create Club Event</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Event Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsFormModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Sparkles size={20} style={{ color: 'var(--primary-color)' }} />
                <span>{editingEvent ? 'Edit Club Event' : 'Add New Club Event'}</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsFormModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                {formError && (
                  <div className="form-error-alert">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Club Event Name */}
                <div className="form-group">
                  <label className="form-label">
                    Club Event Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. AI & Robotics Hackathon 2026"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label className="form-label">
                    Amount (INR ₹) <span className="required-star">*</span>
                  </label>
                  <div className="form-input-group">
                    <span className="input-prefix-icon">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-input has-prefix"
                      placeholder="e.g. 150 (Enter 0 for free event)"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Registration (Open / Closed) */}
                <div className="form-group">
                  <label className="form-label">
                    Registration <span className="required-star">*</span>
                  </label>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={`segment-btn ${formData.registration === 'open' ? 'active open' : ''}`}
                      onClick={() => setFormData({ ...formData, registration: 'open' })}
                    >
                      <CheckCircle2 size={16} />
                      <span>Open</span>
                    </button>
                    <button
                      type="button"
                      className={`segment-btn ${formData.registration === 'closed' ? 'active closed' : ''}`}
                      onClick={() => setFormData({ ...formData, registration: 'closed' })}
                    >
                      <X size={16} />
                      <span>Closed</span>
                    </button>
                  </div>
                </div>

                {/* Slug Link */}
                <div className="form-group">
                  <label className="form-label">
                    Slug Link <span className="required-star">*</span>
                  </label>
                  <div className="form-input-group">
                    <LinkIcon size={16} className="input-prefix-icon" />
                    <input
                      type="text"
                      className="form-input has-prefix"
                      placeholder="e.g. robotics-hackathon-2026"
                      value={formData.slug_link}
                      onChange={(e) => setFormData({ ...formData, slug_link: generateSlug(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="slug-preview-box">
                    <span>
                      Public URL: <span className="slug-preview-text">/event/{formData.slug_link || 'your-slug'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, slug_link: generateSlug(prev.name) }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-color)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Reset from name
                    </button>
                  </div>
                </div>

                {/* Role / Username for login */}
                <div className="form-group">
                  <label className="form-label">
                    Role Name / Username (For Frontend Login)
                  </label>
                  <div className="form-input-group">
                    <Users size={16} className="input-prefix-icon" />
                    <input
                      type="text"
                      className="form-input has-prefix"
                      placeholder="e.g. leoclub or robotics_admin"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                  <span className="helper-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Username used to log into frontend with event privileges
                  </span>
                </div>

                {/* Password for login */}
                <div className="form-group">
                  <label className="form-label">
                    Role Password
                  </label>
                  <div className="form-input-group">
                    <Lock size={16} className="input-prefix-icon" />
                    <input
                      type="password"
                      className="form-input has-prefix"
                      placeholder="Enter password for role"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <span className="helper-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Password required for role login
                  </span>
                </div>

                {/* Status (Active / Inactive) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Status <span className="required-star">*</span>
                  </label>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={`segment-btn ${formData.status === 'active' ? 'active active-status' : ''}`}
                      onClick={() => setFormData({ ...formData, status: 'active' })}
                    >
                      <CheckCircle2 size={16} />
                      <span>Active</span>
                    </button>
                    <button
                      type="button"
                      className={`segment-btn ${formData.status === 'inactive' ? 'active inactive-status' : ''}`}
                      onClick={() => setFormData({ ...formData, status: 'inactive' })}
                    >
                      <AlertCircle size={16} />
                      <span>Inactive</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-modal-btn"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-modal-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>{editingEvent ? 'Update Event' : 'Create Event'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && eventToDelete && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#ef4444' }}>
                <AlertCircle size={20} />
                <span>Confirm Event Deletion</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '0.8rem', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete{' '}
                <strong>"{eventToDelete.name}"</strong>?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This event with slug <code>/{eventToDelete.slug_link}</code> will be removed. This action cannot be reversed.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="cancel-modal-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubEvents;
