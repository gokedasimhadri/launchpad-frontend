import React, { useEffect, useState } from 'react';
import { BookOpen, TrendingUp, Calendar, MoreHorizontal, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const MOCK_WEEKLY_DATA = [
  { name: 'Mon', attendance: 2 },
  { name: 'Tue', attendance: 6 },
  { name: 'Wed', attendance: 6 },
  { name: 'Thu', attendance: 11 },
  { name: 'Fri', attendance: 9 },
  { name: 'Sat', attendance: 12 },
  { name: 'Sun', attendance: 14 }
];

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981'];
const BRANCH_ICONS = {
  'Ag.E': BookOpen,
  'AIML': BookOpen,
  'MEC': BookOpen,
  'CSE': BookOpen
};

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

  // Ensure 4 specific branches for the donut chart and cards
  const activeBranches = ['Ag.E', 'AIML', 'MEC', 'CSE'];
  const processedBranchStats = activeBranches.map(branchName => {
    const found = stats.branchStats.find(b => b.name === branchName);
    return {
      name: branchName,
      value: found ? found.count : 0,
      percentage: stats.totalStudents > 0 ? ((found ? found.count : 0) / stats.totalStudents * 100).toFixed(0) : 0
    };
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1>Welcome back, Dean! 👋</h1>
          <p>Here's what's happening with orientation attendance.</p>
        </div>
        <div className="date-filter">
          <Calendar size={16} />
          <span>This Week</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-icon-circle">
            <Users size={32} />
          </div>
          <div className="hero-text">
            <h3>Total Attended</h3>
            <h2>{stats.totalStudents}</h2>
            <p className="trend-up"><TrendingUp size={16} /> 18% vs Last Week</p>
          </div>
        </div>
        <div className="hero-illustration">
          <img src="/hero_image.jpg" alt="Graduation Cap" />
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Branch-wise Statistics</h2>
        <div className="branch-grid-horizontal">
          {processedBranchStats.map((branch, index) => {
            const IconComponent = BRANCH_ICONS[branch.name] || BookOpen;
            const branchColor = COLORS[index % COLORS.length];
            return (
              <div key={branch.name} className="branch-stat-card glass-card">
                <div className="branch-card-header">
                  <div className="branch-icon-box" style={{ background: `${branchColor}20`, color: branchColor }}>
                    <IconComponent size={20} />
                  </div>
                  <div className="branch-card-title">
                    <h4>{branch.name}</h4>
                    <div className="branch-count">{branch.value}</div>
                    <span>{branch.value === 1 ? 'Student' : 'Students'}</span>
                  </div>
                </div>
                <div className="progress-container">
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${branch.percentage}%`, background: branchColor }}
                    ></div>
                  </div>
                  <span className="progress-percentage" style={{ color: branchColor }}>{branch.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-card">
          <div className="chart-header">
            <div className="chart-title">
              <div className="chart-title-icon">
                <TrendingUp size={18} color="#a855f7" />
              </div>
              <h3>Attendance Overview</h3>
            </div>
            <div className="chart-filter">
              <span>This Week</span>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MOCK_WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAttendance)"
                  dot={{ r: 4, fill: '#ffffff', strokeWidth: 2, stroke: '#8b5cf6' }} 
                  activeDot={{ r: 6 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-card">
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
  );
};

export default Dashboard;
