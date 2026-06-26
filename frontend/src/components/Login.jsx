import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, BookOpen, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nivel, setNivel] = useState('Educación Primaria Comunitaria Vocacional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (isRegister && !name)) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Registrar e iniciar sesión automáticamente
        const user = await api.register(email, password, name, nivel);
        // Hacer login inmediato tras registrarse
        const loggedUser = await api.login(email, password);
        onLoginSuccess(loggedUser);
      } else {
        const user = await api.login(email, password);
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Error en el servidor al intentar ingresar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      transition: 'var(--transition-smooth)',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            padding: '10px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={28} />
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.025em' }}>
            AVELINO<span className="gradient-text" style={{ fontWeight: '800' }}>.IA</span>
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isRegister ? 'Crea tu cuenta de docente' : 'Ingresa a la consola docente'}
          </span>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Prof. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '12px 12px 12px 40px',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="docente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Nivel Educativo Principal</label>
              <div style={{ position: 'relative' }}>
                <BookOpen size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '12px 12px 12px 40px',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Educación Inicial en Familia Comunitaria">Educación Inicial</option>
                  <option value="Educación Primaria Comunitaria Vocacional">Educación Primaria</option>
                  <option value="Educación Secundaria Comunitaria Productiva">Educación Secundaria</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Procesando...' : isRegister ? 'Registrarse y Entrar' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? '¿Ya tienes una cuenta?' : '¿Eres un docente nuevo?'}
          </span>{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{
              background: 'transparent',
              color: 'var(--primary)',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Inicia Sesión' : 'Regístrate aquí'}
          </button>
        </div>

        {/* Demo info */}
        {!isRegister && (
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '12px',
            lineHeight: '1.4'
          }}>
            <strong>Demo Admin:</strong> admin@avelino.ia / admin123
            <br />
            <strong>Demo Docente:</strong> Regístrate para recibir 5 créditos de regalo.
          </div>
        )}

      </div>
    </div>
  );
}
