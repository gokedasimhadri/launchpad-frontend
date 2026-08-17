import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, Bell, Headphones, ChevronRight } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Students', path: '/dashboard/students', icon: <Users size={20} /> },
  ];

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="navbar-right">
          <div className="notification-bell">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </div>
          <button onClick={handleLogout} className="top-logout-btn" title="Logout">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile sidebar toggle */}
      <div className="mobile-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={24} />
        </button>
        <h2>Launchpad</h2>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar glass-card ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <svg className="aditya-logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4,4" />
            <circle cx="50" cy="50" r="33" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            <polygon points="50,30 54.7,43.5 69,43.8 57.6,52.5 61.8,66.2 50,58 38.2,66.2 42.4,52.5 31,43.8 45.3,43.5" fill="#fbbf24" />
          </svg>
          <div className="aditya-logo-text">
            <span className="aditya-text">ADITYA</span>
            <span className="university-text">UNIVERSITY</span>
          </div>
        </div>
        
        <div className="sidebar-header">
          <h2>DEAN</h2>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-support-card">
          <div className="support-icon">
            <Headphones size={18} />
          </div>
          <div className="support-content">
            <h4>Need Help?</h4>
            <p>We're here to help you</p>
          </div>
          <ChevronRight size={16} className="support-arrow" />
        </div>

        {/* Sidebar Background Pattern */}
        <div className="sidebar-pattern">
          <svg viewBox="0 0 280 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#312e81" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="1"/>
              </linearGradient>
            </defs>
            {/* Stars */}
            <circle cx="50" cy="100" r="1" fill="#fff" opacity="0.3" />
            <circle cx="150" cy="80" r="1.5" fill="#fff" opacity="0.5" />
            <circle cx="220" cy="120" r="1" fill="#fff" opacity="0.4" />
            <circle cx="25" cy="160" r="1" fill="#fff" opacity="0.2" />
            <circle cx="100" cy="140" r="2" fill="#fff" opacity="0.6" />
            {/* Clouds */}
            <path d="M 160 120 Q 170 100 190 110 Q 210 100 220 120 Q 240 120 230 140 L 150 140 Q 140 120 160 120" fill="#1e1b4b" opacity="0.6"/>
            {/* Hills */}
            <path d="M 0 250 Q 80 200 150 250 T 280 230 L 280 300 L 0 300 Z" fill="url(#hillGrad)"/>
            <path d="M 100 300 Q 200 220 280 260 L 280 300 L 100 300 Z" fill="#2e3192" opacity="0.4"/>
            {/* Building/Castle Silhouette */}
            <path d="M 40 250 L 40 200 L 55 200 L 55 180 L 65 180 L 65 200 L 80 200 L 80 150 L 95 150 L 95 120 L 105 120 L 105 150 L 120 150 L 120 200 L 135 200 L 135 180 L 145 180 L 145 200 L 160 200 L 160 250 Z" fill="#2c2a7a"/>
            <path d="M 70 150 L 90 120 L 110 150 Z" fill="#2c2a7a"/>
            {/* Windows */}
            <rect x="50" y="210" width="6" height="8" fill="#4f46e5" opacity="0.5"/>
            <rect x="65" y="210" width="6" height="8" fill="#4f46e5" opacity="0.5"/>
            <rect x="90" y="170" width="8" height="10" fill="#4f46e5" opacity="0.8"/>
            <rect x="110" y="170" width="8" height="10" fill="#4f46e5" opacity="0.8"/>
            <rect x="85" y="210" width="8" height="10" fill="#4f46e5" opacity="0.8"/>
            <rect x="115" y="210" width="8" height="10" fill="#4f46e5" opacity="0.8"/>
            <rect x="130" y="210" width="6" height="8" fill="#4f46e5" opacity="0.5"/>
            <rect x="145" y="210" width="6" height="8" fill="#4f46e5" opacity="0.5"/>
            {/* Trees */}
            <circle cx="30" cy="245" r="15" fill="#1e1b4b"/>
            <circle cx="15" cy="255" r="12" fill="#1e1b4b"/>
            <circle cx="170" cy="245" r="15" fill="#1e1b4b"/>
            <circle cx="185" cy="255" r="12" fill="#1e1b4b"/>
          </svg>
        </div>
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
