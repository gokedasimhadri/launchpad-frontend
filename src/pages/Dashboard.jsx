import React, { useEffect, useState } from 'react';
import { BookOpen, MoreHorizontal, Calendar, Users, ClipboardCheck } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import './Dashboard.css';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#f43f5e', '#a855f7', '#84cc16'];
const BRANCH_ICONS = {
  'Ag.E': BookOpen,
  'AIML': BookOpen,
  'MEC': BookOpen,
  'CSE': BookOpen
};

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, branchStats: [] });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002';
        const url = selectedDate 
          ? `${backendUrl}/api/statistics?date=${selectedDate}`
          : `${backendUrl}/api/statistics`;
        const response = await fetch(url);
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
  }, [selectedDate]);

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

  // Process all branches dynamically
  const processedBranchStats = stats.branchStats.map(branch => {
    return {
      name: branch.name,
      value: branch.count,
      percentage: stats.totalStudents > 0 ? (branch.count / stats.totalStudents * 100).toFixed(0) : 0
    };
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Welcome</h1>
        </div>
        <div className="date-filter-container">
          <Calendar size={18} className="date-filter-icon" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="date-filter-input"
          />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content" style={{ display: 'flex', gap: '3.5rem', flexWrap: 'wrap' }}>
          <div className="hero-text" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '0.9rem', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <Users size={32} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Participants</h3>
              <h2 style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1.1 }}>{stats.totalStudents}</h2>
            </div>
          </div>
          <div className="hero-text" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '0.9rem', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <ClipboardCheck size={32} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Attended</h3>
              <h2 style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1.1 }}>{stats.totalAttended || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="dashboard-section">
          <h2>Branch-wise Statistics</h2>
          <div className="branch-grid">
            {processedBranchStats.map((branch, index) => {
              const IconComponent = BRANCH_ICONS[branch.name] || BookOpen;
              const branchColor = COLORS[index % COLORS.length];
              return (
                <div key={branch.name} className="branch-stat-card glass-card">
                  <div className="branch-card-header">
                    <div className="branch-icon-box" style={{ background: `${branchColor}20`, color: branchColor }}>
                      <IconComponent size={18} />
                    </div>
                    <div className="branch-card-title">
                      <h4>{branch.name}</h4>
                      <div className="branch-count">{branch.value}</div>
                      <span>{branch.value === 1 ? 'Student' : 'Students'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="chart-card glass-card" style={{ marginTop: '2.1rem' }}>
            <div className="chart-header">
              <h3>Attendance Distribution</h3>
              <MoreHorizontal size={20} className="more-icon" />
            </div>
            <div className="donut-body">
              <div className="donut-chart-wrapper">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={processedBranchStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={5}
                    >
                      {processedBranchStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#1e293b' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-text">
                  <h2>{stats.totalStudents}</h2>
                  <p>Total</p>
                </div>
              </div>
              <div className="custom-legend">
                {processedBranchStats.map((branch, index) => (
                  <div key={branch.name} className="legend-item">
                    <span className="legend-color" style={{ background: COLORS[index] }}></span>
                    <span className="legend-name">{branch.name}</span>
                    <span className="legend-count">{branch.value} {branch.value === 1 ? 'Student' : 'Students'}</span>
                    <span className="legend-percentage">{branch.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
