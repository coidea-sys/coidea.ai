import { render, screen } from '@testing-library/react';
import { SkeletonCard, SkeletonList, SkeletonText } from './Skeleton';

describe('Skeleton Components', () => {
  describe('SkeletonCard', () => {
    it('renders skeleton card structure', () => {
      render(<SkeletonCard />);
      
      expect(document.querySelector('.skeleton-card')).toBeInTheDocument();
      expect(document.querySelector('.skeleton-header')).toBeInTheDocument();
      expect(document.querySelector('.skeleton-content')).toBeInTheDocument();
      expect(document.querySelector('.skeleton-footer')).toBeInTheDocument();
    });
  });

  describe('SkeletonList', () => {
    it('renders correct number of skeleton cards', () => {
      render(<SkeletonList count={3} />);
      
      const cards = document.querySelectorAll('.skeleton-card');
      expect(cards).toHaveLength(3);
    });
  });

  describe('SkeletonText', () => {
    it('renders correct number of lines', () => {
      render(<SkeletonText lines={5} />);
      
      const lines = document.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(5);
    });
  });
});
