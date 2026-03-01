import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function UserProfile({ isOpen, onClose, account, signer }) {
  const [userStats, setUserStats] = useState({
    expPoints: 0,
    creditScore: 0,
    level: 1,
    forumPosts: 0,
    forumReplies: 0,
    tasksPublished: 0,
    tasksCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // 模拟加载用户数据
    setTimeout(() => {
      setUserStats({
        expPoints: 150,
        creditScore: 85,
        level: 3,
        forumPosts: 5,
        forumReplies: 12,
        tasksPublished: 3,
        tasksCompleted: 8
      });
      setLoading(false);
    }, 500);
  }, [account]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getLevelProgress = () => {
    const levelThresholds = [0, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    const currentThreshold = levelThresholds[userStats.level - 1] || 0;
    const nextThreshold = levelThresholds[userStats.level] || 10000;
    const progress = ((userStats.expPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content user-profile" onClick={e => e.stopPropagation()}>
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-profile" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-avatar">
            {account ? account.slice(2, 4).toUpperCase() : '?'}
          </div>
          <div className="profile-info">
            <h2>{formatAddress(account)}</h2>
            <div className="profile-level">
              <span className="level-badge">Level {userStats.level}</span>
              <div className="level-progress-bar">
                <div 
                  className="level-progress-fill" 
                  style={{ width: `${getLevelProgress()}%` }}
                />
              </div>
              <span className="exp-text">{userStats.expPoints} EXP</span>
            </div>
          </div>
          
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button 
            className={`tab ${activeTab === 'reputation' ? 'active' : ''}`}
            onClick={() => setActiveTab('reputation')}
          >
            Reputation
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="stat-card">
                <span className="stat-icon">💎</span>
                <span className="stat-value">{userStats.expPoints}</span>
                <span className="stat-label">Experience Points</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-icon">⭐</span>
                <span className="stat-value">{userStats.creditScore}/1000</span>
                <span className="stat-label">Credit Score</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-icon">📝</span>
                <span className="stat-value">{userStats.forumPosts}</span>
                <span className="stat-label">Forum Posts</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-icon">💬</span>
                <span className="stat-value">{userStats.forumReplies}</span>
                <span className="stat-label">Replies</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-icon">📋</span>
                <span className="stat-value">{userStats.tasksPublished}</span>
                <span className="stat-label">Tasks Published</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-icon">✅</span>
                <span className="stat-value">{userStats.tasksCompleted}</span>
                <span className="stat-label">Tasks Completed</span>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-icon">📝</span>
                <div className="activity-content">
                  <p>Created forum post "Welcome to coidea.ai"</p>
                  <span className="activity-time">2 days ago</span>
                </div>
                <span className="activity-reward">+10 EXP</span>
              </div>
              
              <div className="activity-item">
                <span className="activity-icon">📋</span>
                <div className="activity-content">
                  <p>Completed task "Design Logo"</p>
                  <span className="activity-time">3 days ago</span>
                </div>
                <span className="activity-reward">+50 EXP</span>
              </div>
              
              <div className="activity-item">
                <span className="activity-icon">🌍</span>
                <div className="activity-content">
                  <p>Donated to Public Good "Open Source SDK"</p>
                  <span className="activity-time">5 days ago</span>
                </div>
                <span className="activity-reward">+5 EXP</span>
              </div>
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="reputation-section">
              <div className="credit-score-display">
                <div className="credit-circle">
                  <span className="credit-value">{userStats.creditScore}</span>
                  <span className="credit-max">/1000</span>
                </div>
                <p className="credit-status">
                  {userStats.creditScore >= 80 ? 'Excellent' : 
                   userStats.creditScore >= 60 ? 'Good' : 
                   userStats.creditScore >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>
              
              <div className="reputation-factors">
                <h4>Reputation Factors</h4>
                <div className="factor-item">
                  <span>Task Completion Rate</span>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: '85%' }} />
                  </div>
                  <span>85%</span>
                </div>
                
                <div className="factor-item">
                  <span>Community Engagement</span>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: '70%' }} />
                  </div>
                  <span>70%</span>
                </div>
                
                <div className="factor-item">
                  <span>Public Goods Support</span>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: '60%' }} />
                  </div>
                  <span>60%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
