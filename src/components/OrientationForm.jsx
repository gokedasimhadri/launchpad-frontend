import React, { useState } from 'react';
import { GraduationCap, IdCard, User, MapPin, Building, Phone, HelpCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import CelestialLogo from './CelestialLogo';
import './OrientationForm.css';

const OrientationForm = () => {
  const [formData, setFormData] = useState({
    rNo: '',
    name: '',
    location: '',
    branch: '',
    phone: '',
    attendanceCount: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [notification, setNotification] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const { theme } = useTheme();

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  React.useEffect(() => {
    const fetchStudentData = async () => {
      if (formData.rNo.length >= 10) {
        setIsLoading(true);
        setDuplicateError('');
        try {
          const ourBackendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';
          const rNoUpper = formData.rNo.toUpperCase();

          // First, check if already submitted in our backend
          const checkResponse = await fetch(`${ourBackendUrl}/api/orientation/check/${rNoUpper}`);
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.exists) {
              setDuplicateError('This roll number is already submitted.');
              setIsLoading(false);
              return;
            }
          }

          // Fetch from student API
          const studentApiUrl = import.meta.env.VITE_STUDENT_API_URL || '/adityaapi/api/studentdata';
          const response = await fetch(`${studentApiUrl}?rNo=${rNoUpper}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const student = data[0];
              setFormData(prev => ({
                ...prev,
                rNo: rNoUpper,
                name: student.name || prev.name,
                location: student.campus || prev.location,
                branch: student.program || prev.branch,
                phone: student.mobile || prev.phone
              }));
            }
          }
        } catch (err) {
          console.error('Auto-populate error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchStudentData();
  }, [formData.rNo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rNo') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (duplicateError) {
      showNotification('This roll number is already submitted.', 'error');
      return;
    }

    if (!formData.rNo || !formData.name || !formData.branch || !formData.location || !formData.phone) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';
      const response = await fetch(`${backendUrl}/api/orientation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rNo: formData.rNo,
          name: formData.name,
          location: formData.location,
          branch: formData.branch,
          phone: formData.phone,
          attendanceCount: parseInt(formData.attendanceCount, 10) || 1
        })
      });

      if (response.ok) {
        showNotification('Successfully registered for orientation!');
        setFormData({
          rNo: '',
          name: '',
          location: '',
          branch: '',
          phone: '',
          attendanceCount: ''
        });
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Failed to submit form', 'error');
      }
    } catch (err) {
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      {notification && (
        <div className={`custom-notification ${notification.type}`}>
          <div className="notification-content">
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {showWelcomeModal ? (
        <div className="welcome-modal glass-card">
          <div className="form-icon-header">
            <CelestialLogo theme={theme} />
          </div>
          <div className="welcome-modal-content">
            <h3>Welcome to Aditya University</h3>
            <p>We are glad to have you here.</p>
            <button
              className="welcome-ok-btn"
              onClick={() => setShowWelcomeModal(false)}
            >
              Enroll
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card form-container">
          <div className="form-icon-header">
            <CelestialLogo theme={theme} />
          </div>
          <div className="form-header">
            <h2>Orientation Enrollment</h2>
            <p>Please enter your roll number below to enroll in the orientation program.</p>
          </div>

          <form onSubmit={handleSubmit} className="orientation-form">
            {/* R.No Field */}
            <div className="form-group highlight-group">
              <label htmlFor="rNo">Roll No</label>
              <div className="input-with-icon">
                <div className="field-icon-wrapper">
                  <IdCard size={20} />
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    id="rNo"
                    name="rNo"
                    placeholder="Enter your 10-digit roll number"
                    value={formData.rNo}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      borderColor: duplicateError ? '#ef4444' : ''
                    }}
                  />
                  {isLoading && <span className="loading-spinner"></span>}
                </div>
              </div>
              {duplicateError ? (
                <span className="helper-text" style={{ color: '#ef4444', fontWeight: '500' }}>{duplicateError}</span>
              ) : (
                <span className="helper-text">Enter 10-digit registration/roll number to auto-populate</span>
              )}
            </div>

            <div className="auto-populate-section">
              <div className="section-indicator">
                <span className="line"></span>
                <span className="text">Member Information</span>
                <span className="line"></span>
              </div>

              <div className="form-row">
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
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <MapPin size={20} />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      placeholder="Enter your location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
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
                      placeholder="Enter your branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <div className="input-with-icon">
                    <div className="field-icon-wrapper">
                      <Phone size={20} />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group question-group">
              <label htmlFor="attendanceCount" className="question-label">
                Question
                <span>How many members accompanied you for today orientation?</span>
              </label>
              <div className="input-with-icon">
                <div className="field-icon-wrapper question-icon">
                  <HelpCircle size={20} color="white" />
                </div>
                <input
                  type="number"
                  id="attendanceCount"
                  name="attendanceCount"
                  min="1"
                  placeholder="e.g., 14"
                  value={formData.attendanceCount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || !!duplicateError}
              style={{
                opacity: (isLoading || !!duplicateError) ? 0.6 : 1,
                cursor: (isLoading || !!duplicateError) ? 'not-allowed' : 'pointer'
              }}
            >
              Submit Details
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrientationForm;
