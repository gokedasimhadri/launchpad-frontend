import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-switch-pill ${theme === 'dark' ? 'is-dark' : 'is-light'} ${className}`}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      aria-label="Toggle Theme"
      type="button"
    >
      <span className="switch-track">
        <span className="switch-icon sun-icon">
          <Sun size={14} />
        </span>
        <span className="switch-icon moon-icon">
          <Moon size={14} />
        </span>
        <span className="switch-thumb">
          {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
