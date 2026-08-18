import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, Bell, Headphones, ChevronRight, QrCode } from 'lucide-react';
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
    { name: 'Scan QR', path: '/dashboard/scanqr', icon: <QrCode size={20} /> },
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
            <circle cx="50" cy="50" r="46" fill="none" stroke="#fbbf24" strokeWidth="0.5" />
            <circle cx="25" cy="9" r="1.5" fill="#fbbf24" />
            
            <circle cx="50" cy="50" r="38" fill="none" stroke="#fbbf24" strokeWidth="0.5" />
            <circle cx="85" cy="35" r="1" fill="#fbbf24" />
            <circle cx="15" cy="65" r="1" fill="#fbbf24" />
            <circle cx="80" cy="70" r="1.5" fill="#fbbf24" />

            <circle cx="50" cy="50" r="30" fill="none" stroke="#fbbf24" strokeWidth="1" />
            
            {/* Sun rays */}
            <path d="M50 20 Q53 30 55 35 Q50 32 45 35 Q47 30 50 20" fill="#fbbf24"/>
            <path d="M71 29 Q63 36 58 40 Q55 35 52 33 Q61 34 71 29" fill="#fbbf24"/>
            <path d="M80 50 Q70 53 65 55 Q65 50 65 45 Q70 47 80 50" fill="#fbbf24"/>
            <path d="M71 71 Q63 64 58 60 Q55 65 52 67 Q61 66 71 71" fill="#fbbf24"/>
            <path d="M50 80 Q53 70 55 65 Q50 68 45 65 Q47 70 50 80" fill="#fbbf24"/>
            <path d="M29 71 Q37 64 42 60 Q45 65 48 67 Q39 66 29 71" fill="#fbbf24"/>
            <path d="M20 50 Q30 53 35 55 Q35 50 35 45 Q30 47 20 50" fill="#fbbf24"/>
            <path d="M29 29 Q37 36 42 40 Q45 35 48 33 Q39 34 29 29" fill="#fbbf24"/>
            
            <circle cx="50" cy="50" r="12" fill="#fbbf24" />
            
            {/* The 'A' inside the sun */}
            <path d="M50 42 L45 53 L47 53 L48.5 49 L51.5 49 L53 53 L55 53 Z M49 47.5 L50 44 L51 47.5 Z" fill="#0f172a" />
            
            {/* Bottom decorative stand */}
            <path d="M35 85 Q50 90 65 85" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="34" cy="84" r="1.5" fill="#fbbf24" />
            <circle cx="66" cy="84" r="1.5" fill="#fbbf24" />
            <path d="M42 85 L58 85" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="50" cy="81" r="2" fill="#fbbf24" />
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
