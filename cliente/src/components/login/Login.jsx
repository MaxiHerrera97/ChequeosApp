import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../../config/api';
import { motion } from 'framer-motion';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Inicializar useNavigate

  const [error, setError] = useState('');

  // Limpiar estado de autenticación al cargar el componente de login
  useEffect(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username, contrasena: password })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      const user = await response.json();
      try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
      onLogin(user);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Error del servidor');
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 font-dmSans flex items-center justify-center px-4'>
      <article className='bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden'>
        <div className='absolute -z-10 -right-16 -top-16 w-64 h-64 rounded-full bg-green-100'></div>
        <div className='absolute -z-10 -left-16 -bottom-16 w-64 h-64 rounded-full bg-yellow-100'></div>
        <form className='grid gap-6 relative z-10' onSubmit={handleLogin}>
          <h2 className='text-2xl font-bold text-center'>Login</h2>
          {error && <p className='text-red-600 text-sm text-center'>{error}</p>}
          <div className='grid gap-1'>
            <label htmlFor='username' className='text-sm text-gray-700'>Usuario</label>
            <input
              className='outline-none bg-white border border-gray-300 rounded-lg h-11 px-3 focus-visible:ring-2 focus-visible:ring-green-500/30 focus-visible:border-green-600'
              type='text'
              id='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className='grid gap-1'>
            <label htmlFor='password' className='text-sm text-gray-700'>Contraseña</label>
            <input
              className='outline-none bg-white border border-gray-300 rounded-lg h-11 px-3 focus-visible:ring-2 focus-visible:ring-green-500/30 focus-visible:border-green-600'
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className='bg-green-700 hover:bg-green-800 rounded-lg text-white py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30'>Ingresar</button>
          <span className='text-sm text-gray-600 text-center'> ¿Olvidaste tu contraseña? <button type='button' className='font-semibold text-gray-900 underline'>IT AREA</button></span>
        </form>
        <div className="mt-6 text-center">
          <motion.h3 
            className="text-3xl uppercase font-bold"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y:0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >ZAFRA <span className='text-yellow-500'>S.A</span></motion.h3>
        </div>
      </article>
    </div>
  );
};

export default Login;