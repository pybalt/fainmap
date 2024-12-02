// src/lib/emailService.ts
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, name: string, verificationToken: string) => {
  try {
    await resend.emails.send({
      from: '<onboarding@resend.dev>',
      to: email,
      subject: 'Verifica tu email - UADEMaps',
      html: `
        <h2>¡Bienvenido a UADEMaps!</h2>
        <p>Hola ${name},</p>
        <p>Gracias por registrarte. Para completar tu registro, ingresa este código de verificación:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3B82F6;">${verificationToken}</span>
        </div>
        <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
        <p>Saludos,<br>
        <a href="https://www.linkedin.com/in/leonel-bravo/" style="color: #3B82F6; text-decoration: none;">Leonel B. Bravo</a></p>
      `
    });
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};