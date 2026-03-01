import React from 'react';
import './Skeleton.css';

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-lines">
        <div className="skeleton-line short"></div>
        <div className="skeleton-line"></div>
      </div>
    </div>
    <div className="skeleton-content">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line medium"></div>
    </div>
    <div className="skeleton-footer">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="skeleton-text">
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className="skeleton-line"
        style={{ width: `${80 + Math.random() * 20}%` }}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 40 }) => (
  <div 
    className="skeleton-avatar-circle"
    style={{ width: size, height: size }}
  />
);

export const SkeletonStats = () => (
  <div className="skeleton-stats">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="skeleton-stat">
        <div className="skeleton-line short"></div>
        <div className="skeleton-line"></div>
      </div>
    ))}
  </div>
);

const Skeleton = {
  SkeletonCard,
  SkeletonList,
  SkeletonText,
  SkeletonAvatar,
  SkeletonStats
};

export default Skeleton;
