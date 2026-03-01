import React, { useState } from 'react';

const POST_TYPES = [
  { value: 0, label: '💬 Discussion', color: '#4CAF50' },
  { value: 1, label: '❓ Question', color: '#2196F3' },
  { value: 2, label: '💡 Idea', color: '#FF9800' },
  { value: 3, label: '📢 Announcement', color: '#9C27B0' }
];

function ForumModal({ isOpen, onClose, onSubmit, signer }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    await onSubmit({ title, content, postType });
    setIsSubmitting(false);
    
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content forum-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Post</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Post Type</label>
            <div className="post-type-selector">
              {POST_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-btn ${postType === type.value ? 'selected' : ''}`}
                  onClick={() => setPostType(type.value)}
                  style={{ 
                    borderColor: postType === type.value ? type.color : 'transparent',
                    backgroundColor: postType === type.value ? `${type.color}20` : 'transparent'
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={6}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post (+10 EXP)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForumModal;
