import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  const originalLocalStorage = window.localStorage;
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    // Create a localStorage mock
    localStorageMock = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => localStorageMock[key] || null),
        setItem: vi.fn((key, value) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key) => {
          delete localStorageMock[key];
        }),
        clear: vi.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
    });
  });

  it('renders children when user is authenticated', () => {
    // Set up authenticated state
    localStorageMock['userLegajo'] = '123456';

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(localStorage.getItem).toHaveBeenCalledWith('userLegajo');
  });

  it('redirects to home page when user is not authenticated', () => {
    // Create a test routing environment with a test landing page
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<div data-testid="landing-page">Landing Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="dashboard">Dashboard Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to landing page
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    expect(localStorage.getItem).toHaveBeenCalledWith('userLegajo');
  });
});