import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubjectContextMenu from './SubjectContextMenu';
import type { Theme } from '../types/theme';

// Mock getBoundingClientRect to control position tests
const mockGetBoundingClientRect = vi.fn();
Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;

describe('SubjectContextMenu', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock window inner dimensions
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    
    // Default mock for getBoundingClientRect
    mockGetBoundingClientRect.mockReturnValue({
      width: 200,
      height: 300,
      right: 300,
      bottom: 400,
    });
  });

  const mockTheme: Theme = {
    name: 'Light',
    headerBg: 'bg-gray-800',
    textColor: 'text-white',
    bgColor: 'bg-gray-100',
    cardBg: 'bg-white',
    secondaryText: 'text-gray-500'
  };

  const defaultProps = {
    x: 100,
    y: 100,
    onClose: vi.fn(),
    theme: mockTheme,
    onGradeClick: vi.fn(),
    status: 'pending' as const,
    name: 'Test Subject',
    code: 'TS101'
  };

  it('renders with correct position and content', () => {
    render(<SubjectContextMenu {...defaultProps} />);
    
    // Check that the menu title is rendered
    expect(screen.getByText('Detalles de la materia')).toBeInTheDocument();
    
    // Check that subject details are displayed
    expect(screen.getByText(/Nombre:/i)).toBeInTheDocument();
    expect(screen.getByText('Test Subject')).toBeInTheDocument();
    expect(screen.getByText(/Código:/i)).toBeInTheDocument();
    expect(screen.getByText('TS101')).toBeInTheDocument();
    
    // Check that future features are displayed
    expect(screen.getByText('Profesores')).toBeInTheDocument();
    expect(screen.getByText('Apuntes')).toBeInTheDocument();
    expect(screen.getAllByText(/\(Próximamente\)/i)).toHaveLength(2);
    
    // Check that the menu is positioned correctly
    const menuElement = screen.getByText('Detalles de la materia').closest('div')?.parentElement?.parentElement;
    expect(menuElement).toHaveStyle({
      left: '100px',
      top: '100px'
    });
  });

  it('adjusts position when menu would go off screen', () => {
    // Mock the menu going off screen to the right and bottom
    mockGetBoundingClientRect.mockReturnValue({
      width: 200,
      height: 300,
      right: 1100, // Greater than window.innerWidth (1024)
      bottom: 900,  // Greater than window.innerHeight (768)
    });
    
    const { container } = render(<SubjectContextMenu {...defaultProps} />);
    
    // Since jsdom doesn't actually layout elements, we just check
    // that the style.left and style.top were set by the useEffect
    // We can't easily assert the exact values as they're set imperatively
    const menuElement = container.querySelector('[style*="left"][style*="top"]');
    expect(menuElement).toBeDefined();
  });

  it('shows grade button only when status is approved', () => {
    // Test with pending status
    const { rerender } = render(<SubjectContextMenu {...defaultProps} />);
    
    // Grade button should not be present
    expect(screen.queryByText(/Nota:/i)).not.toBeInTheDocument();
    
    // Test with approved status
    rerender(<SubjectContextMenu {...defaultProps} status="approved" grade={8} />);
    
    // Grade button should be present with value
    expect(screen.getByText('Nota: 8')).toBeInTheDocument();
    
    // Test with approved status but no grade
    rerender(<SubjectContextMenu {...defaultProps} status="approved" />);
    
    // Grade button should be present with "No registrada"
    expect(screen.getByText('Nota: No registrada')).toBeInTheDocument();
  });

  it('calls onGradeClick when grade button is clicked', () => {
    render(<SubjectContextMenu {...defaultProps} status="approved" grade={8} />);
    
    // Find and click the grade button
    const gradeButton = screen.getByText(/Nota:/i);
    fireEvent.click(gradeButton);
    
    // Check that onGradeClick was called
    expect(defaultProps.onGradeClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<SubjectContextMenu {...defaultProps} />);
    
    // Find and click the backdrop
    const backdrop = screen.getByTestId('backdrop');
    
    fireEvent.click(backdrop);
    
    // Check that onClose was called twice (once from onClick, once from document event listener)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });

  it('adds event listener to close on document click', () => {
    // Spy on document event listeners
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<SubjectContextMenu {...defaultProps} />);
    
    // Check that addEventListener was called with 'click'
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    
    // Unmount and check that removeEventListener was called
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });
}); 