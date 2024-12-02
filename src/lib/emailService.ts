// src/lib/emailService.ts
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, name: string, verificationToken: string) => {
  try {
    const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}`;
    
    await resend.emails.send({
      from: 'UADEMaps <onboarding@resend.dev>',
      to: email,
      subject: 'Verifica tu email - UADEMaps',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db; margin-bottom: 20px;">¡Bienvenido a UADEMaps!</h2>
          
          <p style="color: #374151; font-size: 16px;">Hola ${name},</p>
          
          <p style="color: #374151; font-size: 16px;">
            Gracias por registrarte en UADEMaps. Para completar tu registro y acceder a la plataforma,
            haz clic en el siguiente botón:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #1a56db; 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 6px;
                      font-weight: bold;
                      display: inline-block;">
              Verificar mi email
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:<br>
            <a href="${verificationUrl}" style="color: #1a56db; word-break: break-all;">
              ${verificationUrl}
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Si no creaste esta cuenta, puedes ignorar este mensaje.
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};