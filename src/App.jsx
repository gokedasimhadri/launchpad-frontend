import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import OrientationForm from './components/OrientationForm';
import StudentPaymentForm from './components/StudentPaymentForm';
import StudentPaymentForm2 from './components/StudentPaymentForm2';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import ClubEvents from './pages/ClubEvents';
import ClubEventRegistrations from './pages/ClubEventRegistrations';
import ClubEventPublicRegistration from './pages/ClubEventPublicRegistration';
import ClubEventPaymentPage from './pages/ClubEventPaymentPage';
import DashboardLayout from './components/DashboardLayout';
import ScanQR from './pages/ScanQR';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected Dashboard Route */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="events" element={<Navigate to="/dashboard/events/club-events" replace />} />
            <Route path="events/club-events" element={<ClubEvents />} />
            <Route path="events/registrations" element={<ClubEventRegistrations />} />
            {/* Backward-compatibility aliases */}
            <Route path="students/club-events" element={<Navigate to="/dashboard/events/club-events" replace />} />
            <Route path="club-events" element={<Navigate to="/dashboard/events/club-events" replace />} />
            <Route path="scanqr" element={<ScanQR />} />
          </Route>
          
          {/* Public Routes */}
          <Route path="/orientation" element={<OrientationForm />} />
          <Route path="/student-pay" element={<StudentPaymentForm />} />
          <Route path="/pay" element={<StudentPaymentForm />} />
          <Route path="/event/:slug" element={<ClubEventPublicRegistration />} />
          <Route path="/event/:slug/payment/:rNo" element={<ClubEventPaymentPage />} />
          <Route path="/event/:slug/payment" element={<ClubEventPaymentPage />} />
          <Route path="/event/:slug/pay/:rNo" element={<ClubEventPaymentPage />} />
          
          {/* 2 Rupees Payment Routes */}
          <Route path="/student-pay-2" element={<StudentPaymentForm2 />} />
          <Route path="/pay-2" element={<StudentPaymentForm2 />} />

          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
