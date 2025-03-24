import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders the form correctly', () => {
    render(<LoginForm />);
    
    // Check that all form elements are rendered
    expect(screen.getByLabelText(/Número de Legajo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar Legajo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Apellido/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();
  });

  it('shows error when legajo values do not match', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Fill in form with non-matching legajo values
    await user.type(screen.getByLabelText(/Número de Legajo/i), '123456');
    await user.type(screen.getByLabelText(/Confirmar Legajo/i), '654321');
    await user.type(screen.getByLabelText(/Nombre/i), 'John');
    await user.type(screen.getByLabelText(/Apellido/i), 'Doe');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Registrarse/i }));
    
    // Check that error message is displayed
    expect(screen.getByText(/Los números de legajo no coinciden/i)).toBeInTheDocument();
  });

  it('shows error when legajo contains non-numeric characters', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Fill in form with non-numeric legajo
    await user.type(screen.getByLabelText(/Número de Legajo/i), 'abc123');
    await user.type(screen.getByLabelText(/Confirmar Legajo/i), 'abc123');
    await user.type(screen.getByLabelText(/Nombre/i), 'John');
    await user.type(screen.getByLabelText(/Apellido/i), 'Doe');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Registrarse/i }));
    
    // Check that error message is displayed
    expect(screen.getByText(/El legajo debe contener solo números/i)).toBeInTheDocument();
  });

  it('shows error when name or surname is empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Fill in form with empty name fields
    await user.type(screen.getByLabelText(/Número de Legajo/i), '123456');
    await user.type(screen.getByLabelText(/Confirmar Legajo/i), '123456');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Registrarse/i }));
    
    // Check that error message is displayed
    expect(screen.getByText(/El nombre y apellido son requeridos/i)).toBeInTheDocument();
  });

  it('submits the form successfully when all validations pass', async () => {
    const user = userEvent.setup();
    
    // Spy on console.error to ensure it's not called
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<LoginForm />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/Número de Legajo/i), '123456');
    await user.type(screen.getByLabelText(/Confirmar Legajo/i), '123456');
    await user.type(screen.getByLabelText(/Nombre/i), 'John');
    await user.type(screen.getByLabelText(/Apellido/i), 'Doe');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Registrarse/i }));
    
    // No error should be displayed
    expect(screen.queryByText(/Los números de legajo no coinciden/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/El legajo debe contener solo números/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/El nombre y apellido son requeridos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error al iniciar sesión/i)).not.toBeInTheDocument();
    
    // Verify console.error wasn't called
    expect(consoleSpy).not.toHaveBeenCalled();
    
    // Clean up
    consoleSpy.mockRestore();
  });
}); 