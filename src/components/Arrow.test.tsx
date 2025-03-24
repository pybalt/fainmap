import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Arrow from './Arrow';

describe('Arrow', () => {
  const defaultProps = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 }
  };

  it('renders arrow with default color', () => {
    render(<Arrow {...defaultProps} />);
    
    // Check that SVG is rendered
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check paths are rendered
    const paths = document.querySelectorAll('path');
    expect(paths.length).toBe(2); // One for the line, one for the arrow head
    
    // Check default color is applied to the paths
    const linePath = paths[0];
    expect(linePath).toHaveAttribute('stroke', '#CBD5E0');
    
    const arrowHeadPath = paths[1];
    expect(arrowHeadPath).toHaveAttribute('fill', '#CBD5E0');
  });

  it('renders arrow with custom color', () => {
    const customColor = '#FF0000';
    render(<Arrow {...defaultProps} color={customColor} />);
    
    // Check custom color is applied to the paths
    const paths = document.querySelectorAll('path');
    const linePath = paths[0];
    expect(linePath).toHaveAttribute('stroke', customColor);
    
    const arrowHeadPath = paths[1];
    expect(arrowHeadPath).toHaveAttribute('fill', customColor);
  });

  it('generates correct path for horizontal line', () => {
    const horizontalProps = {
      start: { x: 100, y: 100 },
      end: { x: 200, y: 100 }
    };
    
    render(<Arrow {...horizontalProps} />);
    
    // Extract the path data
    const paths = document.querySelectorAll('path');
    const linePath = paths[0];
    const pathData = linePath.getAttribute('d');
    
    // Check that it contains the correct coordinates (simplified check)
    expect(pathData).toContain(`M ${horizontalProps.start.x} ${horizontalProps.start.y}`);
    expect(pathData).toContain(`${horizontalProps.end.x} ${horizontalProps.end.y}`);
  });

  it('generates correct path for vertical line', () => {
    const verticalProps = {
      start: { x: 100, y: 100 },
      end: { x: 100, y: 200 }
    };
    
    render(<Arrow {...verticalProps} />);
    
    // Extract the path data
    const paths = document.querySelectorAll('path');
    const linePath = paths[0];
    const pathData = linePath.getAttribute('d');
    
    // Check that it contains the correct coordinates (simplified check)
    expect(pathData).toContain(`M ${verticalProps.start.x} ${verticalProps.start.y}`);
    expect(pathData).toContain(`${verticalProps.end.x} ${verticalProps.end.y}`);
  });

  it('renders with correct SVG styles', () => {
    render(<Arrow {...defaultProps} />);
    
    const svg = document.querySelector('svg');
    
    // Check that the SVG has the correct styles
    expect(svg).toHaveStyle({
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '0'
    });
  });
}); 