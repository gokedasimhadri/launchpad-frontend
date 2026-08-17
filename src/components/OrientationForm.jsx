import React, { useState } from 'react';
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
          const ourBackendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const rNoUpper = formData.rNo.toUpperCase();
          
          // First, check if already submitted in our backend
          const checkResponse = await fetch(`${ourBackendUrl}/api/orientation/check/${rNoUpper}`);
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.exists) {
              setDuplicateError('This roll number is already submitted.');
              setFormData(prev => ({
                ...prev,
                name: '',
                location: '',
                branch: '',
                phone: ''
              }));
              setIsLoading(false);
              return; // Stop here, do not fetch external data
            }
          }

          // If not submitted, fetch from external API
          const baseUrl = import.meta.env.VITE_STUDENT_API_URL || 'https://info.aec.edu.in/adityaapi/api/studentdata';
          const response = await fetch(`${baseUrl}/${rNoUpper}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const student = data[0];
              setFormData(prev => ({
                ...prev,
                name: student.studentname || '',
                branch: student.branch || '',
                phone: student.mobilenumber || '',
                location: [student.village, student.district].filter(Boolean).join(', ') || ''
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear duplicate error if user is editing and it's less than 10 chars
        if (duplicateError) setDuplicateError('');
      }
    };

    fetchStudentData();
  }, [formData.rNo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/orientation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showNotification('Details saved successfully!', 'success');
        // Reset form
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
        showNotification(`Failed to save details: ${errorData.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('Network error while saving details. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      {notification && (
        <div className={`custom-notification ${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      <div className="glass-card">
        <div className="form-header">
          <h2>Orientation Details</h2>
          <p>Please fill out the information below.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="orientation-form">
          {/* R.No Field */}
          <div className="form-group highlight-group">
            <label htmlFor="rNo">R.No</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="rNo"
                name="rNo"
                placeholder="xxxx"
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
            {duplicateError ? (
              <span className="helper-text" style={{ color: '#ef4444', fontWeight: '500' }}>{duplicateError}</span>
            ) : (
              <span className="helper-text">Enter 10-digit registration/roll number to auto-populate</span>
            )}
          </div>

          <div className="auto-populate-section">
            <div className="section-indicator">
              <span className="line"></span>
              <span className="text">Member Info</span>
              <span className="line"></span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="branch">Branch</label>
                <input
                  type="text"
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group question-group">
            <label htmlFor="attendanceCount" className="question-label">
              Question: <br />
              <span>How many Members have attended today orientation?</span>
            </label>
            <input
              type="number"
              id="attendanceCount"
              name="attendanceCount"
              min="0"
              placeholder="e.g., 14"
              value={formData.attendanceCount}
              onChange={handleChange}
              required
            />
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrientationForm;
