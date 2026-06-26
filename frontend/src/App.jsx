import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckSquare, Upload, History as HistoryIcon, Settings as SettingsIcon, Sun, Moon, Sparkles, LogOut, Coins, ShieldAlert } from 'lucide-react';

// Importar sub-componentes
import Landing from './components/Landing';
import Login from './components/Login';
import Planner from './components/Planner';
import Evaluator from './components/Evaluator';
import SelfEvaluator from './components/SelfEvaluator';
import KnowledgeBase from './components/KnowledgeBase';
import History from './components/History';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import api from './utils/api';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [theme, setTheme] = useState('dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: '',
    model: 'gemini-1.5-flash',
    customRules: ''
  });

  // Cargar configuraciones al montar
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
    const savedRules = localStorage.getItem('gemini_custom_rules') || '';
    const savedTheme = localStorage.getItem('app_theme') || 'dark';

    setSettings({
      apiKey: savedApiKey,
      model: savedModel,
      customRules: savedRules
    });
    
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);

    // Verificar si hay sesión activa en localStorage
    const savedUserId = localStorage.getItem('avelino_user_id');
    if (savedUserId) {
      checkSession();
    }
  }, []);

  // Verificar sesión con el backend
  const checkSession = async () => {
    try {
      const user = await api.getProfile();
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (currentView === 'landing') {
        setCurrentView('planner');
      }
    } catch (e) {
      handleLogout();
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('avelino_user_id', user.id);
    
    // Si es administrador, ir al panel de administración directamente, si no a planificación
    if (user.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('planner');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('avelino_user_id');
    setCurrentView('landing');
  };

  // Recargar el perfil para actualizar créditos en tiempo real
  const refreshUserProfile = async () => {
    if (!isAuthenticated) return;
    try {
      const user = await api.getProfile();
      setCurrentUser(user);
    } catch (e) {}
  };

  // Cambiar de tema
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app_theme', nextTheme);
    document.body.setAttribute('data-theme', nextTheme);
  };

  // Guardar configuración
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('gemini_api_key', newSettings.apiKey);
    localStorage.setItem('gemini_model', newSettings.model);
    localStorage.setItem('gemini_custom_rules', newSettings.customRules);
  };

  // Si no está autenticado y no está en la landing, mostrar Login
  if (!isAuthenticated && currentView !== 'landing') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'landing') {
    return <Landing onEnterApp={() => {
      if (isAuthenticated) {
        setCurrentView(currentUser.role === 'admin' ? 'admin' : 'planner');
      } else {
        setCurrentView('login'); // Forzará el render de Login en la siguiente evaluación
      }
    }} theme={theme} />;
  }

  // Título de la pestaña activa en el Header
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'planner': return 'Planificador PDC';
      case 'evaluator': return 'Evaluaciones y Rúbricas';
      case 'self-evaluator': return 'Fichas de Autoevaluación';
      case 'knowledge': return 'Base de Conocimientos';
      case 'history': return 'Historial de Creaciones';
      case 'settings': return 'Configuración';
      case 'admin': return 'Panel de Administración';
      default: return 'Avelino.IA';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', transition: 'var(--transition-smooth)' }}>
      
      {/* Sidebar */}
      <aside className="glass-panel" style={{
        width: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        margin: '12px 0 12px 12px',
        borderRadius: 'var(--radius-lg)',
        borderRight: '1px solid var(--border-glass)',
        height: 'calc(100vh - 24px)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            padding: '6px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>
            AVELINO<span className="gradient-text" style={{ fontWeight: '800' }}>.IA</span>
          </span>
        </div>

        {/* Navigation list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          
          {currentUser && currentUser.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: currentView === 'admin' ? 'var(--secondary)' : 'transparent',
                color: currentView === 'admin' ? '#fff' : 'var(--text-secondary)',
                fontWeight: '600',
                textAlign: 'left',
                cursor: 'pointer',
                marginBottom: '16px',
                border: '1px solid var(--secondary)',
                transition: 'var(--transition-fast)'
              }}
            >
              <Coins size={18} /> Panel de Control
            </button>
          )}

          <button
            onClick={() => setCurrentView('planner')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: currentView === 'planner' ? 'var(--primary)' : 'transparent',
              color: currentView === 'planner' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <BookOpen size={18} /> Planificador PDC
          </button>

          <button
            onClick={() => setCurrentView('evaluator')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: currentView === 'evaluator' ? 'var(--primary)' : 'transparent',
              color: currentView === 'evaluator' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <FileText size={18} /> Evaluaciones
          </button>

          <button
            onClick={() => setCurrentView('self-evaluator')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: currentView === 'self-evaluator' ? 'var(--primary)' : 'transparent',
              color: currentView === 'self-evaluator' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <CheckSquare size={18} /> Autoevaluaciones
          </button>

          <button
            onClick={() => setCurrentView('knowledge')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: currentView === 'knowledge' ? 'var(--primary)' : 'transparent',
              color: currentView === 'knowledge' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <Upload size={18} /> Base de Conocimiento
          </button>

          <button
            onClick={() => setCurrentView('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: currentView === 'history' ? 'var(--primary)' : 'transparent',
              color: currentView === 'history' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <HistoryIcon size={18} /> Historial
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: currentView === 'settings' ? 'var(--primary)' : 'transparent',
              color: currentView === 'settings' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '500',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <SettingsIcon size={18} /> Configuración
          </button>
        </nav>

        {/* Cerrar Sesión */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            fontWeight: '500',
            textAlign: 'left',
            cursor: 'pointer',
            marginTop: 'auto',
            transition: 'var(--transition-fast)'
          }}
        >
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </aside>

      {/* Main Content Area */}
      <div style={{
        marginLeft: 'calc(var(--sidebar-width) + 24px)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 24px 24px 0',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <header className="glass-panel" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            {getHeaderTitle()}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Saludo Docente */}
            {currentUser && (
              <div style={{ fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Hola, <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{currentUser.name}</span>
              </div>
            )}

            {/* Saldo de Créditos */}
            {currentUser && currentUser.role !== 'admin' && (
              <div style={{
                fontSize: '0.85rem',
                color: currentUser.credits > 0 ? 'var(--secondary)' : '#ef4444',
                background: currentUser.credits > 0 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${currentUser.credits > 0 ? 'var(--secondary)' : '#ef4444'}`,
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Créditos para descargar e imprimir PDCs"
              >
                <Coins size={14} />
                <span>{currentUser.credits} créditos</span>
              </div>
            )}

            {/* Indicador API Key configurada */}
            {!settings.apiKey && (
              <span style={{
                fontSize: '0.75rem',
                color: '#ea580c',
                background: 'rgba(234, 88, 12, 0.1)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldAlert size={12} /> Registrar API Key
              </span>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'var(--transition-fast)'
              }}
              title="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Content switcher */}
        <main style={{ flex: 1 }}>
          {currentView === 'planner' && <Planner settings={settings} currentUser={currentUser} refreshCredits={refreshUserProfile} />}
          {currentView === 'evaluator' && <Evaluator settings={settings} currentUser={currentUser} refreshCredits={refreshUserProfile} />}
          {currentView === 'self-evaluator' && <SelfEvaluator settings={settings} currentUser={currentUser} refreshCredits={refreshUserProfile} />}
          {currentView === 'knowledge' && <KnowledgeBase />}
          {currentView === 'history' && <History currentUser={currentUser} refreshCredits={refreshUserProfile} />}
          {currentView === 'settings' && <Settings settings={settings} onSaveSettings={saveSettings} />}
          {currentView === 'admin' && currentUser && currentUser.role === 'admin' && <AdminPanel />}
        </main>
      </div>

    </div>
  );
}
