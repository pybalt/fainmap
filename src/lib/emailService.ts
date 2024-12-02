// src/lib/emailService.ts

export const sendVerificationEmail = async (email: string, name: string, verificationToken: string) => {
  console.log('Iniciando envío de email de verificación:', {
    to: email,
    name,
    token: verificationToken
  });

  try {
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        verificationToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al enviar el email');
    }

    const data = await response.json();
    console.log('Respuesta del servidor:', data);

    return data;
  } catch (error) {
    console.error('Error detallado al enviar email:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};