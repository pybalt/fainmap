import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const LandingPage = (): JSX.Element => {
  const [isLogin, setIsLogin] = useState(true);
  const [legajo, setLegajo] = useState('');
  const [confirmLegajo, setConfirmLegajo] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario ya está logueado
  useEffect(() => {
    const userLegajo = localStorage.getItem('userLegajo');
    if (userLegajo) {
      console.log('Usuario ya logueado, redirigiendo a dashboard');
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    // Cargar el script de reCAPTCHA v3
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, {action: 'submit'});
      
      if (!token) {
        throw new Error('Error de verificación de seguridad');
      }

      // Validaciones adicionales para ambos casos
      if (legajo.length < 4) {
        throw new Error('Credenciales inválidas');
      }

      if (isLogin) {
        // Verificar si el usuario existe
        const { error } = await supabase
          .from('users')
          .select('*')
          .eq('studentid', legajo)
          .single();

        if (error) {
          console.error('Error al buscar usuario:', error);
          throw new Error('Credenciales inválidas');
        }

        localStorage.setItem('userLegajo', legajo);
        navigate('/dashboard');
      } else {
        const emailName = email.split('@')[0];
        if (emailName.length < 5) {
          throw new Error('Credenciales inválidas');
        }

        if (!email.endsWith('@uade.edu.ar')) {
          throw new Error('Credenciales inválidas');
        }

        if (legajo !== confirmLegajo) {
          throw new Error('Los códigos de legajo no coinciden');
        }

        // Verificar si el usuario ya existe
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('studentid')
          .eq('studentid', legajo)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error al verificar usuario existente:', checkError);
          throw new Error('Credenciales inválidas');
        }

        if (existingUser) {
          throw new Error('Credenciales inválidas');
        }

        // Verificar si el email ya está en uso
        const { data: emailUser, error: emailError } = await supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .single();

        if (emailError && emailError.code !== 'PGRST116') {
          console.error('Error al verificar email:', emailError);
          throw new Error('Credenciales inválidas');
        }

        if (emailUser) {
          throw new Error('Credenciales inválidas');
        }

        // Crear nuevo usuario
        const nameParts = email.split('@')[0].split('.');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[1] || '';

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              studentid: legajo,
              email: email,
              firstname: firstName.charAt(0).toUpperCase() + firstName.slice(1),
              lastname: lastName.charAt(0).toUpperCase() + lastName.slice(1)
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error al insertar usuario:', insertError);
          throw new Error('Credenciales inválidas');
        }

        console.log('Usuario registrado exitosamente:', newUser);
        localStorage.setItem('userLegajo', legajo);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error completo:', error);
      alert(error instanceof Error ? error.message : 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  const preventPasteAndDrop = (e: React.ClipboardEvent | React.DragEvent) => {
    e.preventDefault();
    alert('Por favor, ingresa el código de legajo manualmente para confirmar');
  };

  const preventCopyAndCut = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">FainMap</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex mb-4">
          <button
            type="button"
            disabled={loading}
            className={`flex-1 py-2 ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsLogin(true)}
          >
            Ingresar
          </button>
          <button
            type="button"
            disabled={loading}
            className={`flex-1 py-2 ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsLogin(false)}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Email UADE</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
                pattern=".*@uade\.edu\.ar"
                placeholder="nombre.apellido@uade.edu.ar"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Código de Legajo</label>
            <input
              type="text"
              value={legajo}
              onChange={(e) => setLegajo(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={loading}
              autoComplete={isLogin ? "off" : "on"}
              placeholder="Ingresa tu código de legajo"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirmar Código de Legajo
                <span className="text-xs text-gray-500 ml-1">(ingresa manualmente)</span>
              </label>
              <input
                type="text"
                value={confirmLegajo}
                onChange={(e) => setConfirmLegajo(e.target.value)}
                onPaste={preventPasteAndDrop}
                onDrop={preventPasteAndDrop}
                onCopy={preventCopyAndCut}
                onCut={preventCopyAndCut}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
                autoComplete="off"
                placeholder="Vuelve a ingresar tu código de legajo"
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LandingPage; 