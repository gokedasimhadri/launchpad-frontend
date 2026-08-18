import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import CelestialLogo from '../components/CelestialLogo';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';
      const response = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        // Simple auth state: store in localStorage (for demo purposes)
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="icon-wrapper">
            <CelestialLogo theme={theme} />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to access the dashboard</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn login-btn"
            disabled={isLoading}
          >
            {isLoading ? <span className="loading-spinner static-spinner"></span> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
