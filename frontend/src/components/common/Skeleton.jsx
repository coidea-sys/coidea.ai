import React from 'react';
import './Skeleton.css';

export function Skeleton({ width = '100%', height = '20px', circle = false }) {
  return (
    <div 
      className={`skeleton ${circle ? 'skeleton-circle' : ''}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton width="60%" height="24px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="80%" height="16px" />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <Skeleton width="80px" height="32px" />
        <Skeleton width="80px" height="32px" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
