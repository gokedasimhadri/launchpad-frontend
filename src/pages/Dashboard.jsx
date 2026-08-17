import React, { useEffect, useState } from 'react';
import { Users, BookOpen, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, branchStats: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/statistics`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Failed to fetch statistics');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error glass-card">
        <h3>Oops!</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Overview</h1>
        <p>Orientation attendance statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card total-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Attended</h3>
            <div className="stat-value">{stats.totalStudents}</div>
            <p className="stat-trend"><TrendingUp size={14} /> Overall Attendance</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Branch-wise Statistics</h2>
        <div className="branch-grid">
          {stats.branchStats.length > 0 ? (
            stats.branchStats.map((branch, index) => (
              <div key={index} className="branch-card glass-card">
                <div className="branch-header">
                  <div className="branch-icon">
                    <BookOpen size={20} />
                  </div>
                  <h3>{branch.name}</h3>
                </div>
                <div className="branch-value">{branch.count}</div>
                <p>Students</p>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${(branch.count / stats.totalStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No branch statistics available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
