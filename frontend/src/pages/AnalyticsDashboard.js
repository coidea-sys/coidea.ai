import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

/**
 * Analytics Dashboard
 * Real-time monitoring and statistics
 */

function AnalyticsDashboard({ contractData, userData }) {
  const [timeRange, setTimeRange] = useState('24h');
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    tvl: '0',
    avgGasPrice: 0,
    errorRate: 0,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeUsers: Math.floor(Math.random() * 50) + 100,
        avgGasPrice: Math.floor(Math.random() * 50) + 100,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) / 1e18;
    return num.toFixed(2) + ' MATIC';
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>📊 Analytics Dashboard</h2>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="Active Users"
          value={formatNumber(metrics.activeUsers)}
          change="+12%"
          trend="up"
          icon="👥"
        />
        <MetricCard
          title="Total Tasks"
          value={formatNumber(metrics.totalTasks)}
          change="+5%"
          trend="up"
          icon="📋"
        />
        <MetricCard
          title="Completion Rate"
          value={`${Math.round((metrics.completedTasks / Math.max(metrics.totalTasks, 1)) * 100)}%`}
          change="+3%"
          trend="up"
          icon="✅"
        />
        <MetricCard
          title="TVL"
          value={formatCurrency(metrics.tvl)}
          change="+8%"
          trend="up"
          icon="💰"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Task Activity</h3>
          <ActivityChart data={contractData?.taskActivity} />
        </div>

        <div className="chart-card">
          <h3>User Growth</h3>
          <GrowthChart data={userData?.growth} />
        </div>

        <div className="chart-card">
          <h3>Gas Usage</h3>
          <GasChart price={metrics.avgGasPrice} />
        </div>

        <div className="chart-card">
          <h3>Error Rate</h3>
          <ErrorChart rate={metrics.errorRate} />
        </div>
      </div>

      {/* Contract Events */}
      <div className="events-section">
        <h3>Recent Contract Events</h3>
        <EventsTable events={contractData?.recentEvents} />
      </div>

      {/* System Health */}
      <div className="health-section">
        <h3>System Health</h3>
        <HealthIndicators />
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, trend, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <span className="metric-title">{title}</span>
        <span className="metric-value">{value}</span>
        <span className={`metric-change ${trend}`}>
          {trend === 'up' ? '↑' : '↓'} {change}
        </span>
      </div>
    </div>
  );
}

function ActivityChart({ data }) {
  // Simple bar chart visualization
  const bars = data || Array(7).fill(0).map(() => Math.floor(Math.random() * 50) + 20);
  const max = Math.max(...bars);

  return (
    <div className="activity-chart">
      {bars.map((value, i) => (
        <div key={i} className="bar-wrapper">
          <div
            className="bar"
            style={{ height: `${(value / max) * 100}%` }}
          />
          <span className="bar-label">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
        </div>
      ))}
    </div>
  );
}

function GrowthChart({ data }) {
  const points = data || [20, 35, 45, 50, 65, 80, 95];
  
  return (
    <div className="growth-chart">
      <svg viewBox="0 0 200 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#007bff"
          strokeWidth="2"
          points={points.map((p, i) => `${(i / (points.length - 1)) * 200},${100 - p}`).join(' ')}
        />
      </svg>
    </div>
  );
}

function GasChart({ price }) {
  return (
    <div className="gas-chart">
      <div className="gas-price">
        <span className="price">{price}</span>
        <span className="unit">gwei</span>
      </div>
      <div className="gas-indicator">
        <div 
          className="gas-bar" 
          style={{ 
            width: `${Math.min((price / 200) * 100, 100)}%`,
            backgroundColor: price > 150 ? '#ef4444' : price > 100 ? '#f59e0b' : '#22c55e'
          }}
        />
      </div>
      <div className="gas-labels">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
}

function ErrorChart({ rate }) {
  return (
    <div className="error-chart">
      <div className="error-rate">
        <span className="rate">{rate.toFixed(2)}%</span>
      </div>
      <div className="error-status">
        {rate < 1 ? (
          <span className="status good">✅ Healthy</span>
        ) : rate < 5 ? (
          <span className="status warning">⚠️ Elevated</span>
        ) : (
          <span className="status critical">❌ Critical</span>
        )}
      </div>
    </div>
  );
}

function EventsTable({ events }) {
  const mockEvents = events || [
    { type: 'TaskCreated', timestamp: Date.now(), hash: '0x123...' },
    { type: 'AgentRegistered', timestamp: Date.now() - 3600000, hash: '0x456...' },
    { type: 'PaymentProcessed', timestamp: Date.now() - 7200000, hash: '0x789...' },
  ];

  return (
    <table className="events-table">
      <thead>
        <tr>
          <th>Event</th>
          <th>Time</th>
          <th>Transaction</th>
        </tr>
      </thead>
      <tbody>
        {mockEvents.map((event, i) => (
          <tr key={i}>
            <td>{event.type}</td>
            <td>{new Date(event.timestamp).toLocaleTimeString()}</td>
            <td>
              <a 
                href={`https://polygonscan.com/tx/${event.hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {event.hash.slice(0, 10)}...
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HealthIndicators() {
  const services = [
    { name: 'Frontend', status: 'healthy', latency: '45ms' },
    { name: 'Backend API', status: 'healthy', latency: '120ms' },
    { name: 'WebSocket', status: 'healthy', latency: '30ms' },
    { name: 'Polygon RPC', status: 'healthy', latency: '250ms' },
    { name: 'Database', status: 'healthy', latency: '15ms' },
  ];

  return (
    <div className="health-indicators">
      {services.map((service) => (
        <div key={service.name} className={`health-item ${service.status}`}>
          <span className="status-dot" />
          <span className="service-name">{service.name}</span>
          <span className="service-latency">{service.latency}</span>
        </div>
      ))}
    </div>
  );
}

export default AnalyticsDashboard;
