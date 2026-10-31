import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  IdCard,
  User,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Droplet,
  Users,
  Mail,
  Printer,
  Plus,
  Check,
  X,
  Download
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

  // Per Head (Single Person) Form data
  const [formData, setFormData] = useState({
    rNo: '',
    name: '',
    email: '',
    branch: '',
    phone: '',
    gender: '',
    bloodgroup: '',
  });

  // Team Registration Form data
  const [teamMembers, setTeamMembers] = useState([]);

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

  // Helper: Create an empty member
  const createEmptyMember = (isLeader = false) => ({
    rNo: '',
    name: '',
    email: '',
    branch: '',
    phone: '',
    gender: '',
    bloodgroup: '',
    isLeader: isLeader,
    isLoading: false,
    error: '',
  });

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
          // If team event, initialize team members array according to personsCount
          if (result.data.teamType === 'per_team') {
            const count = Math.max(1, result.data.personsCount || result.data.maxTeamSize || result.data.minTeamSize || 2);
            const initialMembers = [];
            for (let i = 0; i < count; i++) {
              initialMembers.push(createEmptyMember(i === 0));
            }
            setTeamMembers(initialMembers);
          }
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

  // Helper: Fetch Student Details from API
  const fetchStudentProfile = useCallback(async (rNoUpper) => {
    let student = null;

    // Try 1: Fetch via backend proxy endpoint
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

    // Try 2: Direct API with Key
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

      try {
        const studentRes = await fetch(`${studentApiUrl}/${rNoUpper}`, { headers });
        if (studentRes.ok) {
          const data = await studentRes.json();
          if (Array.isArray(data) && data.length > 0) {
            student = data[0];
          } else if (data && !Array.isArray(data) && (data.studentname || data.name)) {
            student = data;
          }
        }
      } catch (sErr) {
        console.warn('Direct student API error:', sErr);
      }
    }

    if (student) {
      const rawGender = student.gender && student.gender !== '-' ? student.gender : '';
      const rawBloodGroup = student.bloodgroup && student.bloodgroup !== '-' ? student.bloodgroup : '';
      const rawPhone = student.mobilenumber || student.mobile || student.phonenumber || student.phone || '';
      const cleanPhone = rawPhone && rawPhone !== '-' ? String(rawPhone).trim() : '';
      const rawEmail = student.email || student.studentemail || student.mail || student.emailid || '';
      const cleanEmail = rawEmail && rawEmail !== '-' ? String(rawEmail).trim() : '';

      return {
        name: student.studentname || student.name || '',
        email: cleanEmail,
        branch: student.branch || student.program || '',
        phone: cleanPhone,
        gender: rawGender,
        bloodgroup: rawBloodGroup
      };
    }

    return null;
  }, [backendUrl]);

  // 2. Auto-populate Student Data for Single Person Event (Per Head)
  useEffect(() => {
    if (event?.teamType === 'per_team') return;

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
              setDuplicateError(checkData.message || 'This roll number is already registered and payment is completed.');
              setIsLoadingStudent(false);
              return;
            } else if (checkData.isPendingPayment) {
              setPendingPaymentInfo({
                rNo: rNoUpper,
                message: checkData.message || 'Registration details already saved! Proceed to complete payment.'
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

        const profile = await fetchStudentProfile(rNoUpper);
        if (profile) {
          setFormData(prev => ({
            ...prev,
            rNo: rNoUpper,
            name: profile.name || prev.name,
            email: profile.email || prev.email,
            branch: profile.branch || prev.branch,
            phone: profile.phone || prev.phone,
            gender: profile.gender || prev.gender,
            bloodgroup: profile.bloodgroup || prev.bloodgroup,
          }));
        }
      } catch (err) {
        console.error('Auto-populate error:', err);
      } finally {
        setIsLoadingStudent(false);
      }
    };

    fetchStudentData();
  }, [formData.rNo, slug, event, backendUrl, fetchStudentProfile]);

  // Handle Per-Head Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rNo') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\s+/g, '').toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- Team Member Lookup & Management ---
  const lookupMemberRoll = async (index, roll) => {
    const rNoUpper = roll.replace(/\s+/g, '').toUpperCase().trim();
    if (!rNoUpper || rNoUpper.length < 2 || !event) return;

    // Check duplicate roll number inside team
    const isDupInTeam = teamMembers.some((m, idx) => idx !== index && m.rNo.toUpperCase().trim() === rNoUpper);
    if (isDupInTeam) {
      setTeamMembers(prev => {
        const next = [...prev];
        if (next[index]) next[index] = { ...next[index], error: `Roll number ${rNoUpper} is entered more than once in this team.` };
        return next;
      });
      return;
    }

    setTeamMembers(prev => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], isLoading: true, error: '' };
      return next;
    });

    try {
      // Check if student already registered in database for this event
      const checkRes = await fetch(`${backendUrl}/api/club-events/${slug}/check/${rNoUpper}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          if (checkData.isPaid) {
            setTeamMembers(prev => {
              const next = [...prev];
              if (next[index]) {
                next[index] = {
                  ...next[index],
                  isLoading: false,
                  error: checkData.message || `Roll number ${rNoUpper} is already registered for this event.`
                };
              }
              return next;
            });
            return;
          } else if (checkData.isPendingPayment) {
            if (index === 0) {
              setPendingPaymentInfo({
                rNo: rNoUpper,
                message: checkData.message || 'Registration details already saved! Proceed to complete payment.'
              });
            } else {
              setTeamMembers(prev => {
                const next = [...prev];
                if (next[index]) {
                  next[index] = {
                    ...next[index],
                    isLoading: false,
                    error: `Roll number ${rNoUpper} already has a pending registration for this event.`
                  };
                }
                return next;
              });
              return;
            }
          }
        }
      }

      // Fetch student profile details
      const profile = await fetchStudentProfile(rNoUpper);
      if (profile) {
        setTeamMembers(prev => {
          const next = [...prev];
          if (next[index]) {
            next[index] = {
              ...next[index],
              name: profile.name || next[index].name,
              email: profile.email || next[index].email,
              branch: profile.branch || next[index].branch,
              phone: profile.phone || next[index].phone,
              gender: profile.gender || next[index].gender,
              bloodgroup: profile.bloodgroup || next[index].bloodgroup,
              isLoading: false,
              error: ''
            };
          }
          return next;
        });
      } else {
        setTeamMembers(prev => {
          const next = [...prev];
          if (next[index]) next[index] = { ...next[index], isLoading: false };
          return next;
        });
      }
    } catch (err) {
      console.error('Error looking up team member roll:', err);
      setTeamMembers(prev => {
        const next = [...prev];
        if (next[index]) next[index] = { ...next[index], isLoading: false };
        return next;
      });
    }
  };

  const handleTeamMemberRollChange = (index, value) => {
    const cleanVal = value.replace(/\s+/g, '').toUpperCase();
    setTeamMembers(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], rNo: cleanVal, error: '' };
      }
      return next;
    });

    if (cleanVal.length >= 2) {
      lookupMemberRoll(index, cleanVal);
    }
  };

  const handleTeamMemberFieldChange = (index, field, value) => {
    setTeamMembers(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleAddMember = () => {
    const maxSize = event?.personsCount || event?.maxTeamSize || Math.max(event?.minTeamSize || 2, 4);
    if (teamMembers.length < maxSize) {
      setTeamMembers(prev => [
        ...prev,
        createEmptyMember(false)
      ]);
    }
  };

  const handleRemoveMember = (indexToRemove) => {
    if (indexToRemove > 0 && teamMembers.length > 1) {
      setTeamMembers(prev => prev.filter((_, i) => i !== indexToRemove));
    }
  };

  // 3. Step 1: Submit Registration Details (STORED IN 'clubeventregistrations' FIRST)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!event || event.registration === 'closed' || event.status === 'inactive') {
      showNotification('Registration is not currently open for this event.', 'error');
      return;
    }

    const isTeamEvent = event.teamType === 'per_team';
    const eventFee = Number(event.amount) || 0;

    // A. Handle Team Registration Submission
    if (isTeamEvent) {
      const maxSize = event.personsCount || event.maxTeamSize || Math.max(event.minTeamSize || 1, 10);

      if (teamMembers.length < 1 || teamMembers.length > maxSize) {
        showNotification(`This event accepts between 1 and ${maxSize} participants.`, 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const seenRolls = new Set();

      for (let i = 0; i < teamMembers.length; i++) {
        const m = teamMembers[i];
        const label = i === 0 ? 'Team Leader' : `Team Member ${i + 1}`;

        if (m.error) {
          showNotification(`Please resolve the error for ${label}: ${m.error}`, 'error');
          return;
        }

        if (!m.rNo?.trim()) {
          showNotification(`Please enter Roll number for ${label}.`, 'error');
          return;
        }

        if (!m.name?.trim()) {
          showNotification(`Please enter Full name for ${label}.`, 'error');
          return;
        }

        if (!m.email?.trim() || !emailRegex.test(m.email.trim())) {
          showNotification(`Please enter a valid email address for ${label}.`, 'error');
          return;
        }

        if (!m.branch?.trim()) {
          showNotification(`Please enter branch for ${label}.`, 'error');
          return;
        }

        if (!m.gender?.trim()) {
          showNotification(`Please select gender for ${label}.`, 'error');
          return;
        }

        if (!m.bloodgroup?.trim()) {
          showNotification(`Please select blood group for ${label}.`, 'error');
          return;
        }

        if (!m.phone?.trim() || m.phone.trim().length < 10) {
          showNotification(`Please enter a valid 10-digit phone number for ${label}.`, 'error');
          return;
        }

        const rNoUpper = m.rNo.toUpperCase().trim();
        if (seenRolls.has(rNoUpper)) {
          showNotification(`Duplicate roll number ${rNoUpper} in team. Each member must have a distinct roll number.`, 'error');
          return;
        }
        seenRolls.add(rNoUpper);
      }

      setIsSubmitting(true);
      try {
        const leader = teamMembers[0];
        const sanitizedMembers = teamMembers.map((m, idx) => ({
          rNo: m.rNo.toUpperCase().trim(),
          name: m.name.trim(),
          email: m.email.trim(),
          branch: m.branch.trim(),
          phone: m.phone.trim(),
          gender: m.gender.trim(),
          bloodgroup: m.bloodgroup.trim(),
          isLeader: idx === 0
        }));

        const res = await fetch(`${backendUrl}/api/club-events/${slug}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentData: {
              teamType: 'per_team',
              teamMembers: sanitizedMembers,
              rNo: leader.rNo.toUpperCase().trim(),
              name: leader.name.trim(),
              email: leader.email.trim(),
              branch: leader.branch.trim(),
              phone: leader.phone.trim(),
              gender: leader.gender.trim(),
              bloodgroup: leader.bloodgroup.trim(),
              eventName: event.name,
              eventSlug: event.slug_link,
              eventId: event._id,
            }
          })
        });

        const result = await res.json();

        if (res.ok && result.success) {
          if (eventFee === 0) {
            setRegistrationSuccess({
              eventName: event.name,
              amount: 0,
              teamType: 'per_team',
              teamMembers: sanitizedMembers,
              studentName: leader.name,
              email: leader.email,
              rNo: leader.rNo,
              branch: leader.branch,
              gender: leader.gender,
              bloodgroup: leader.bloodgroup,
              phone: leader.phone,
              paymentId: 'N/A (Free Event)',
              date: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            });
            showNotification('Team registration completed successfully!');
          } else {
            showNotification('Team registration saved! Proceeding to payment...');
            navigate(`/event/${slug}/payment/${leader.rNo.toUpperCase().trim()}`);
          }
        } else {
          showNotification(result.message || 'Failed to save team registration.', 'error');
        }
      } catch (err) {
        console.error('Team registration submission error:', err);
        showNotification('Network error while saving registration.', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // B. Handle Single Person (Per Head) Submission
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

    setIsSubmitting(true);

    try {
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
          setRegistrationSuccess({
            eventName: event.name,
            amount: 0,
            teamType: 'per_head',
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

  const handleDownloadPDF = () => {
    const oldTitle = document.title;
    const cleanEvent = (registrationSuccess?.eventName || event?.name || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
    const roll = registrationSuccess?.rNo || 'Receipt';
    document.title = `Receipt_${cleanEvent}_${roll}`;
    window.print();
    setTimeout(() => {
      document.title = oldTitle;
    }, 1200);
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
  const isTeamEvent = event.teamType === 'per_team';
  const expectedPersons = event.personsCount || event.maxTeamSize || event.minTeamSize || 2;
  const minTeamSize = Math.max(1, event.minTeamSize || expectedPersons);
  const maxTeamSize = Math.max(minTeamSize, event.maxTeamSize || expectedPersons);

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
        <div className="club-event-card glass-card registration-success-card" style={{ position: 'relative' }}>
          {/* TOP RIGHT DOWNLOAD PDF OPTION */}
          <button
            onClick={handleDownloadPDF}
            className="receipt-download-pdf-btn"
            title="Download Receipt as PDF"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

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

            {registrationSuccess.teamType === 'per_team' && (
              <div className="receipt-row">
                <span className="receipt-label">Team Size:</span>
                <span className="receipt-val">{registrationSuccess.teamMembers?.length} Persons</span>
              </div>
            )}

            <div className="receipt-row">
              <span className="receipt-label">
                {registrationSuccess.teamType === 'per_team' ? 'Team Leader Roll:' : 'Roll number:'}
              </span>
              <span className="receipt-val">{registrationSuccess.rNo}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">
                {registrationSuccess.teamType === 'per_team' ? 'Team Leader Name:' : 'Name:'}
              </span>
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

            {/* List Team Members if team registration */}
            {registrationSuccess.teamType === 'per_team' && registrationSuccess.teamMembers && (
              <div className="team-members-receipt-list">
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  Team Members List:
                </span>
                {registrationSuccess.teamMembers.map((m, idx) => (
                  <div key={idx} className="team-member-receipt-item">
                    <span>
                      <strong>#{idx + 1}</strong> {m.name} ({m.rNo})
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{m.branch}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="receipt-row">
              <span className="receipt-label">Amount Paid:</span>
              <span className="receipt-val" style={{ color: 'var(--primary-color)', fontWeight: '700' }}>
                ₹0
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Date:</span>
              <span className="receipt-val">{registrationSuccess.date}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              className="welcome-ok-btn"
              onClick={handleDownloadPDF}
              style={{ minWidth: 160, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              style={{
                minWidth: 120,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>
      ) : (
        /* Step 1: Registration Form View */
        <div className="club-event-card glass-card">
          {/* Step indicator for paid events */}
          {eventFee > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: '700', fontSize: '0.88rem' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--hero-banner-bg)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                <span>{isTeamEvent ? 'Team Details' : 'Registration Details'}</span>
              </div>
              <div style={{ width: 36, height: 2, background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.88rem' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                <span>Payment (₹{eventFee})</span>
              </div>
            </div>
          )}

          <div className="form-header">
            <p style={{ fontWeight: '600', color: 'var(--primary-color)', marginTop: '0.35rem', fontSize: '1.05rem', letterSpacing: '0.3px' }}>
              {event.name}
            </p>
          </div>

          {isClosed && (
            <div className="event-closed-banner">
              <AlertCircle size={20} />
              <span>Registrations for this event are currently closed.</span>
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

            {/* ========================================================= */}
            {/* OPTION A: TEAM EVENT FORM (per_team)                       */}
            {/* ========================================================= */}
            {isTeamEvent ? (
              <div>
                {/* Team Event Requirements Banner */}
                <div className="team-event-meta-badge">
                  <Users size={18} />
                  <span>
                    Team Event • Up to <strong>{maxTeamSize} Persons</strong> (Single or Team Registration)
                  </span>
                </div>

                {/* Member Information Section Header */}
                <div className="section-indicator" style={{ marginBottom: '1.25rem' }}>
                  <span className="line"></span>
                  <span className="text">Participants Information ({teamMembers.length} {teamMembers.length === 1 ? 'Person' : 'Persons'})</span>
                  <span className="line"></span>
                </div>

                {/* List of Team Members */}
                {teamMembers.map((member, index) => (
                  <div key={index} className="member-card-wrapper">
                    <div className="member-card-header">
                      <div className="member-badge-title">
                        <User size={18} style={{ color: 'var(--primary-color)' }} />
                        <span>
                          {index === 0 ? 'Team Leader / Primary Contact' : `Team Member ${index + 1}`}
                        </span>
                        {index === 0 && <span className="leader-pill">Leader</span>}
                      </div>

                      {index > 0 && (
                        <button
                          type="button"
                          className="remove-member-btn"
                          onClick={() => handleRemoveMember(index)}
                          title="Remove this participant"
                        >
                          <X size={15} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Member Roll number */}
                    <div className="form-group highlight-group">
                      <label htmlFor={`member-rNo-${index}`}>
                        Roll number {index === 0 && '(Leader)'} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div className="input-with-icon">
                        <div className="field-icon-wrapper">
                          <IdCard size={20} />
                        </div>
                        <div className="input-content" style={{ width: '100%' }}>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              id={`member-rNo-${index}`}
                              placeholder="Enter roll number"
                              value={member.rNo}
                              onChange={(e) => handleTeamMemberRollChange(index, e.target.value)}
                              required
                              disabled={isClosed || isInactive}
                              style={{
                                width: '100%',
                                borderColor: member.error ? '#ef4444' : '',
                                textAlign: 'left'
                              }}
                            />
                            {member.isLoading && <span className="loading-spinner"></span>}
                          </div>
                        </div>
                      </div>
                      {member.error ? (
                        <span className="helper-text" style={{ color: '#ef4444', fontWeight: '500' }}>
                          {member.error}
                        </span>
                      ) : (
                        <span className="helper-text">Enter roll number to auto-populate</span>
                      )}
                    </div>

                    {/* Row 1: Name & Email */}
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`member-name-${index}`}>
                          Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="input-with-icon">
                          <div className="field-icon-wrapper">
                            <User size={20} />
                          </div>
                          <input
                            type="text"
                            id={`member-name-${index}`}
                            placeholder="Enter full name"
                            value={member.name}
                            onChange={(e) => handleTeamMemberFieldChange(index, 'name', e.target.value)}
                            style={{ textAlign: 'left' }}
                            required
                          />
                        </div>
                        <span className="helper-text">
                          {member.name ? 'Auto-populated / Editable' : 'Enter full name'}
                        </span>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`member-email-${index}`}>
                          Email <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="input-with-icon">
                          <div className="field-icon-wrapper">
                            <Mail size={20} />
                          </div>
                          <input
                            type="email"
                            id={`member-email-${index}`}
                            placeholder="Enter email address"
                            value={member.email}
                            onChange={(e) => handleTeamMemberFieldChange(index, 'email', e.target.value)}
                            style={{ textAlign: 'left' }}
                            required
                          />
                        </div>
                        <span className="helper-text">
                          {member.email ? 'Entered email' : 'Enter email address'}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Branch & Gender */}
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`member-branch-${index}`}>
                          Branch <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="input-with-icon">
                          <div className="field-icon-wrapper">
                            <Building size={20} />
                          </div>
                          <input
                            type="text"
                            id={`member-branch-${index}`}
                            placeholder="Enter branch (e.g. CSE, ECE, AI)"
                            value={member.branch}
                            onChange={(e) => handleTeamMemberFieldChange(index, 'branch', e.target.value)}
                            style={{ textAlign: 'left' }}
                            required
                          />
                        </div>
                        <span className="helper-text">
                          {member.branch ? 'Auto-populated / Editable' : 'Enter branch'}
                        </span>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`member-gender-${index}`}>
                          Gender <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="input-with-icon">
                          <div className="field-icon-wrapper">
                            <Users size={20} />
                          </div>
                          <select
                            id={`member-gender-${index}`}
                            value={member.gender}
                            onChange={(e) => handleTeamMemberFieldChange(index, 'gender', e.target.value)}
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
                          {member.gender ? 'Selected gender' : 'Select gender'}
                        </span>
                      </div>
                    </div>

                    {/* Row 3: Blood group & Phone number */}
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`member-bloodgroup-${index}`}>
                          Blood group <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="input-with-icon">
                          <div className="field-icon-wrapper">
                            <Droplet size={20} />
                          </div>
                          <select
                            id={`member-bloodgroup-${index}`}
                            value={member.bloodgroup}
                            onChange={(e) => handleTeamMemberFieldChange(index, 'bloodgroup', e.target.value)}
                            style={{ textAlign: 'left' }}
                            required
                          >
                            <option value="">Select Blood Group</option>
                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                            {member.bloodgroup && !['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(member.bloodgroup) && (
                              <option value={member.bloodgroup}>{member.bloodgroup}</option>
                            )}
                          </select>
                        </div>
                        <span className="helper-text">
                          {member.bloodgroup ? 'Blood group selected' : 'Select blood group'}
                        </span>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`member-phone-${index}`}>
                          Phone number <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="input-with-icon">
                          <div className="field-icon-wrapper">
                            <Phone size={20} />
                          </div>
                          <input
                            type="tel"
                            id={`member-phone-${index}`}
                            placeholder="Enter phone number"
                            value={member.phone}
                            onChange={(e) => handleTeamMemberFieldChange(index, 'phone', e.target.value)}
                            style={{ textAlign: 'left' }}
                            required
                          />
                        </div>
                        <span className="helper-text">
                          {member.phone ? 'Phone number entered' : 'Enter phone number'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Member Button / Max Reached */}
                {teamMembers.length < maxTeamSize ? (
                  <button
                    type="button"
                    className="add-member-action-btn"
                    onClick={handleAddMember}
                  >
                    <Plus size={18} />
                    <span>Add Team Member ({teamMembers.length} of {maxTeamSize})</span>
                  </button>
                ) : (
                  <div className="team-max-reached-note">
                    <Check size={16} color="#10b981" />
                    <span>Maximum team size ({maxTeamSize} persons) reached</span>
                  </div>
                )}
              </div>
            ) : (
              /* ========================================================= */
              /* OPTION B: SINGLE PERSON (PER HEAD) FORM                   */
              /* ========================================================= */
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
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={
                isSubmitting ||
                isLoadingStudent ||
                (!isTeamEvent && !!duplicateError) ||
                (isTeamEvent && teamMembers.some(m => m.isLoading || m.error)) ||
                isClosed ||
                isInactive
              }
              style={{
                opacity: (
                  isSubmitting ||
                  isLoadingStudent ||
                  (!isTeamEvent && !!duplicateError) ||
                  (isTeamEvent && teamMembers.some(m => m.isLoading || m.error)) ||
                  isClosed ||
                  isInactive
                ) ? 0.6 : 1,
                cursor: (
                  isSubmitting ||
                  isLoadingStudent ||
                  (!isTeamEvent && !!duplicateError) ||
                  (isTeamEvent && teamMembers.some(m => m.isLoading || m.error)) ||
                  isClosed ||
                  isInactive
                ) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  <span>Saving Registration Details...</span>
                </>
              ) : eventFee > 0 ? (
                <>
                  <span>
                    Proceed to Payment (₹{eventFee})
                  </span>
                  <ArrowRight size={18} style={{ marginLeft: '0.4rem' }} />
                </>
              ) : (
                <span>
                  {isTeamEvent ? 'Complete Free Team Registration' : 'Complete Free Registration'}
                </span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClubEventPublicRegistration;
