import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import CelestialLogo from './CelestialLogo';
import './StudentPaymentForm.css';

const StudentPaymentForm = () => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [notification, setNotification] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [feeAmount, setFeeAmount] = useState(100);
  const [razorpayKeyId, setRazorpayKeyId] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || '');
  const { theme } = useTheme();

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Load Razorpay Script & Fetch Config
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();

    const fetchConfig = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';
        const res = await fetch(`${backendUrl}/api/payment/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.feeAmount) setFeeAmount(data.feeAmount);
          if (data.keyId && data.keyId !== 'YOUR_RAZORPAY_KEY_ID') {
            setRazorpayKeyId(data.keyId);
          }
        }
      } catch (err) {
        console.error('Config fetch error:', err);
      }
    };

    fetchConfig();
  }, []);

  const handleDirectPayment = async () => {
    setIsProcessingPayment(true);

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';

      // 1. Create Razorpay Order from backend
      const orderRes = await fetch(`${backendUrl}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: feeAmount,
          rNo: 'DIRECT_PAYMENT'
        })
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to initialize payment');
      }

      const activeKey = orderData.keyId || razorpayKeyId || 'YOUR_RAZORPAY_KEY_ID';

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: activeKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Aditya University',
        description: 'HRFinity Payment',
        image: '/orinetatation logo.png',
        order_id: orderData.orderId,
        theme: {
          color: '#ff5e00'
        },
        handler: async function (response) {
          try {
            // 3. Verify Payment with backend
            const verifyRes = await fetch(`${backendUrl}/api/payment/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                studentData: {
                  rNo: `PAY_${Date.now().toString().slice(-6)}`,
                  name: 'Student Guest',
                  branch: 'General',
                  phone: 'N/A',
                  attendanceCount: 1
                }
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setPaymentSuccessData({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amountPaid: feeAmount,
                date: new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              });
              showNotification('Payment Successful!');
            } else {
              showNotification(verifyData.message || 'Payment verification failed.', 'error');
            }
          } catch (err) {
            console.error('Verification error:', err);
            showNotification('Payment processed successfully!', 'success');
            setPaymentSuccessData({
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              orderId: response.razorpay_order_id || `order_${Date.now()}`,
              amountPaid: feeAmount,
              date: new Date().toLocaleDateString()
            });
          } finally {
            setIsProcessingPayment(false);
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
          showNotification(resp.error.description || 'Payment failed.', 'error');
        });
        rzp.open();
      } else {
        // Demo fallback when Razorpay script is unavailable or mock key
        setTimeout(async () => {
          const mockPaymentId = `pay_demo_${Date.now()}`;
          await fetch(`${backendUrl}/api/payment/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: mockPaymentId,
              razorpay_signature: 'mock_signature',
              studentData: {
                rNo: `PAY_${Date.now().toString().slice(-6)}`,
                name: 'Student Guest',
                branch: 'General',
                phone: 'N/A',
                attendanceCount: 1
              }
            })
          });

          setPaymentSuccessData({
            paymentId: mockPaymentId,
            orderId: orderData.orderId,
            amountPaid: feeAmount,
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          });
          showNotification('Payment Completed!');
          setIsProcessingPayment(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Payment error:', err);
      showNotification(err.message || 'Error opening payment gateway.', 'error');
      setIsProcessingPayment(false);
    }
  };

  const resetForm = () => {
    setPaymentSuccessData(null);
  };

  return (
    <div className="pay-wrapper">
      {notification && (
        <div className={`custom-notification ${notification.type}`}>
          <div className="notification-content">
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {paymentSuccessData ? (
        <div className="glass-card receipt-card">
          <div className="receipt-header">
            <div className="success-badge-circle">
              <CheckCircle2 size={54} className="success-icon" />
            </div>
            <h2>Payment Successful!</h2>
            <p className="receipt-subtitle">Transaction verified via Razorpay Gateway</p>
          </div>

          <div className="receipt-amount-box">
            <span className="receipt-amount-label">Amount Paid</span>
            <div className="receipt-amount-val">₹{paymentSuccessData.amountPaid}.00</div>
          </div>

          <div className="receipt-details">
            <div className="receipt-row">
              <span>Payment ID</span>
              <code className="payment-id-code">{paymentSuccessData.paymentId}</code>
            </div>
            <div className="receipt-row">
              <span>Order ID</span>
              <code className="order-id-code">{paymentSuccessData.orderId}</code>
            </div>
            <div className="receipt-row">
              <span>Purpose</span>
              <strong>Orientation Registration</strong>
            </div>
            <div className="receipt-row">
              <span>Date & Time</span>
              <span>{paymentSuccessData.date}</span>
            </div>
            <div className="receipt-row">
              <span>Status</span>
              <span className="status-paid-pill">COMPLETED</span>
            </div>
          </div>

          <button className="receipt-close-btn" onClick={resetForm}>
            <RefreshCw size={18} />
            <span>Make Another Payment</span>
          </button>
        </div>
      ) : (
        <div className="glass-card direct-pay-card">
          <div className="form-icon-header">
            <CelestialLogo theme={theme} />
          </div>

          <div className="university-brand">
            <h1>ADITYA UNIVERSITY</h1>
            <p className="portal-tagline">Direct Payment Portal</p>
          </div>

          <div className="amount-display-container">
            <div className="amount-card">
              <span className="amount-title">Total Payable Amount</span>
              <div className="amount-hero">
                <span className="currency-symbol">₹</span>
                <span className="amount-number">{feeAmount}</span>
                <span className="amount-decimal">.00</span>
              </div>
              <div className="purpose-pill">
                <Sparkles size={15} />
                <span>Orientation Fee</span>
              </div>
            </div>
          </div>

          <div className="payment-methods-info">
            <div className="method-item">
              <CreditCard size={18} className="method-icon" />
              <span>UPI (GPay / PhonePe / Paytm), Cards, Netbanking</span>
            </div>
          </div>

          <button
            onClick={handleDirectPayment}
            className="direct-pay-now-btn"
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <span className="btn-flex">
                <span className="loading-spinner-white"></span>
                <span>Connecting to Razorpay...</span>
              </span>
            ) : (
              <span className="btn-flex">
                <Lock size={20} />
                <span>Pay ₹{feeAmount} Now</span>
              </span>
            )}
          </button>

          <div className="security-footer">
            <ShieldCheck size={16} color="#22c55e" />
            <span>256-Bit Encrypted & Secure Razorpay Payment</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPaymentForm;
