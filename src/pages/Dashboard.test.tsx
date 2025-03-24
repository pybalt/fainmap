import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { MemoryRouter } from 'react-router-dom';
import * as router from 'react-router-dom';
import type { SubjectNode } from '../types/database';

// Mock navigate from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock SubjectMap component
vi.mock('../components/SubjectMap', () => ({
  default: ({ 
    subjects, 
    onSubjectStatusChange, 
    onSubjectGradeChange, 
    onSubjectPositionChange 
  }: {
    subjects: SubjectNode[],
    onSubjectStatusChange: (subjectId: number, status: 'pending' | 'in_progress' | 'approved') => void,
    onSubjectGradeChange: (subjectId: number, grade: number) => void,
    onSubjectPositionChange: (position: { x: number, y: number }, isDragging: boolean, subjectId: number) => void
  }) => (
    <div data-testid="subject-map">
      <button 
        data-testid="change-status-btn" 
        onClick={() => onSubjectStatusChange(1, 'approved')}
      >
        Change Status
      </button>
      <button 
        data-testid="change-grade-btn" 
        onClick={() => onSubjectGradeChange(1, 8)}
      >
        Change Grade
      </button>
      <button 
        data-testid="change-position-btn" 
        onClick={() => onSubjectPositionChange({ x: 100, y: 100 }, false, 1)}
      >
        Change Position
      </button>
      <div data-testid="subject-count">{subjects.length}</div>
    </div>
  )
}));

// Mock Header component
vi.mock('../components/Header', () => ({
  default: ({ 
    onCareerChange, 
    onReload, 
    stats 
  }: {
    onCareerChange: (careerId: number) => void,
    onReload: () => void,
    stats: {
      progress: number,
      weightedProgress: number,
      inProgress: number,
      average: string
    }
  }) => (
    <header data-testid="header">
      <select 
        data-testid="career-select"
        onChange={(e) => onCareerChange(Number(e.target.value))}
      >
        <option value="1">Test Career</option>
      </select>
      <button data-testid="reload-btn" onClick={onReload}>Reload</button>
      <div data-testid="stats-progress">{stats.progress}</div>
      <div data-testid="stats-weighted">{stats.weightedProgress}</div>
    </header>
  )
}));

// Mock Footer component
vi.mock('../components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>
}));

// Mock fetch API
global.fetch = vi.fn();

describe('Dashboard', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => (store[key] || null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      store
    };
  })();
  
  // Mock window matchMedia
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Reset localStorage mock
    localStorageMock.clear();
    
    // Setup user in localStorage
    localStorageMock.setItem('userLegajo', '12345');
    localStorageMock.setItem('token', 'test-token');

    // Reset fetch mock
    vi.mocked(global.fetch).mockReset();
    
    // Mock successful fetch
    vi.mocked(global.fetch).mockImplementation(async () => {
      const response = {
        ok: true,
        json: async () => ([{ careerid: 1, name: 'Test Career' }]),
        text: async () => '',
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      };
      return response as unknown as Response;
    });
  });

  it('redirects to login page if user is not authenticated', async () => {
    // Remove user from localStorage
    localStorageMock.removeItem('userLegajo');
    
    // Mock navigate
    const navigateMock = vi.fn();
    vi.spyOn(router, 'useNavigate').mockImplementation(() => navigateMock);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the navigate to be called
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  it('shows loading screen initially', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('loads careers on initial render', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Check that fetch was called with the correct URL
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/careers'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-recaptcha-token': expect.stringContaining('Bearer test-token')
        })
      })
    );
  });

  it('changes selected career when career selection changes', async () => {
    // Mock localStorage with cached careers
    localStorageMock.setItem('careers', JSON.stringify([{ careerid: 1, name: 'Test Career' }]));
    localStorageMock.setItem('careers_timestamp', Date.now().toString());
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    // Find the career select and change its value
    const careerSelect = screen.getByTestId('career-select');
    fireEvent.change(careerSelect, { target: { value: '1' } });

    // Check that localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedCareer', '1');
  });

  it('handles reload action correctly', async () => {
    // Mock localStorage with cached careers and subjects
    localStorageMock.setItem('careers', JSON.stringify([{ careerid: 1, name: 'Test Career' }]));
    localStorageMock.setItem('careers_timestamp', Date.now().toString());
    localStorageMock.setItem('selectedCareer', '1');
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    // Mock fetch for subject data
    vi.mocked(global.fetch).mockImplementation(async () => {
      const response = {
        ok: true,
        json: async () => ([{ 
          subjectid: 1, 
          code: 'TEST101', 
          name: 'Test Subject', 
          prerequisites: [],
          suggested_year: 1,
          suggested_quarter: 1
        }]),
        text: async () => '',
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      };
      return response as unknown as Response;
    });

    // Find and click the reload button
    const reloadBtn = screen.getByTestId('reload-btn');
    fireEvent.click(reloadBtn);

    // Check that localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('mapped_subjects_1');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('mapped_subjects_timestamp_1');
  });
}); 