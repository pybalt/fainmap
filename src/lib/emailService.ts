// src/lib/emailService.ts
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, name: string, verificationUrl: string) => {
  try {
    await resend.emails.send({
      from: 'UADEMaps <no-reply@uademap.com>',
      to: email,
      subject: 'Verifica tu email - UADEMaps',
      html: `
        <h2>¡Bienvenido a UADEMaps!</h2>
        <p>Hola ${name},</p>
        <p>Gracias por registrarte. Para completar tu registro, verifica tu email:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">
          Verificar mi email
        </a>
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