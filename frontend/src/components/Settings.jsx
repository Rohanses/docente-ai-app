import React, { useState, useEffect } from 'react';
import { Save, Key, Sliders, ShieldCheck } from 'lucide-react';

export default function Settings({ settings, onSaveSettings }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState(settings.model || 'gemini-1.5-flash');
  const [customRules, setCustomRules] = useState(settings.customRules || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setApiKey(settings.apiKey || '');
    setModel(settings.model || 'gemini-1.5-flash');
    setCustomRules(settings.customRules || '');
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      apiKey,
      model,
      customRules
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '24px' }}>Configuración del Sistema</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Gemini API Key */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ color: 'var(--primary)', display: 'flex' }}><Key size={20} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Google Gemini API Key</h3>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
            Para realizar las consultas de Inteligencia Artificial de forma privada y directa, se requiere una clave de Google Gemini API. Puedes obtener una de forma gratuita en Google AI Studio. Esta clave se guarda de manera segura y local en tu navegador.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Gemini API Key</label>
            <input
              type="password"
              placeholder="Ingresa tu API Key (AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: '1px solid var(--border-color)',
                padding: '12px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.95rem'
              }}
            />
          </div>
        </div>

        {/* Modelo IA & Parámetros */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ color: 'var(--secondary)', display: 'flex' }}><Sliders size={20} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Preferencia del Modelo</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Selección del Modelo de IA</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recomendado - Rápido y Económico)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Más reciente y optimizado)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Razonamiento Complejo - Lento)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Instrucciones Pedagógicas Personalizadas</label>
              <textarea
                rows={4}
                placeholder="Ejemplo: Priorizar técnicas de neuroeducación, usar siempre lenguaje inclusivo despatriaquilizador en los PDC, o incluir recursos tecnológicos sugeridos..."
                value={customRules}
                onChange={(e) => setCustomRules(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  borderRadius: '8px',
                  lineHeight: '1.4',
                  resize: 'vertical'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Estas instrucciones se inyectarán de forma automática en todas las solicitudes que envíes a la IA.
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {saveSuccess && (
          <div className="animate-fade-in" style={{
            background: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid var(--secondary)',
            color: 'var(--secondary)',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}>
            <ShieldCheck size={18} /> ¡Ajustes guardados con éxito en la memoria del navegador!
          </div>
        )}

        {/* Botón de envío */}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
          <Save size={18} /> Guardar Configuración
        </button>

      </form>
    </div>
  );
}
