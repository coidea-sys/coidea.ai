import React from 'react';

const POST_TYPE_LABELS = {
  0: { label: 'Discussion', icon: '💬', color: '#4CAF50' },
  1: { label: 'Question', icon: '❓', color: '#2196F3' },
  2: { label: 'Idea', icon: '💡', color: '#FF9800' },
  3: { label: 'Announcement', icon: '📢', color: '#9C27B0' }
};

function ForumPostCard({ post, onVote, onReply }) {
  const typeInfo = POST_TYPE_LABELS[post.postType] || POST_TYPE_LABELS[0];
  
  const formatAddress = (addr) => {
    if (!addr) return 'Anonymous';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  return (
    <div className={`forum-post-card ${post.isPinned ? 'pinned' : ''}`}>
      {post.isPinned && <span className="pin-badge">📌 Pinned</span>}
      
      <div className="post-header">
        <span 
          className="post-type-badge"
          style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}
        >
          {typeInfo.icon} {typeInfo.label}
        </span>
        <span className="post-author">{formatAddress(post.author)}</span>
        <span className="post-time">{formatTime(post.createdAt)}</span>
      </div>

      <h3 className="post-title">{post.title}</h3>
      <p className="post-content">{post.content}</p>

      <div className="post-actions">
        <button 
          className="vote-btn upvote"
          onClick={() => onVote?.(post.id, true)}
        >
          ▲ {post.upvotes || 0}
        </button>
        
        <button 
          className="vote-btn downvote"
          onClick={() => onVote?.(post.id, false)}
        >
          ▼ {post.downvotes || 0}
        </button>

        <button 
          className="reply-btn"
          onClick={() => onReply?.(post.id)}
        >
          💬 Reply ({post.replyCount || 0})
        </button>
      </div>
    </div>
  );
}

export default ForumPostCard;
