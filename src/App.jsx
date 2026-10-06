import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import OrientationForm from './components/OrientationForm';
import StudentPaymentForm from './components/StudentPaymentForm';
import StudentPaymentForm2 from './components/StudentPaymentForm2';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
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
            <Route path="scanqr" element={<ScanQR />} />
          </Route>
          
          {/* Public Routes */}
          <Route path="/orientation" element={<OrientationForm />} />
          <Route path="/student-pay" element={<StudentPaymentForm />} />
          <Route path="/pay" element={<StudentPaymentForm />} />
          
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
