import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';
import type { Theme } from '../types/theme';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock the StatsDisplay component
vi.mock('./StatsDisplay', () => ({
  default: ({ stats }: { stats: any }) => (
    <div data-testid="stats-display">
      Progress: {stats.progress}%, Weighted Progress: {stats.weightedProgress}%
    </div>
  )
}));

const mockNavigate = vi.fn();
const mockOnCareerChange = vi.fn();
const mockOnReload = vi.fn();

describe('Header', () => {
  // Mock window.innerWidth
  beforeEach(() => {
    vi.resetAllMocks();
    // Don't store the original value since it's not used
    window.innerWidth = 1024;

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
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

  const mockCareers = [
    { careerid: 1, name: 'Ingeniería Informática' },
    { careerid: 2, name: 'Licenciatura en Sistemas' }
  ];

  const mockStats = {
    progress: 40,
    weightedProgress: 35,
    inProgress: 3,
    average: '7.5'
  };

  it('renders correctly with all props', () => {
    render(
      <Header
        currentTheme={mockTheme}
        selectedCareer={1}
        careers={mockCareers}
        stats={mockStats}
        onCareerChange={mockOnCareerChange}
        onReload={mockOnReload}
      />
    );
    
    // Check that the title is rendered
    expect(screen.getByText('Mapa de Correlatividades')).toBeInTheDocument();
    
    // Check that the student ID is displayed
    expect(screen.getByText(/Legajo:/)).toBeInTheDocument();
    expect(screen.getByText(/123456/)).toBeInTheDocument();
    
    // Check that careers dropdown is rendered
    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveValue('1');
    
    // Check that StatsDisplay is rendered
    expect(screen.getByTestId('stats-display')).toBeInTheDocument();
    
    // Check that buttons are rendered
    expect(screen.getByText('Actualizar')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });

  it('calls onCareerChange when selecting a different career', () => {
    render(
      <Header
        currentTheme={mockTheme}
        selectedCareer={1}
        careers={mockCareers}
        stats={mockStats}
        onCareerChange={mockOnCareerChange}
        onReload={mockOnReload}
      />
    );
    
    // Find the dropdown and change its value
    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: '2' } });
    
    // Check that onCareerChange was called with the right value
    expect(mockOnCareerChange).toHaveBeenCalledWith(2);
  });

  it('calls onReload when clicking the reload button', () => {
    render(
      <Header
        currentTheme={mockTheme}
        selectedCareer={1}
        careers={mockCareers}
        stats={mockStats}
        onCareerChange={mockOnCareerChange}
        onReload={mockOnReload}
      />
    );
    
    // Find the reload button and click it
    const reloadButton = screen.getByText('Actualizar');
    fireEvent.click(reloadButton);
    
    // Check that onReload was called
    expect(mockOnReload).toHaveBeenCalled();
  });

  it('logs out when clicking the logout button', () => {
    render(
      <Header
        currentTheme={mockTheme}
        selectedCareer={1}
        careers={mockCareers}
        stats={mockStats}
        onCareerChange={mockOnCareerChange}
        onReload={mockOnReload}
      />
    );
    
    // Find the logout button and click it
    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);
    
    // Check that localStorage.removeItem was called and user is navigated to home
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('userLegajo');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders properly on mobile devices', () => {
    // Mock mobile screen width
    window.innerWidth = 500;
    
    render(
      <Header
        currentTheme={mockTheme}
        selectedCareer={1}
        careers={mockCareers}
        stats={mockStats}
        onCareerChange={mockOnCareerChange}
        onReload={mockOnReload}
      />
    );
    
    // Just verify it renders
    expect(screen.getByText('Mapa de Correlatividades')).toBeInTheDocument();
  });

  it('does not render the reload button when onReload is not provided', () => {
    render(
      <Header
        currentTheme={mockTheme}
        selectedCareer={1}
        careers={mockCareers}
        stats={mockStats}
        onCareerChange={mockOnCareerChange}
      />
    );
    
    // Check that the reload button is not present
    expect(screen.queryByText('Actualizar')).not.toBeInTheDocument();
  });
}); 