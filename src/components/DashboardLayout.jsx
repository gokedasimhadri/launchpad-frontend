import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, Calendar, ChevronDown, Sparkles, ClipboardList, Ticket, QrCode } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studentsMenuOpen, setStudentsMenuOpen] = useState(true);
  const [eventsMenuOpen, setEventsMenuOpen] = useState(true);
  const { theme } = useTheme();

  // Check if logged-in user is Dean
  const getUserAccount = () => {
    try {
      return JSON.parse(localStorage.getItem('userAccount') || '{}');
    } catch {
      return {};
    }
  };

  const userAccount = getUserAccount();
  const getIsDean = () => {
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    const username = (userAccount?.username || '').toLowerCase();
    return role === 'dean' || username === 'dean';
  };

  const isDean = getIsDean();

  useEffect(() => {
    // Keep students menu open if visiting a student route
    if (location.pathname.startsWith('/dashboard/students')) {
      setStudentsMenuOpen(true);
    }
    // Keep events menu open if visiting an event route
    if (
      location.pathname.startsWith('/dashboard/events') ||
      location.pathname.includes('club-events') ||
      location.pathname.includes('registrations') ||
      location.pathname.includes('sendcoupons') ||
      location.pathname.includes('send-coupons') ||
      location.pathname.includes('scan-attendance') ||
      location.pathname.includes('scanattendance')
    ) {
      setEventsMenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Simple auth check
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      navigate('/');
      return;
    }

    // Role-based route guard: Non-dean users can ONLY access the Events module
    if (!isDean) {
      if (
        location.pathname === '/dashboard' ||
        location.pathname === '/dashboard/' ||
        location.pathname.startsWith('/dashboard/students')
      ) {
        navigate('/dashboard/events/club-events', { replace: true });
      }
    }
  }, [navigate, location.pathname, isDean]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userAccount');
    navigate('/');
  };

  const isStudentsActive =
    location.pathname.startsWith('/dashboard/students') &&
    !location.pathname.includes('club-events');

  const isEventsActive =
    location.pathname.startsWith('/dashboard/events') ||
    location.pathname.includes('club-events') ||
    location.pathname.includes('registrations') ||
    location.pathname.includes('sendcoupons') ||
    location.pathname.includes('send-coupons') ||
    location.pathname.includes('scan-attendance') ||
    location.pathname.includes('scanattendance');

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="top-navbar">
        <button className="menu-btn mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={24} />
        </button>
        <div className="navbar-right">
          {userAccount?.username && (
            <div className="top-user-info" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: isDean ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${isDean ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
              color: isDean ? '#059669' : '#2563eb',
              fontSize: '0.82rem',
              fontWeight: '600'
            }}>
              <span>{isDean ? 'Dean (Admin)' : `Role: ${userAccount.username}`}</span>
            </div>
          )}
          <ThemeToggle />
          <button onClick={handleLogout} className="top-logout-btn" title="Logout">
            <LogOut size={20} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar glass-card ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <img
            src={theme === 'light' ? '/ADITYA LOGO2.png' : '/Aditya University Gold Logo.png'}
            alt="Aditya University Logo"
            className="sidebar-logo-img"
          />
        </div>

        <nav className="sidebar-nav">
          <ul>
            {/* Dashboard (Dean Only) */}
            {isDean && (
              <li>
                <Link
                  to="/dashboard"
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </Link>
              </li>
            )}

            {/* Students Dropdown Group (Dean Only) */}
            {isDean && (
              <li className="nav-group">
                <div
                  className={`nav-link has-submenu ${isStudentsActive ? 'active-parent' : ''}`}
                  onClick={() => setStudentsMenuOpen(!studentsMenuOpen)}
                >
                  <div className="nav-link-content">
                    <Users size={20} />
                    <span>Students</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`submenu-arrow ${studentsMenuOpen ? 'rotated' : ''}`}
                  />
                </div>

                {studentsMenuOpen && (
                  <ul className="submenu-list">
                    <li>
                      <Link
                        to="/dashboard/students"
                        className={`submenu-link ${location.pathname === '/dashboard/students' ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="submenu-bullet"></span>
                        <span>Students List</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}

            {/* Events Parent Menu (Visible to all) */}
            <li className="nav-group">
              <div
                className={`nav-link has-submenu ${isEventsActive ? 'active-parent' : ''}`}
                onClick={() => setEventsMenuOpen(!eventsMenuOpen)}
              >
                <div className="nav-link-content">
                  <Calendar size={20} />
                  <span>Events</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`submenu-arrow ${eventsMenuOpen ? 'rotated' : ''}`}
                />
              </div>

              {eventsMenuOpen && (
                <ul className="submenu-list">
                  <li>
                    <Link
                      to="/dashboard/events/club-events"
                      className={`submenu-link ${location.pathname.includes('/club-events') ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Sparkles size={15} style={{ color: 'var(--primary-color)' }} />
                      <span>Club Events</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard/events/registrations"
                      className={`submenu-link ${location.pathname.includes('/registrations') && !location.pathname.includes('/sendcoupons') && !location.pathname.includes('/send-coupons') ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <ClipboardList size={15} style={{ color: 'var(--primary-color)' }} />
                      <span>Registrations & Payments</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard/events/sendcoupons"
                      className={`submenu-link ${location.pathname.includes('/sendcoupons') || location.pathname.includes('/send-coupons') ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Ticket size={15} style={{ color: 'var(--primary-color)' }} />
                      <span>Send Coupons</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard/events/scan-attendance"
                      className={`submenu-link ${location.pathname.includes('/scan-attendance') || location.pathname.includes('/scanattendance') ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <QrCode size={15} style={{ color: 'var(--primary-color)' }} />
                      <span>Scan Attendance</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default DashboardLayout;
