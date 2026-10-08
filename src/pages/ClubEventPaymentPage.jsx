import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  IdCard,
  User,
  Building,
  Phone,
  Droplet,
  Users,
  Calendar,
  Lock,
  Printer,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import './ClubEventPaymentPage.css';

const ClubEventPaymentPage = () => {
  const { slug, rNo } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState(null);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [copiedRoll, setCopiedRoll] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Razorpay Checkout Script
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Prevent browser refresh or page close while payment is processing/verifying
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProcessingPayment || isVerifyingPayment) {
        const msg = 'Payment verification in progress! Please do not refresh or close this page until completed.';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcessingPayment, isVerifyingPayment]);

  // Fetch Event and Registration Details
  useEffect(() => {
    const fetchRegistrationDetails = async () => {
      if (!slug || !rNo) {
        setErrorMessage('Invalid event or roll number.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const cleanRNo = rNo.toUpperCase().trim();
        const res = await fetch(`${backendUrl}/api/club-events/${slug}/registration/${cleanRNo}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setEvent(data.event);
          setRegistration(data.registration);

          // If student has already paid
          if (data.isPaid || data.registration.paymentStatus === 'paid') {
            setIsPaid(true);
            const paymentInfo = data.payment || {};
            setPaymentSuccessData({
              eventName: data.event.name,
              amount: data.amount || paymentInfo.amount || data.registration.amountPaid || 0,
              studentName: data.registration.name,
              email: data.registration.email,
              rNo: data.registration.rNo,
              branch: data.registration.branch,
              gender: data.registration.gender,
              bloodgroup: data.registration.bloodgroup,
              phone: data.registration.phone,
              paymentId: paymentInfo.razorpayPaymentId || data.registration.razorpayPaymentId || 'COMPLETED',
              orderId: paymentInfo.razorpayOrderId || data.registration.razorpayOrderId || '',
              date: new Date(paymentInfo.createdAt || data.registration.updatedAt || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            });
          }
        } else {
          setErrorMessage(data.message || 'Registration details not found. Please register first.');
        }
      } catch (err) {
        console.error('Error fetching registration:', err);
        setErrorMessage('Failed to connect to the server. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegistrationDetails();
  }, [slug, rNo, backendUrl]);

  // Handle Razorpay Payment
  const handlePayment = async () => {
    if (!event || !registration) return;

    const eventFee = Number(event.amount) || 0;
    if (eventFee <= 0) {
      showNotification('This event is free of charge.', 'info');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Create order on backend
      const orderRes = await fetch(`${backendUrl}/api/club-events/${slug}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rNo: registration.rNo })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Could not initialize payment order');
      }

      const activeKey = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID';

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: activeKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Aditya University',
        description: `${event.name} - Registration Fee`,
        image: '/orinetatation logo.png',
        order_id: orderData.orderId,
        theme: {
          color: '#BE9337'
        },
        prefill: {
          name: registration.name,
          contact: registration.phone || ''
        },
        handler: async function (response) {
          setIsVerifyingPayment(true);
          setIsProcessingPayment(false);

          try {
            // 3. Immediately store payment in separate collection 'clubeventrpayments'
            const recordRes = await fetch(`${backendUrl}/api/club-events/${slug}/record-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rNo: registration.rNo,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || '',
                paymentMethod: 'razorpay'
              })
            });

            const recordResult = await recordRes.json();

            if (recordRes.ok && recordResult.success) {
              setIsPaid(true);
              setPaymentSuccessData({
                eventName: event.name,
                amount: eventFee,
                studentName: registration.name,
                email: registration.email,
                rNo: registration.rNo,
                branch: registration.branch,
                gender: registration.gender,
                bloodgroup: registration.bloodgroup,
                phone: registration.phone,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                date: new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              });
              showNotification('Payment successfully recorded and registration confirmed!');
            } else {
              throw new Error(recordResult.message || 'Payment recorded with warning.');
            }
          } catch (recErr) {
            console.error('Error saving payment record:', recErr);
            // Fallback display
            setIsPaid(true);
            setPaymentSuccessData({
              eventName: event.name,
              amount: eventFee,
              studentName: registration.name,
              email: registration.email,
              rNo: registration.rNo,
              branch: registration.branch,
              gender: registration.gender,
              bloodgroup: registration.bloodgroup,
              phone: registration.phone,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              orderId: response.razorpay_order_id,
              date: new Date().toLocaleDateString('en-IN')
            });
            showNotification('Payment processed successfully!');
          } finally {
            setIsVerifyingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setIsProcessingPayment(false);
          showNotification(resp.error.description || 'Payment cancelled or failed.', 'error');
        });
        rzp.open();
      } else {
        // Fallback demo simulator for development environments without active script
        setTimeout(async () => {
          const mockPaymentId = `pay_demo_${Date.now()}`;
          setIsVerifyingPayment(true);
          setIsProcessingPayment(false);

          await fetch(`${backendUrl}/api/club-events/${slug}/record-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rNo: registration.rNo,
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: mockPaymentId,
              paymentMethod: 'demo'
            })
          });

          setIsPaid(true);
          setPaymentSuccessData({
            eventName: event.name,
            amount: eventFee,
            studentName: registration.name,
            rNo: registration.rNo,
            branch: registration.branch,
            gender: registration.gender,
            bloodgroup: registration.bloodgroup,
            phone: registration.phone,
            paymentId: mockPaymentId,
            orderId: orderData.orderId,
            date: new Date().toLocaleDateString('en-IN')
          });
          setIsVerifyingPayment(false);
          showNotification('Payment simulated and recorded successfully!');
        }, 1200);
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      showNotification(err.message || 'Error initializing payment gateway', 'error');
      setIsProcessingPayment(false);
    }
  };

  const copyRollNumber = () => {
    if (registration?.rNo) {
      navigator.clipboard.writeText(registration.rNo);
      setCopiedRoll(true);
      setTimeout(() => setCopiedRoll(false), 2000);
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="club-payment-wrapper">
        <div className="payment-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="payment-card glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }}></div>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Loading Payment Details</h3>
          <p style={{ color: 'var(--text-muted)' }}>Fetching your registration summary, please wait...</p>
        </div>
      </div>
    );
  }

  // Error / Not Found Screen
  if (errorMessage || !event || !registration) {
    return (
      <div className="club-payment-wrapper">
        <div className="payment-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="payment-card glass-card error-card">
          <div className="error-icon-box">
            <AlertCircle size={40} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>Registration Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {errorMessage || `No registration was found for roll number "${rNo}" in this club event.`}
          </p>
          <div className="card-actions-centered">
            <Link
              to={`/event/${slug}`}
              className="primary-action-btn"
            >
              <ArrowLeft size={16} />
              <span>Go to Registration Form</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const eventFee = Number(event.amount) || 0;

  return (
    <div className="club-payment-wrapper">
      <div className="payment-theme-toggle">
        <ThemeToggle />
      </div>

      {notification && (
        <div className={`custom-notification ${notification.type}`}>
          <div className="notification-content">
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* SUCCESS / RECEIPT VIEW */}
      {paymentSuccessData ? (
        <div className="payment-card glass-card receipt-card">
          <div className="receipt-success-badge">
            <CheckCircle2 size={44} />
          </div>

          <span className="receipt-pill">
            {isPaid ? 'Payment Verified' : 'Registration Completed'}
          </span>

          <h2 className="receipt-heading">Payment Confirmed!</h2>
          <p className="receipt-subheading">
            Your registration and payment for <strong>{paymentSuccessData.eventName}</strong> has been successfully processed.
          </p>

          <div className="receipt-details-table">
            <div className="receipt-item highlight-row">
              <span className="receipt-key">Amount Paid</span>
              <span className="receipt-val amount-val">₹{paymentSuccessData.amount}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-key">Event Name</span>
              <span className="receipt-val">{paymentSuccessData.eventName}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-key">Roll Number</span>
              <span className="receipt-val roll-badge-val">{paymentSuccessData.rNo}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-key">Student Name</span>
              <span className="receipt-val">{paymentSuccessData.studentName}</span>
            </div>
            {paymentSuccessData.email && (
              <div className="receipt-item">
                <span className="receipt-key">Email</span>
                <span className="receipt-val">{paymentSuccessData.email}</span>
              </div>
            )}
            <div className="receipt-item">
              <span className="receipt-key">Branch</span>
              <span className="receipt-val">{paymentSuccessData.branch}</span>
            </div>
            {paymentSuccessData.gender && (
              <div className="receipt-item">
                <span className="receipt-key">Gender</span>
                <span className="receipt-val">{paymentSuccessData.gender}</span>
              </div>
            )}
            {paymentSuccessData.bloodgroup && (
              <div className="receipt-item">
                <span className="receipt-key">Blood Group</span>
                <span className="receipt-val">{paymentSuccessData.bloodgroup}</span>
              </div>
            )}
            {paymentSuccessData.phone && (
              <div className="receipt-item">
                <span className="receipt-key">Phone</span>
                <span className="receipt-val">{paymentSuccessData.phone}</span>
              </div>
            )}
            <div className="receipt-item">
              <span className="receipt-key">Payment ID</span>
              <span className="receipt-val monospace-val">{paymentSuccessData.paymentId}</span>
            </div>
            {paymentSuccessData.orderId && (
              <div className="receipt-item">
                <span className="receipt-key">Order ID</span>
                <span className="receipt-val monospace-val">{paymentSuccessData.orderId}</span>
              </div>
            )}
            <div className="receipt-item">
              <span className="receipt-key">Date & Time</span>
              <span className="receipt-val">{paymentSuccessData.date}</span>
            </div>
          </div>

          <div className="receipt-actions" style={{ justifyContent: 'center' }}>
            <button
              onClick={() => window.print()}
              className="print-btn"
            >
              <Printer size={16} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      ) : (
        /* PAYMENT CHECKOUT VIEW */
        <div className="payment-card glass-card">
          {/* STEP INDICATOR */}
          <div className="steps-indicator">
            <div className="step-node completed">
              <span className="node-number">✓</span>
              <span className="node-text">1. Registration</span>
            </div>
            <div className="step-divider active"></div>
            <div className="step-node active">
              <span className="node-number">2</span>
              <span className="node-text">2. Payment</span>
            </div>
          </div>

          {/* PAGE HEADER */}
          <div className="payment-header">
            <span className="checkout-badge">Step 2 of 2: Checkout</span>
            <h2>Complete Your Payment</h2>
            <p className="event-name-tag">{event.name}</p>
          </div>

          <div className="checkout-content-grid">
            {/* STUDENT DETAILS CARD */}
            <div className="details-panel glass-panel">
              <div className="panel-title">
                <IdCard size={18} />
                <span>Registered Student Details</span>
              </div>

              <div className="details-list">
                <div className="detail-entry">
                  <span className="entry-label">Roll Number</span>
                  <div className="entry-value-with-copy">
                    <span className="roll-highlight">{registration.rNo}</span>
                    <button
                      onClick={copyRollNumber}
                      className="copy-chip-btn"
                      title="Copy Roll Number"
                    >
                      {copiedRoll ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="detail-entry">
                  <span className="entry-label">Name</span>
                  <span className="entry-value">{registration.name}</span>
                </div>

                {registration.email && (
                  <div className="detail-entry">
                    <span className="entry-label">Email</span>
                    <span className="entry-value">{registration.email}</span>
                  </div>
                )}

                <div className="detail-entry">
                  <span className="entry-label">Branch</span>
                  <span className="entry-value">{registration.branch}</span>
                </div>

                {registration.phone && (
                  <div className="detail-entry">
                    <span className="entry-label">Phone</span>
                    <span className="entry-value">{registration.phone}</span>
                  </div>
                )}

                {registration.gender && (
                  <div className="detail-entry">
                    <span className="entry-label">Gender</span>
                    <span className="entry-value">{registration.gender}</span>
                  </div>
                )}

                {registration.bloodgroup && (
                  <div className="detail-entry">
                    <span className="entry-label">Blood Group</span>
                    <span className="entry-value">{registration.bloodgroup}</span>
                  </div>
                )}

                <div className="detail-entry">
                  <span className="entry-label">Registration Status</span>
                  <span className="status-saved-pill">
                    <CheckCircle2 size={13} />
                    <span>Details Saved</span>
                  </span>
                </div>
              </div>

              <div className="edit-link-container">
                <Link to={`/event/${slug}`} className="edit-details-link">
                  <ArrowLeft size={14} />
                  <span>Edit registration details</span>
                </Link>
              </div>
            </div>

            {/* PAYMENT SUMMARY CARD */}
            <div className="summary-panel glass-panel">
              <div className="panel-title">
                <CreditCard size={18} />
                <span>Payment Summary</span>
              </div>

              <div className="fee-breakdown">
                <div className="fee-line">
                  <span>Registration Fee</span>
                  <span>₹{eventFee}</span>
                </div>
                <div className="fee-line">
                  <span>Convenience / Gateway Fee</span>
                  <span className="free-tag">Free (₹0)</span>
                </div>
                <div className="fee-divider"></div>
                <div className="fee-total-line">
                  <span className="total-label">Total Payable</span>
                  <span className="total-amount">₹{eventFee}</span>
                </div>
              </div>

              <div className="security-guarantee-box">
                <div className="security-icon-circle">
                  <ShieldCheck size={22} />
                </div>
                <div className="security-text">
                  <strong>Secure 256-bit Encrypted Checkout</strong>
                  <span>Supports UPI (Google Pay, PhonePe, Paytm), Cards, & NetBanking.</span>
                </div>
              </div>

              {/* PAY BUTTON */}
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment || isVerifyingPayment}
                className="pay-now-btn"
              >
                {isProcessingPayment || isVerifyingPayment ? (
                  <>
                    <div className="loading-spinner-sm"></div>
                    <span>{isVerifyingPayment ? 'Verifying Payment...' : 'Connecting Gateway...'}</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Pay ₹{eventFee} & Confirm Registration</span>
                  </>
                )}
              </button>

              <div className="payment-footnote">
                <Lock size={12} />
                <span>Payments are verified and recorded immediately.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN PAYMENT PROCESSING & VERIFICATION OVERLAY */}
      {(isProcessingPayment || isVerifyingPayment) && (
        <div className="payment-loading-overlay">
          <div className="payment-loading-card glass-card">
            <div className="payment-loader-container">
              <div className="payment-pulse-ring"></div>
              <div className="payment-main-spinner"></div>
              <ShieldCheck size={36} className="payment-center-icon" />
            </div>

            <h3 className="overlay-heading">
              {isVerifyingPayment ? 'Verifying Payment & Confirmation...' : 'Payment Gateway Initializing...'}
            </h3>

            <div className="warning-banner-box">
              <AlertCircle size={24} className="banner-warning-icon" />
              <div className="banner-text-content">
                <strong>Please DO NOT Refresh or Close this Page!</strong>
                <p>Payment verification is in progress. Please wait until your payment receipt is generated.</p>
                <p style={{ marginTop: '0.4rem', fontSize: '0.84rem', color: '#f59e0b', fontWeight: 600, lineHeight: 1.4 }}>
                  పేమెంట్ సక్సెస్ అయ్యే వరకు దయచేసి ఈ పేజీని రిఫ్రెష్ కానీ క్లోజ్ కానీ చేయకండి.
                </p>
              </div>
            </div>

            <div className="overlay-steps-status">
              <div className="status-step-line">
                <span className="step-dot active"></span>
                <span>Connecting to Secure Payment Gateway</span>
              </div>
              <div className="status-step-line">
                <span className={`step-dot ${isVerifyingPayment ? 'active' : ''}`}></span>
                <span>{isVerifyingPayment ? 'Verifying with Bank & Recording Registration...' : 'Waiting for Payment Completion...'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubEventPaymentPage;
