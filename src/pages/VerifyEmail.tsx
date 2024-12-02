import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Obtener datos de verificación del localStorage
        const storedToken = localStorage.getItem('verificationToken');
        const expirationTime = localStorage.getItem('verificationExpiration');
        const pendingLegajo = localStorage.getItem('pendingLegajo');

        if (!storedToken || !expirationTime || !pendingLegajo) {
          throw new Error('Información de verificación no encontrada');
        }

        // Verificar si el token ha expirado
        if (Date.now() > parseInt(expirationTime)) {
          throw new Error('El link de verificación ha expirado. Por favor, solicita uno nuevo.');
        }

        // Buscar usuario con el legajo pendiente
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('studentid', pendingLegajo)
          .single();

        if (userError || !user) {
          throw new Error('Usuario no encontrado');
        }

        // Actualizar el estado de verificación
        const { error: updateError } = await supabase
          .from('users')
          .update({ email_verified: true })
          .eq('studentid', pendingLegajo);

        if (updateError) throw updateError;

        // Limpiar datos de verificación y establecer usuario como verificado
        localStorage.removeItem('verificationToken');
        localStorage.removeItem('verificationExpiration');
        localStorage.removeItem('pendingLegajo');
        localStorage.setItem('userLegajo', pendingLegajo);

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Error en verificación:', error);
        setError(error instanceof Error ? error.message : 'Error al verificar el email');
        
        // Limpiar datos de verificación en caso de error
        localStorage.removeItem('verificationToken');
        localStorage.removeItem('verificationExpiration');
        localStorage.removeItem('pendingLegajo');
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleVerification();
  }, [navigate]);

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
            <p className="text-gray-600 mt-2">Redirigiendo...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-green-600">¡Email verificado correctamente!</p>
            <p className="text-gray-600 mt-2">Redirigiendo al dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 