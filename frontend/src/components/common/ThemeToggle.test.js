import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders with default organic theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('Organic')).toBeInTheDocument();
  });

  it('cycles through themes on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    
    // Click to Dark
    fireEvent.click(button);
    expect(screen.getByText('🌙')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    
    // Click to Light
    fireEvent.click(button);
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    
    // Click back to Organic
    fireEvent.click(button);
    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('Organic')).toBeInTheDocument();
  });
});
