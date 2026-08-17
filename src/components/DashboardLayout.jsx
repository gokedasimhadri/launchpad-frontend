import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu } from 'lucide-react';
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
        <div className="logo-container">
          <svg className="aditya-logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ca8a04" strokeWidth="2" strokeDasharray="5,5" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#ca8a04" strokeWidth="1" opacity="0.5" />
            <path d="M50 35 L53 45 L63 45 L55 51 L58 61 L50 55 L42 61 L45 51 L37 45 L47 45 Z" fill="#ca8a04" />
            <circle cx="50" cy="5" r="3" fill="#ca8a04" />
            <circle cx="95" cy="50" r="2" fill="#ca8a04" />
            <circle cx="5" cy="50" r="2" fill="#ca8a04" />
          </svg>
          <div className="aditya-logo-text">
            <span className="aditya-text">ADITYA</span>
            <span className="university-text">UNIVERSITY</span>
          </div>
        </div>
        <div className="navbar-right">
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
