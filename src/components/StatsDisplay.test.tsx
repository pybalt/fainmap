import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsDisplay from './StatsDisplay';

describe('StatsDisplay', () => {
  const mockStats = {
    progress: 45,
    weightedProgress: 40,
    inProgress: 3,
    average: '7.8'
  };

  it('renders all stats correctly', () => {
    render(<StatsDisplay stats={mockStats} />);
    
    // Check that all stats labels are rendered
    expect(screen.getByText(/Progreso:/i)).toBeInTheDocument();
    expect(screen.getByText(/Pond.:/i)).toBeInTheDocument();
    expect(screen.getByText(/En curso:/i)).toBeInTheDocument();
    expect(screen.getByText(/Promedio:/i)).toBeInTheDocument();
    
    // Check that all stats values are displayed correctly
    expect(screen.getByText(/45%/)).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText(/3(?!\d)/)).toBeInTheDocument(); // Match 3 not followed by any digit
    expect(screen.getByText(/7.8/)).toBeInTheDocument();
  });

  it('renders with zero values', () => {
    const zeroStats = {
      progress: 0,
      weightedProgress: 0,
      inProgress: 0,
      average: '0'
    };
    
    render(<StatsDisplay stats={zeroStats} />);
    
    // Check that zero values are displayed correctly
    const zeroPercentElements = screen.getAllByText(/0%/);
    expect(zeroPercentElements.length).toBe(2);
    
    const zeroElements = screen.getAllByText(/0(?!\d)(?!%)/);
    expect(zeroElements.length).toBe(2);
  });

  it('renders with high values', () => {
    const highStats = {
      progress: 100,
      weightedProgress: 98,
      inProgress: 12,
      average: '10'
    };
    
    render(<StatsDisplay stats={highStats} />);
    
    // Check that high values are displayed correctly
    expect(screen.getByText(/100%/)).toBeInTheDocument();
    expect(screen.getByText(/98%/)).toBeInTheDocument();
    expect(screen.getByText(/12(?!\d)/)).toBeInTheDocument(); // Match 12 not followed by any digit
    expect(screen.getByText(/10(?!\d)/)).toBeInTheDocument(); // Match 10 not followed by any digit
  });

  it('has the correct layout classes', () => {
    render(<StatsDisplay stats={mockStats} />);
    
    // Check that the container has grid layout on mobile and flex on desktop
    const container = screen.getByText(/Progreso:/i).closest('div')?.parentElement;
    expect(container).toHaveClass('grid');
    expect(container).toHaveClass('grid-cols-2');
    expect(container).toHaveClass('md:flex');
    expect(container).toHaveClass('text-sm');
    expect(container).toHaveClass('text-gray-500');
  });
}); 