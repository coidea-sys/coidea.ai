import React, { useState, useEffect } from 'react';
import { useCommunity } from '../hooks/useCommunity';
import ForumModal from './ForumModal';
import ForumPostCard from './ForumPostCard';
import PublicGoodModal from './PublicGoodModal';

function Community({ signer, account }) {
  const [activeTab, setActiveTab] = useState('forum');
  const [showForumModal, setShowForumModal] = useState(false);
  const [showPublicGoodModal, setShowPublicGoodModal] = useState(false);
  
  const {
    posts,
    userStats,
    loading,
    error,
    fetchPosts,
    fetchUserStats,
    createPost,
    votePost
  } = useCommunity(signer);

  // 加载数据
  useEffect(() => {
    if (signer) {
      fetchPosts();
      if (account) {
        fetchUserStats(account);
      }
    }
  }, [signer, account, fetchPosts, fetchUserStats]);

  const handleCreatePost = async (postData) => {
    try {
      const result = await createPost(postData.title, postData.content, postData.postType);
      if (result.success) {
        await fetchPosts(); // 刷新列表
        if (account) {
          await fetchUserStats(account); // 刷新用户状态
        }
      }
    } catch (err) {
      console.error('Create post error:', err);
      alert('Failed to create post: ' + err.message);
    }
  };

  const handleVote = async (postId, isUpvote) => {
    try {
      await votePost(postId, isUpvote);
      await fetchPosts(); // 刷新列表
    } catch (err) {
      console.error('Vote error:', err);
      alert('Failed to vote: ' + err.message);
    }
  };

  const displayStats = userStats || {
    expPoints: 0,
    creditScore: 0,
    level: 1
  };

  return (
    <div className="community-page">
      <div className="community-header">
        <div className="user-stats-bar">
          <div className="stat-item">
            <span className="stat-label">Level</span>
            <span className="stat-value">{displayStats.level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">EXP</span>
            <span className="stat-value">{displayStats.expPoints}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Credit</span>
            <span className="stat-value">{displayStats.creditScore}/1000</span>
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
                disabled={!signer}
              >
                + New Post
              </button>
            </div>

            {loading && <div className="loading">Loading posts...</div>}
            
            {error && <div className="error">Error: {error}</div>}

            <div className="forum-posts">
              {posts.length === 0 ? (
                <div className="empty-state">
                  <p>No posts yet. Be the first to share!</p>
                </div>
              ) : (
                posts.map(post => (
                  <ForumPostCard 
                    key={post.id} 
                    post={post} 
                    onVote={handleVote}
                  />
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'public-goods' && (
          <>
            <div className="section-header">
              <h2>Public Goods</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowPublicGoodModal(true)}
                disabled={!signer}
              >
                + Create Project
              </button>
            </div>
            <div className="empty-state">
              <p>Public Goods feature coming soon...</p>
            </div>
          </>
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

      <PublicGoodModal
        isOpen={showPublicGoodModal}
        onClose={() => setShowPublicGoodModal(false)}
        onSubmit={(data) => console.log('Public good:', data)}
      />
    </div>
  );
}

export default Community;
