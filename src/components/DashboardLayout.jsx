import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, Calendar, ChevronDown, Sparkles, ClipboardList } from 'lucide-react';
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

  useEffect(() => {
    // Keep students menu open if visiting a student route
    if (location.pathname.startsWith('/dashboard/students')) {
      setStudentsMenuOpen(true);
    }
    // Keep events menu open if visiting an event route
    if (
      location.pathname.startsWith('/dashboard/events') ||
      location.pathname.includes('club-events') ||
      location.pathname.includes('registrations')
    ) {
      setEventsMenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Simple auth check
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  const isStudentsActive =
    location.pathname.startsWith('/dashboard/students') &&
    !location.pathname.includes('club-events');

  const isEventsActive =
    location.pathname.startsWith('/dashboard/events') ||
    location.pathname.includes('club-events') ||
    location.pathname.includes('registrations');

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="top-navbar">
        <button className="menu-btn mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={24} />
        </button>
        <div className="navbar-right">
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
            {/* Dashboard */}
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

            {/* Students Dropdown Group */}
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

            {/* Events Parent Menu */}
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
                      className={`submenu-link ${location.pathname.includes('/registrations') ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <ClipboardList size={15} style={{ color: 'var(--primary-color)' }} />
                      <span>Registrations</span>
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
