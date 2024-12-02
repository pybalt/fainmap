import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Obtener token y email de la URL
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('token');
        const emailFromUrl = params.get('email');

        if (!token || !emailFromUrl) {
          throw new Error('No se encontró token de verificación o email');
        }

        // Verificar el token con Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) throw error;

        // Actualizar el estado de verificación en la base de datos
        await supabase
          .from('users')
          .update({ email_verified: true })
          .eq('email', emailFromUrl);

        alert('Email verificado correctamente. Ya puedes ingresar.');
        navigate('/');
      } catch (error) {
        console.error('Error en verificación:', error);
        alert('Error al verificar el email. Por favor, intenta nuevamente.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    handleVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Verificando email...</h1>
        {loading ? (
          <p>Por favor espera mientras verificamos tu email...</p>
        ) : (
          <p>Redirigiendo...</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 