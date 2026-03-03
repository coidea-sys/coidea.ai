import React, { useState } from 'react';
import './FeedbackWidget.css';

/**
 * User Feedback Widget
 * Collect user feedback and ratings
 */

function FeedbackWidget({ onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('general');
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'ux', label: 'User Experience' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit?.({
      rating,
      comment,
      category,
      timestamp: Date.now(),
    });
    
    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setRating(0);
      setComment('');
    }, 2000);
  };

  if (!isOpen) {
    return (
      <button 
        className="feedback-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Give feedback"
      >
        💬 Feedback
      </button>
    );
  }

  return (
    <div className="feedback-widget">
      <div className="feedback-header">
        <h3>Share your feedback</h3>
        <button 
          className="close-btn"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>
      </div>

      {submitted ? (
        <div className="feedback-success">
          <div className="success-icon">✅</div>
          <p>Thank you for your feedback!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Rating</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think..."
              rows={4}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={rating === 0}
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}

export default FeedbackWidget;
