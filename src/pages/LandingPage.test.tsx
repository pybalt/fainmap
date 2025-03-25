import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandingPage from './LandingPage';
import { MemoryRouter } from 'react-router-dom';
import * as router from 'react-router-dom';

// Mock navigate function
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock window.grecaptcha
vi.stubGlobal('grecaptcha', {
  execute: vi.fn().mockResolvedValue('mock-recaptcha-token')
});

// Mock fetch API
global.fetch = vi.fn();

describe('LandingPage', () => {
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
      })
    };
  })();

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Reset localStorage mock
    localStorageMock.clear();

    // Reset fetch mock
    vi.mocked(global.fetch).mockReset();
    
    // Mock successful fetch
    vi.mocked(global.fetch).mockImplementation(async () => {
      const response = {
        ok: true,
        json: async () => ({}),
        text: async () => '',
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      };
      return response as unknown as Response;
    });
  });

  it('redirects to dashboard if user is already logged in', async () => {
    // Set up localStorage to simulate logged in user
    localStorageMock.setItem('userLegajo', '12345');
    
    // Mock navigate
    const navigateMock = vi.fn();
    vi.spyOn(router, 'useNavigate').mockImplementation(() => navigateMock);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Check if navigation to dashboard occurred
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('toggles between login and register views', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Initially in login view - email field shouldn't be present
    expect(screen.queryByPlaceholderText(/nombre\.apellido@uade\.edu\.ar/i)).not.toBeInTheDocument();
    
    // Switch to register view
    fireEvent.click(screen.getByText('Registrarse'));
    
    // Now email field should be visible
    expect(screen.getByPlaceholderText(/nombre\.apellido@uade\.edu\.ar/i)).toBeInTheDocument();
    
    // Switch back to login view
    fireEvent.click(screen.getByText('Ingresar'));
    
    // Email field should be gone again
    expect(screen.queryByPlaceholderText(/nombre\.apellido@uade\.edu\.ar/i)).not.toBeInTheDocument();
  });

  it('handles login form submission', async () => {
    // Mock navigate
    const navigateMock = vi.fn();
    vi.spyOn(router, 'useNavigate').mockImplementation(() => navigateMock);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu código de legajo'), {
      target: { value: '12345' }
    });

    // Submit the form by clicking the submit button
    const submitButton = screen.getByText('Ingresar', { selector: 'button[type="submit"]' });
    fireEvent.click(submitButton);

    // Check if grecaptcha.execute was called
    await waitFor(() => {
      expect(window.grecaptcha.execute).toHaveBeenCalled();
    });

    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Recaptcha-Token': expect.any(String)
          }),
          body: expect.stringContaining('12345')
        })
      );
    });

    // Check if localStorage was updated and navigation occurred
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userLegajo', '12345');
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles registration form submission with valid data', async () => {
    // Mock navigate
    const navigateMock = vi.fn();
    vi.spyOn(router, 'useNavigate').mockImplementation(() => navigateMock);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Switch to register view
    fireEvent.click(screen.getByText('Registrarse'));

    // Fill in registration form
    fireEvent.change(screen.getByPlaceholderText(/nombre\.apellido@uade\.edu\.ar/i), {
      target: { value: 'test@uade.edu.ar' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu código de legajo'), {
      target: { value: '12345' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Vuelve a ingresar tu código de legajo'), {
      target: { value: '12345' }
    });

    // Submit the form by clicking the submit button
    const submitButton = screen.getByText('Registrarse', { selector: 'button[type="submit"]' });
    fireEvent.click(submitButton);

    // Check if grecaptcha.execute was called
    await waitFor(() => {
      expect(window.grecaptcha.execute).toHaveBeenCalled();
    });

    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Recaptcha-Token': expect.any(String)
          }),
          body: expect.stringContaining('test@uade.edu.ar')
        })
      );
    });

    // Check if localStorage was updated and navigation occurred
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userLegajo', '12345');
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('prevents paste and drop in confirm legajo field', () => {
    // Mock alert
    const alertMock = vi.fn();
    window.alert = alertMock;

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Switch to register view
    fireEvent.click(screen.getByText('Registrarse'));

    // Get confirm legajo field
    const confirmField = screen.getByPlaceholderText('Vuelve a ingresar tu código de legajo');

    // Try to paste
    fireEvent.paste(confirmField, { clipboardData: { getData: () => '12345' } });
    expect(alertMock).toHaveBeenCalled();

    // Try to drop
    fireEvent.drop(confirmField, { dataTransfer: { getData: () => '12345' } });
    expect(alertMock).toHaveBeenCalledTimes(2);
  });
});