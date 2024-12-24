import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const token = searchParams.get('token');

        if (!token) {
          throw new Error('Token de verificación no encontrado');
        }

        // Buscar usuario con el token de verificación
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('verification_token', token)
          .single();

        if (userError || !user) {
          throw new Error('Token de verificación inválido');
        }

        // Verificar que el email coincida con el registrado
        if (user.email !== user.verification_email) {
          throw new Error('Token de verificación inválido o manipulado');
        }

        // Verificar si el token ha expirado (15 minutos)
        const tokenTimestamp = user.verification_timestamp;
        if (Date.now() - tokenTimestamp > 15 * 60 * 1000) {
          throw new Error('El enlace de verificación ha expirado. Por favor, contacta a soporte.');
        }

        // Actualizar el estado de verificación y limpiar todos los datos de verificación
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            email_verified: true,
            verification_token: null,
            verification_timestamp: null,
            verification_email: null
          })
          .eq('studentid', user.studentid);

        if (updateError) throw updateError;

        // Guardar legajo y redirigir al dashboard
        localStorage.setItem('userLegajo', user.studentid);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Error en verificación:', error);
        setError(error instanceof Error ? error.message : 'Error al verificar el email');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleVerification();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Verificación de Email</h1>
        
        {loading ? (
          <div className="text-center">
            <p className="text-gray-600">Verificando tu email...</p>
            <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <p className="text-gray-600 mt-2">Redirigiendo al inicio...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-green-600">¡Email verificado correctamente!</p>
            <p className="text-gray-600 mt-2">Redirigiendo al dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 