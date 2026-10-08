import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  IdCard,
  User,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Lock,
  Layers,
  RefreshCw,
  Droplet,
  Users,
  Mail
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import './ClubEventPublicRegistration.css';

const ClubEventPublicRegistration = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Event data
  const [event, setEvent] = useState(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [eventError, setEventError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    rNo: '',
    name: '',
    email: '',
    branch: '',
    phone: '',
    gender: '',
    bloodgroup: '',
  });

  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Event by Slug
  useEffect(() => {
    const fetchEvent = async () => {
      setIsEventLoading(true);
      setEventError('');
      try {
        const response = await fetch(`${backendUrl}/api/club-events/${slug}`);
        const result = await response.json();

        if (response.ok && result.success && result.data) {
          setEvent(result.data);
        } else {
          setEventError(result.message || 'Club event not found.');
        }
      } catch (err) {
        console.error('Error fetching event by slug:', err);
        setEventError('Failed to load event details. Please verify your connection.');
      } finally {
        setIsEventLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug, backendUrl]);

  // 2. Auto-populate Student Data from Roll Number & Duplicate Check
  useEffect(() => {
    const fetchStudentData = async () => {
      const cleanRNo = formData.rNo.trim();
      if (!cleanRNo || cleanRNo.length < 2 || !event) {
        setDuplicateError('');
        setPendingPaymentInfo(null);
        return;
      }

      setIsLoadingStudent(true);
      setDuplicateError('');
      setPendingPaymentInfo(null);
      const rNoUpper = cleanRNo.toUpperCase();

      try {
        // Check if student already registered for this event
        const checkRes = await fetch(`${backendUrl}/api/club-events/${slug}/check/${rNoUpper}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists) {
            if (checkData.isPaid) {
              setDuplicateError('This roll number is already registered and payment is completed.');
              setIsLoadingStudent(false);
              return;
            } else if (checkData.isPendingPayment) {
              // Registered, but payment pending -> Prompt to go straight to payment!
              setPendingPaymentInfo({
                rNo: rNoUpper,
                message: 'Registration details already saved! Proceed to complete payment.'
              });
              if (checkData.registration) {
                setFormData(prev => ({
                  ...prev,
                  rNo: rNoUpper,
                  name: checkData.registration.name || prev.name,
                  email: checkData.registration.email || prev.email,
                  branch: checkData.registration.branch || prev.branch,
                  phone: checkData.registration.phone || prev.phone,
                  gender: checkData.registration.gender || prev.gender,
                  bloodgroup: checkData.registration.bloodgroup || prev.bloodgroup,
                }));
              }
              setIsLoadingStudent(false);
              return;
            }
          }
        }

        let student = null;

        // Try 1: Fetch via backend proxy endpoint (uses backend STUDENT_API_KEY securely)
        try {
          const backendRes = await fetch(`${backendUrl}/api/student/${rNoUpper}`);
          if (backendRes.ok) {
            const bData = await backendRes.json();
            if (Array.isArray(bData) && bData.length > 0) {
              student = bData[0];
            } else if (bData && !Array.isArray(bData) && (bData.studentname || bData.name)) {
              student = bData;
            }
          }
        } catch (bErr) {
          console.warn('Backend student proxy error:', bErr);
        }

        // Try 2: If not resolved yet, fetch via direct/proxied API with X-API-Key header
        if (!student) {
          let studentApiUrl = import.meta.env.VITE_STUDENT_API_URL || 'https://info.aec.edu.in/adityaapi/api/studentdata';
          if (studentApiUrl && studentApiUrl.includes('https://info.aec.edu.in')) {
            studentApiUrl = studentApiUrl.replace('https://info.aec.edu.in', '');
          }

          const apiKey = import.meta.env.VITE_STUDENT_API_KEY || '';
          const headers = {};
          if (apiKey) {
            headers['X-API-Key'] = apiKey;
          }

          const studentRes = await fetch(`${studentApiUrl}/${rNoUpper}`, { headers });
          if (studentRes.ok) {
            const data = await studentRes.json();
            if (Array.isArray(data) && data.length > 0) {
              student = data[0];
            } else if (data && !Array.isArray(data) && (data.studentname || data.name)) {
              student = data;
            }
          }
        }

        if (student) {
          const rawGender = student.gender && student.gender !== '-' ? student.gender : '';
          const rawBloodGroup = student.bloodgroup && student.bloodgroup !== '-' ? student.bloodgroup : '';
          const rawPhone = student.mobilenumber || student.mobile || student.phonenumber || student.phone || '';
          const cleanPhone = rawPhone && rawPhone !== '-' ? String(rawPhone).trim() : '';
          const rawEmail = student.email || student.studentemail || student.mail || student.emailid || '';
          const cleanEmail = rawEmail && rawEmail !== '-' ? String(rawEmail).trim() : '';
          setFormData(prev => ({
            ...prev,
            rNo: rNoUpper,
            name: student.studentname || student.name || prev.name,
            email: cleanEmail || prev.email,
            branch: student.branch || student.program || prev.branch,
            phone: cleanPhone || prev.phone,
            gender: rawGender || prev.gender,
            bloodgroup: rawBloodGroup || prev.bloodgroup,
          }));
        }
      } catch (err) {
        console.error('Auto-populate error:', err);
      } finally {
        setIsLoadingStudent(false);
      }
    };

    fetchStudentData();
  }, [formData.rNo, slug, event, backendUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rNo') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\s+/g, '').toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 3. Step 1: Submit Registration Details (STORED IN 'clubeventregistrations' FIRST)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (duplicateError) {
      showNotification('This roll number has already completed registration.', 'error');
      return;
    }

    const cleanRNo = (formData.rNo || '').trim();
    const cleanName = (formData.name || '').trim();
    const cleanEmail = (formData.email || '').trim();
    const cleanBranch = (formData.branch || '').trim();
    const cleanGender = (formData.gender || '').trim();
    const cleanBloodgroup = (formData.bloodgroup || '').trim();
    const cleanPhone = (formData.phone || '').trim();

    if (!cleanRNo) {
      showNotification('Please enter your roll number.', 'error');
      return;
    }

    if (!cleanName) {
      showNotification('Please enter your full name.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      showNotification('Please enter a valid email address.', 'error');
      return;
    }

    if (!cleanBranch) {
      showNotification('Please enter your branch.', 'error');
      return;
    }

    if (!cleanGender) {
      showNotification('Please select your gender.', 'error');
      return;
    }

    if (!cleanBloodgroup) {
      showNotification('Please select your blood group.', 'error');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      showNotification('Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    if (!event || event.registration === 'closed' || event.status === 'inactive') {
      showNotification('Registration is not currently open for this event.', 'error');
      return;
    }

    setIsSubmitting(true);

    const eventFee = Number(event.amount) || 0;

    try {
      // Send registration details to backend (NO payment is recorded here)
      const res = await fetch(`${backendUrl}/api/club-events/${slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentData: {
            ...formData,
            eventName: event.name,
            eventSlug: event.slug_link,
            eventId: event._id,
          }
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (eventFee === 0) {
          // Free event: registration complete directly
          setRegistrationSuccess({
            eventName: event.name,
            amount: 0,
            studentName: formData.name,
            email: formData.email,
            rNo: formData.rNo,
            branch: formData.branch,
            gender: formData.gender,
            bloodgroup: formData.bloodgroup,
            phone: formData.phone,
            paymentId: 'N/A (Free Event)',
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          });
          showNotification('Registration completed successfully!');
        } else {
          // Paid event: registration details stored -> Redirect immediately to payment page with roll number
          showNotification('Registration saved! Proceeding to payment...');
          navigate(`/event/${slug}/payment/${formData.rNo}`);
        }
      } else {
        showNotification(result.message || 'Failed to save registration details.', 'error');
      }
    } catch (err) {
      console.error('Registration submission error:', err);
      showNotification('Network error while saving registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen
  if (isEventLoading) {
    return (
      <div className="club-event-public-wrapper">
        <div className="public-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="club-event-card glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }}></div>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Loading Event Details</h3>
          <p style={{ color: 'var(--text-muted)' }}>Fetching event information, please wait...</p>
        </div>
      </div>
    );
  }

  // Event Not Found Screen
  if (eventError || !event) {
    return (
      <div className="club-event-public-wrapper">
        <div className="public-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="club-event-card glass-card event-not-found-container">
          <div className="event-not-found-icon">
            <AlertCircle size={36} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>Event Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {eventError || `The club event with link "/${slug}" could not be found or may have been deleted.`}
          </p>
          <Link
            to="/orientation"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--hero-banner-bg)',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <span>Go to Orientation</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = event.registration === 'closed';
  const isInactive = event.status === 'inactive';
  const eventFee = Number(event.amount) || 0;

  return (
    <div className="club-event-public-wrapper">
      <div className="public-theme-toggle">
        <ThemeToggle />
      </div>

      {notification && (
        <div className={`custom-notification ${notification.type}`}>
          <div className="notification-content">
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Success View for Free Events */}
      {registrationSuccess ? (
        <div className="club-event-card glass-card registration-success-card">
          <div className="success-check-wrapper">
            <CheckCircle2 size={44} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.7rem' }}>
            Registration Confirmed!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            You have successfully registered for <strong>{registrationSuccess.eventName}</strong>.
          </p>

          <div className="success-receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">Event:</span>
              <span className="receipt-val">{registrationSuccess.eventName}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Roll number:</span>
              <span className="receipt-val">{registrationSuccess.rNo}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Name:</span>
              <span className="receipt-val">{registrationSuccess.studentName}</span>
            </div>
            {registrationSuccess.email && (
              <div className="receipt-row">
                <span className="receipt-label">Email:</span>
                <span className="receipt-val">{registrationSuccess.email}</span>
              </div>
            )}
            <div className="receipt-row">
              <span className="receipt-label">Branch:</span>
              <span className="receipt-val">{registrationSuccess.branch}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Gender:</span>
              <span className="receipt-val">{registrationSuccess.gender || 'N/A'}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Blood group:</span>
              <span className="receipt-val">{registrationSuccess.bloodgroup || 'N/A'}</span>
            </div>
            {registrationSuccess.phone && (
              <div className="receipt-row">
                <span className="receipt-label">Phone number:</span>
                <span className="receipt-val">{registrationSuccess.phone}</span>
              </div>
            )}
            <div className="receipt-row">
              <span className="receipt-label">Amount Paid:</span>
              <span className="receipt-val" style={{ color: 'var(--primary-color)', fontWeight: '700' }}>
                ₹0 (Free)
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Date:</span>
              <span className="receipt-val">{registrationSuccess.date}</span>
            </div>
          </div>

          <button
            className="welcome-ok-btn"
            onClick={() => {
              setRegistrationSuccess(null);
              setFormData({
                rNo: '',
                name: '',
                email: '',
                branch: '',
                phone: '',
                gender: '',
                bloodgroup: '',
              });
            }}
            style={{ minWidth: 200 }}
          >
            Register Another Student
          </button>
        </div>
      ) : (
        /* Step 1: Registration Form View */
        <div className="club-event-card glass-card">
          {/* Step indicator for paid events */}
          {eventFee > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: '700', fontSize: '0.88rem' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--hero-banner-bg)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                <span>Registration Details</span>
              </div>
              <div style={{ width: 36, height: 2, background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.88rem' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                <span>Payment (₹{eventFee})</span>
              </div>
            </div>
          )}

          <div className="form-header">
            <h2>Club Event Registration</h2>
            <p style={{ fontWeight: '600', color: 'var(--primary-color)', marginTop: '0.35rem', fontSize: '1.05rem', letterSpacing: '0.3px' }}>
              {event.name}
            </p>
          </div>

          {isClosed && (
            <div className="event-closed-banner">
              <AlertCircle size={20} />
              <span>Registrations for this club event are currently closed.</span>
            </div>
          )}

          {isInactive && (
            <div className="event-closed-banner">
              <AlertCircle size={20} />
              <span>This club event is currently inactive.</span>
            </div>
          )}

          {pendingPaymentInfo && (
            <div style={{
              background: 'rgba(190, 147, 55, 0.12)',
              border: '1px solid rgba(190, 147, 55, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.9rem' }}>
                  Registration Already Saved for {pendingPaymentInfo.rNo}
                </strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {pendingPaymentInfo.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/event/${slug}/payment/${pendingPaymentInfo.rNo}`)}
                style={{
                  background: 'var(--hero-banner-bg)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 1.1rem',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Proceed to Payment</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="orientation-form">
            {/* Hidden Event Fields */}
            <input type="hidden" name="eventName" value={event.name} />
            <input type="hidden" name="eventSlug" value={event.slug_link || slug} />
            <input type="hidden" name="eventId" value={event._id || ''} />

            {/* Member Information Section */}
            <div className="auto-populate-section">
              <div className="section-indicator">
                <span className="line"></span>
                <span className="text">Registration Information</span>
                <span className="line"></span>
              </div>

              {/* 1. Roll number (Single Row) */}
              <div className="form-group highlight-group">
                <label htmlFor="rNo">Roll number</label>
                <div className="input-with-icon">
                  <div className="field-icon-wrapper">
                    <IdCard size={20} />
                  </div>
                  <div className="input-content" style={{ width: '100%' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        id="rNo"
                        name="rNo"
                        placeholder="Enter roll number"
                        value={formData.rNo}
                        onChange={handleChange}
                        required
                        disabled={isClosed || isInactive}
                        autoFocus
                        style={{
                          width: '100%',
                          borderColor: duplicateError ? '#ef4444' : '',
                          textAlign: 'left'
                        }}
                      />
                      {isLoadingStudent && <span className="loading-spinner"></span>}
                    </div>
                  </div>
                </div>
                {duplicateError ? (
                  <span className="helper-text" style={{ color: '#ef4444', fontWeight: '500' }}>
                    {duplicateError}
                  </span>
                ) : (
                  <span className="helper-text">Enter roll number to auto-populate</span>
                )}
              </div>

              {/* Row 1: Name & Email */}
              <div className="form-row">
                {/* 2. Name */}
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={handleChange}
                      style={{ textAlign: 'left' }}
                      required
                    />
                  </div>
                  <span className="helper-text">
                    {formData.name ? 'Auto-populated / Editable' : 'Enter full name (auto-populates if available)'}
                  </span>
                </div>

                {/* 3. Email */}
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                      style={{ textAlign: 'left' }}
                      required
                    />
                  </div>
                  <span className="helper-text">
                    {formData.email ? 'Auto-populated / Entered email' : 'Enter email address'}
                  </span>
                </div>
              </div>

              {/* Row 2: Branch & Gender */}
              <div className="form-row">
                {/* 4. Branch */}
                <div className="form-group">
                  <label htmlFor="branch">Branch</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <Building size={20} />
                    </div>
                    <input
                      type="text"
                      id="branch"
                      name="branch"
                      placeholder="Enter branch (e.g. CSE, ECE, AI)"
                      value={formData.branch}
                      onChange={handleChange}
                      style={{ textAlign: 'left' }}
                      required
                    />
                  </div>
                  <span className="helper-text">
                    {formData.branch ? 'Auto-populated / Editable' : 'Enter branch (auto-populates if available)'}
                  </span>
                </div>

                {/* 5. Gender */}
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <Users size={20} />
                    </div>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      style={{ textAlign: 'left' }}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <span className="helper-text">
                    {formData.gender ? 'Auto-populated / Selected' : 'Select gender'}
                  </span>
                </div>
              </div>

              {/* Row 3: Blood group & Phone number */}
              <div className="form-row">
                {/* 6. Blood group */}
                <div className="form-group">
                  <label htmlFor="bloodgroup">Blood group</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <Droplet size={20} />
                    </div>
                    <select
                      id="bloodgroup"
                      name="bloodgroup"
                      value={formData.bloodgroup}
                      onChange={handleChange}
                      style={{ textAlign: 'left' }}
                      required
                    >
                      <option value="">Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                      {formData.bloodgroup && !['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(formData.bloodgroup) && (
                        <option value={formData.bloodgroup}>{formData.bloodgroup}</option>
                      )}
                    </select>
                  </div>
                  <span className="helper-text">
                    {formData.bloodgroup ? 'Blood group selected' : 'Select blood group'}
                  </span>
                </div>

                {/* 7. Phone number */}
                <div className="form-group">
                  <label htmlFor="phone">Phone number</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <Phone size={20} />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{ textAlign: 'left' }}
                      required
                    />
                  </div>
                  <span className="helper-text">
                    {formData.phone ? 'Auto-populated / Editable' : 'Enter phone number'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || isLoadingStudent || !!duplicateError || isClosed || isInactive}
              style={{
                opacity: (isSubmitting || isLoadingStudent || !!duplicateError || isClosed || isInactive) ? 0.6 : 1,
                cursor: (isSubmitting || isLoadingStudent || !!duplicateError || isClosed || isInactive) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  <span>Saving Registration Details...</span>
                </>
              ) : eventFee > 0 ? (
                <>
                  <span>Proceed to Payment (₹{eventFee})</span>
                  <ArrowRight size={18} style={{ marginLeft: '0.4rem' }} />
                </>
              ) : (
                <span>Complete Free Registration</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClubEventPublicRegistration;
