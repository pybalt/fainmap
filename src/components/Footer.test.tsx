import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import type { Theme } from '../types/theme';

describe('Footer', () => {
  // Define the theme
  const mockTheme: Theme = {
    name: 'Light',
    headerBg: 'bg-gray-800',
    textColor: 'text-white',
    bgColor: 'bg-gray-100',
    cardBg: 'bg-white',
    secondaryText: 'text-gray-500'
  };

  it('renders correctly with all props', () => {
    render(<Footer theme={mockTheme} />);
    
    // Check that the footer text is rendered
    expect(screen.getByText(/Desarrollado por/i)).toBeInTheDocument();
    
    // Check that the LinkedIn text is rendered - this is enough
    // to verify the component is working without relying on specific env variables
    expect(screen.getByText(/Conecta conmigo en LinkedIn/i)).toBeInTheDocument();
  });

  it('applies the correct theme styles', () => {
    render(<Footer theme={mockTheme} />);
    
    // Check that the footer has the correct CSS classes
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('text-center');
    expect(footer).toHaveClass('p-4');
    expect(footer).toHaveClass(mockTheme.secondaryText);
  });
}); 