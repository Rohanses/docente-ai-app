import React, { useState } from 'react';
import { Sparkles, Download, Copy, Printer, Save, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { exportToWord, copyAsRichText, printDocument, jsonToMarkdown } from '../utils/exportUtils';

export default function Evaluator({ settings, currentUser, refreshCredits }) {
  const [nivel, setNivel] = useState('Educación Primaria Comunitaria Vocacional');
  const [grado, setGrado] = useState('1ro de Primaria');
  const [area, setArea] = useState('Comunicación y Lenguajes');
  const [contenidos, setContenidos] = useState('La sílaba, concordancia y la escritura de palabras y textos cortos.');
  const [tipoEvaluacion, setTipoEvaluacion] = useState('Examen Escrito (Preguntas cerradas de opción múltiple y abiertas de desarrollo)');
  const [numPreguntas, setNumPreguntas] = useState(5);
  const [criterioEvaluacion, setCriterioEvaluacion] = useState('Evaluar la escritura creativa y comprensión silábica en situaciones cotidianas.');
  const [dificultad, setDificultad] = useState('Intermedio');

  // Estados de carga e IA
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState('');
  const [editableResult, setEditableResult] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!settings.apiKey) {
      setError('Por favor, ingresa tu Gemini API Key en la pestaña de Configuración antes de generar.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setSaveStatus('');
    
    const steps = [
      'Analizando los perfiles de salida y contenidos oficiales...',
      'Diseñando reactivos y preguntas reflexivas...',
      'Estructurando solucionario y criterios de corrección para el docente...',
      'Formateando la hoja de examen lista para imprimir...',
      'Finalizando la generación de la evaluación...'
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);
    const stepInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(steps[currentStep]);
      }
    }, 2000);

    try {
      const response = await api.generateEvaluation({
        nivel,
        grado,
        area,
        contenidos,
        tipoEvaluacion,
        numPreguntas,
        criterioEvaluacion,
        dificultad
      }, settings.apiKey);

      clearInterval(stepInterval);
      setResult(response.content);
      setEditableResult(response.content);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Error al conectar con la Inteligencia Artificial.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    setSaveStatus('Guardando...');
    try {
      const title = `Evaluación ${grado} - ${area}`;
      await api.saveHistoryItem({
        type: 'evaluation',
        title: title,
        metadata: { nivel, grado, area, contenidos, tipoEvaluacion },
        content: editableResult
      });
      setSaveStatus('¡Guardado en el historial con éxito!');
    } catch (e) {
      setSaveStatus('Error al guardar.');
    }
  };

  const handleCopy = async () => {
    const success = await copyAsRichText(editableResult);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleExportAction = async (actionType, actionCallback) => {
    if (!currentUser) return;
    
    if (currentUser.role === 'admin') {
      actionCallback();
      return;
    }
    
    if (currentUser.credits <= 0) {
      setError('Créditos insuficientes para descargar. Por favor, solicita más créditos a tu administrador.');
      return;
    }

    try {
      setError('');
      const desc = `Exportación (${actionType}) de Evaluación: ${grado} - ${area}`;
      await api.consumeCredit(1, desc);
      await refreshCredits();
      actionCallback();
    } catch (err) {
      setError(err.message || 'Error al cobrar créditos.');
    }
  };

  const handleNivelChange = (val) => {
    setNivel(val);
    if (val.includes('Inicial')) {
      setGrado('1ro de Inicial');
      setArea('Desarrollo Personal y Social');
    } else if (val.includes('Primaria')) {
      setGrado('1ro de Primaria');
      setArea('Comunicación y Lenguajes');
    } else {
      setGrado('1ro de Secundaria');
      setArea('Matemática');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '24px' }}>
        Generador de Evaluaciones y Rúbricas
      </h2>

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
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Formulario */}
        <form onSubmit={handleGenerate} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '8px', color: 'var(--secondary)' }}>
            Configuración de la Evaluación
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Nivel</label>
              <select value={nivel} onChange={(e) => handleNivelChange(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <option value="Educación Inicial en Familia Comunitaria">Educación Inicial</option>
                <option value="Educación Primaria Comunitaria Vocacional">Educación Primaria</option>
                <option value="Educación Secundaria Comunitaria Productiva">Educación Secundaria</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Año de Escolaridad</label>
              {nivel.includes('Inicial') ? (
                <select value={grado} onChange={(e) => setGrado(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <option value="1ro de Inicial">1ro de Inicial</option>
                  <option value="2do de Inicial">2do de Inicial</option>
                </select>
              ) : nivel.includes('Primaria') ? (
                <select value={grado} onChange={(e) => setGrado(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <option value="1ro de Primaria">1ro de Primaria</option>
                  <option value="2do de Primaria">2do de Primaria</option>
                  <option value="3ro de Primaria">3ro de Primaria</option>
                  <option value="4to de Primaria">4to de Primaria</option>
                  <option value="5to de Primaria">5to de Primaria</option>
                  <option value="6to de Primaria">6to de Primaria</option>
                </select>
              ) : (
                <select value={grado} onChange={(e) => setGrado(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <option value="1ro de Secundaria">1ro de Secundaria</option>
                  <option value="2do de Secundaria">2do de Secundaria</option>
                  <option value="3ro de Secundaria">3ro de Secundaria</option>
                  <option value="4to de Secundaria">4to de Secundaria</option>
                  <option value="5to de Secundaria">5to de Secundaria</option>
                  <option value="6to de Secundaria">6to de Secundaria</option>
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Área (Materia)</label>
            <input type="text" value={area} onChange={(e) => setArea(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Contenidos a Evaluar</label>
            <textarea rows={2} value={contenidos} onChange={(e) => setContenidos(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Tipo de Evaluación</label>
            <select value={tipoEvaluacion} onChange={(e) => setTipoEvaluacion(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <option value="Examen Escrito (Preguntas cerradas de opción múltiple y abiertas de desarrollo)">Examen Escrito Escolar</option>
              <option value="Prueba Diagnóstica Integral">Prueba Diagnóstica</option>
              <option value="Rúbrica de Evaluación analítica detallada">Rúbrica Descriptiva (Saber-Hacer)</option>
              <option value="Actividad Práctica / Producción de proyectos con guía de evaluación">Proyecto o Práctica</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Preguntas / Criterios</label>
              <input type="number" min={3} max={15} value={numPreguntas} onChange={(e) => setNumPreguntas(parseInt(e.target.value))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Dificultad</label>
              <select value={dificultad} onChange={(e) => setDificultad(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <option value="Básico">Básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado / Retador">Avanzado / Retador</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Criterio de Evaluación Principal</label>
            <textarea rows={2} value={criterioEvaluacion} onChange={(e) => setCriterioEvaluacion(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', resize: 'vertical' }} />
          </div>

          <button type="submit" className="btn btn-secondary" disabled={loading} style={{ padding: '14px', marginTop: '10px' }}>
            {loading ? <><RefreshCw size={18} className="animate-spin" /> Generando Evaluación...</> : <><Sparkles size={18} /> Generar Evaluación con IA</>}
          </button>
        </form>

        {/* Output */}
        <div className="glass-panel" style={{ padding: '24px', height: '82vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--secondary)' }} /> Documento Generado
            </h3>
            
            {result && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" onClick={() => setIsEditing(!isEditing)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  {isEditing ? 'Ver formato' : 'Editar'}
                </button>
                <button className="btn btn-outline" onClick={() => handleExportAction('Copiado', handleCopy)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Copy size={14} /> {copySuccess ? '¡Copiado!' : 'Copiar'}
                </button>
                <button className="btn btn-outline" onClick={() => handleExportAction('Impresión/PDF', () => printDocument(`Evaluación ${grado}`, editableResult))} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Printer size={14} />
                </button>
                <button className="btn btn-secondary" onClick={() => handleExportAction('Descarga Word', () => exportToWord(editableResult, `Evaluacion_${grado.replace(/ /g, '_')}_${area.replace(/ /g, '_')}`))} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Download size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid var(--border-color)',
                  borderTopColor: 'var(--secondary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', textAlign: 'center' }}>
                  {loadingStep}
                </p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Esto puede tardar entre 10 y 20 segundos...</span>
              </div>
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
                {isEditing ? (
                  <textarea
                    value={editableResult}
                    onChange={(e) => setEditableResult(e.target.value)}
                    style={{
                      flex: 1,
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '16px',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      resize: 'none'
                    }}
                  />
                ) : (
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '20px',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(editableResult);
                        return jsonToMarkdown(parsed);
                      } catch (e) {
                        return editableResult;
                      }
                    })()}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <button className="btn btn-primary" onClick={handleSaveToHistory} style={{ fontSize: '0.9rem', padding: '10px 20px', background: 'var(--secondary)' }}>
                    <Save size={16} /> Guardar Evaluación en Historial
                  </button>
                  {saveStatus && <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: '500' }}>{saveStatus}</span>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                <Sparkles size={48} style={{ color: 'var(--border-color)', marginBottom: '16px' }} />
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Evaluación no generada</h4>
                <p style={{ fontSize: '0.9rem', maxWidth: '300px', lineHeight: '1.4' }}>
                  Completa el formulario y presiona el botón para generar tu prueba escolar u hojas de rúbrica con IA.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
