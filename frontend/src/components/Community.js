import React, { useState, useEffect } from 'react';
import ForumModal from './ForumModal';
import ForumPostCard from './ForumPostCard';
import PublicGoodModal from './PublicGoodModal';

// 模拟数据
const MOCK_POSTS = [
  {
    id: 1,
    author: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    title: 'Welcome to coidea.ai Community!',
    content: 'This is the first post in our community. Share your ideas, ask questions, and collaborate with AI agents.',
    postType: 3,
    upvotes: 42,
    downvotes: 0,
    replyCount: 15,
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    isPinned: true
  },
  {
    id: 2,
    author: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    title: 'How to register an AI Agent?',
    content: 'I want to register my first AI agent but not sure about the process. Can someone help?',
    postType: 1,
    upvotes: 12,
    downvotes: 1,
    replyCount: 5,
    createdAt: Math.floor(Date.now() / 1000) - 3600,
    isPinned: false
  }
];

function Community({ signer }) {
  const [activeTab, setActiveTab] = useState('forum');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [showForumModal, setShowForumModal] = useState(false);
  const [userStats, setUserStats] = useState({
    expPoints: 150,
    creditScore: 85,
    level: 3
  });

  const handleCreatePost = async (postData) => {
    const newPost = {
      id: posts.length + 1,
      author: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      title: postData.title,
      content: postData.content,
      postType: postData.postType,
      upvotes: 0,
      downvotes: 0,
      replyCount: 0,
      createdAt: Math.floor(Date.now() / 1000),
      isPinned: false
    };
    
    setPosts([newPost, ...posts]);
    setUserStats(prev => ({
      ...prev,
      expPoints: prev.expPoints + 10
    }));
  };

  return (
    <div className="community-page">
      <div className="community-header">
        <div className="user-stats-bar">
          <div className="stat-item">
            <span className="stat-label">Level</span>
            <span className="stat-value">{userStats.level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">EXP</span>
            <span className="stat-value">{userStats.expPoints}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Credit</span>
            <span className="stat-value">{userStats.creditScore}/1000</span>
          </div>
        </div>

        <div className="community-tabs">
          <button 
            className={`tab ${activeTab === 'forum' ? 'active' : ''}`}
            onClick={() => setActiveTab('forum')}
          >
            💬 Forum
          </button>
          <button 
            className={`tab ${activeTab === 'public-goods' ? 'active' : ''}`}
            onClick={() => setActiveTab('public-goods')}
          >
            🌍 Public Goods
          </button>
          <button 
            className={`tab ${activeTab === 'governance' ? 'active' : ''}`}
            onClick={() => setActiveTab('governance')}
          >
            ⚖️ Governance
          </button>
        </div>
      </div>

      <div className="community-content">
        {activeTab === 'forum' && (
          <>
            <div className="section-header">
              <h2>Community Forum</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForumModal(true)}
              >
                + New Post
              </button>
            </div>

            <div className="forum-posts">
              {posts.map(post => (
                <ForumPostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'public-goods' && (
          <div className="empty-state">
            <p>Public Goods feature coming soon...</p>
          </div>
        )}

        {activeTab === 'governance' && (
          <div className="empty-state">
            <p>DAO Governance feature coming soon...</p>
          </div>
        )}
      </div>

      <ForumModal
        isOpen={showForumModal}
        onClose={() => setShowForumModal(false)}
        onSubmit={handleCreatePost}
        signer={signer}
      />
    </div>
  );
}

export default Community;
