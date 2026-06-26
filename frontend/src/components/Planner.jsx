import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Copy, Printer, Save, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { exportToWord, copyAsRichText, printDocument } from '../utils/exportUtils';

export default function Planner({ settings, currentUser, refreshCredits }) {
  // Catálogo oficial
  const [catalog, setCatalog] = useState(null);
  const [grados, setGrados] = useState([]);
  const [areas, setAreas] = useState([]);

  // Parámetros de planificación
  const [nivel, setNivel] = useState('epcv'); // id del nivel (e.g. epcv)
  const [grado, setGrado] = useState(1);       // grado id o número (e.g. 1)
  const [campo, setCampo] = useState('Cosmos y Pensamiento');
  const [area, setArea] = useState('comunicacion');   // area id (e.g. comunicacion)
  const [trimestre, setTrimestre] = useState('Primer Trimestre');
  const [psp, setPsp] = useState('Prevención de toda forma de violencia familiar y comunitaria.');
  const [objetivoHolistico, setObjetivoHolistico] = useState('Fortalecemos los valores de respeto y convivencia pacífica...');
  const [contenidos, setContenidos] = useState('La sílaba, concordancia y la escritura creativa de textos cortos.');
  const [metodologias, setMetodologias] = useState('Aula Invertida, Aprendizaje Cooperativo y Rutinas de Pensamiento.');
  const [adaptaciones, setAdaptaciones] = useState('Estudiante 1: Dificultad en grafomotricidad (ejercicios adicionales de trazo), Estudiante 2: TDAH (dar consignas paso a paso).');

  // Sugerencias oficiales
  const [seededContent, setSeededContent] = useState([]);

  // Estados de carga e IA
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState(''); // Raw JSON string
  const [pdcData, setPdcData] = useState(null); // Parsed JSON
  const [editableResult, setEditableResult] = useState(''); // Textarea editing
  const [error, setError] = useState('');
  const [outputTab, setOutputTab] = useState('preview'); // 'preview', 'editor', 'json'
  const [saveStatus, setSaveStatus] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Cargar catálogo educativo en montaje
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await api.getCatalog();
        setCatalog(data);
        if (data && data.niveles && data.niveles.length > 0) {
          // Por defecto: Primaria, 1ro de Primaria, Comunicación y Lenguajes
          const defaultNivel = data.niveles.find(n => n.id === 'epcv') || data.niveles[0];
          setNivel(defaultNivel.id);
          setGrados(defaultNivel.grados || []);
          setGrado(defaultNivel.grados[0]);
          
          const defaultAreas = data.areas_primaria || [];
          setAreas(defaultAreas);
          if (defaultAreas.length > 0) {
            setArea(defaultAreas[0].id);
          }
        }
      } catch (err) {
        console.error('Error cargando el catálogo educativo:', err);
      }
    };
    fetchCatalog();
  }, []);

  // Cargar contenidos sugeridos cuando cambian parámetros principales
  useEffect(() => {
    if (!nivel || !grado || !area || !trimestre) return;
    const fetchSeeded = async () => {
      try {
        const valTrimestre = trimestre === 'Primer Trimestre' ? 1 : trimestre === 'Segundo Trimestre' ? 2 : 3;
        const data = await api.getSeededContent(nivel, grado, area, valTrimestre);
        setSeededContent(data || []);
      } catch (err) {
        console.error('Error cargando contenidos presembrados:', err);
      }
    };
    fetchSeeded();
  }, [nivel, grado, area, trimestre]);

  // Manejar cambio de nivel para actualizar grados y materias disponibles
  const handleNivelChange = (newNivelId) => {
    setNivel(newNivelId);
    if (!catalog) return;
    
    const selectedNivel = catalog.niveles.find(n => n.id === newNivelId);
    if (selectedNivel) {
      setGrados(selectedNivel.grados || []);
      setGrado(selectedNivel.grados[0]);
      
      if (newNivelId === 'eifc') {
        // Inicial: Las materias corresponden directamente a los 4 campos
        const camposAsAreas = catalog.campos.map(c => ({ id: c.id, nombre: c.nombre }));
        setAreas(camposAsAreas);
        setArea(camposAsAreas[0].id);
      } else if (newNivelId === 'epcv') {
        setAreas(catalog.areas_primaria || []);
        if (catalog.areas_primaria && catalog.areas_primaria.length > 0) {
          setArea(catalog.areas_primaria[0].id);
        }
      } else {
        setAreas(catalog.areas_secundaria || []);
        if (catalog.areas_secundaria && catalog.areas_secundaria.length > 0) {
          setArea(catalog.areas_secundaria[0].id);
        }
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!settings.apiKey) {
      setError('Por favor, ingresa tu Gemini API Key en la pestaña de Configuración antes de generar.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setPdcData(null);
    setSaveStatus('');
    
    const steps = [
      'Estudiando currículo oficial base boliviano...',
      'Buscando planes de estudio en base de datos local y PSP...',
      'Ejecutando consulta RAG sobre lineamientos curriculares y resolución 0001/2026...',
      'Integrando metodologías innovadoras mundiales seleccionadas...',
      'Estructurando momentos metodológicos (Práctica, Teoría, Valoración, Producción)...',
      'Articulando dimensiones (Ser, Saber, Hacer, Decidir) en criterios de evaluación...',
      'Diseñando adaptaciones curriculares específicas y significativas...',
      'Generando archivo estructurado JSON para el editor visual...'
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);
    const stepInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(steps[currentStep]);
      }
    }, 2500);

    try {
      const finalMetodologias = settings.customRules 
        ? `${metodologias} (Instrucciones adicionales del docente: ${settings.customRules})`
        : metodologias;

      // Obtener nombres para legibilidad humana
      const nivelNombre = catalog?.niveles.find(n => n.id === nivel)?.nombre || nivel;
      const gradoNombre = `${grado}ro de ${nivelNombre.split(' ').slice(1, 2).join(' ')}`;
      const areaNombre = areas.find(a => a.id === area)?.nombre || area;

      const response = await api.generatePDC({
        nivel: nivelNombre,
        grado: gradoNombre,
        campo,
        area: areaNombre,
        trimestre,
        psp,
        objetivoHolistico,
        contenidos,
        metodologiasInnovadoras: finalMetodologias,
        dificultadesEstudiantes: adaptaciones
      }, settings.apiKey);

      clearInterval(stepInterval);
      
      let parsed = null;
      try {
        parsed = JSON.parse(response.content);
      } catch (jsonErr) {
        console.error('Error al parsear el JSON original, limpiando formato:', jsonErr);
        const cleanContent = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanContent);
      }

      setResult(response.content);
      setPdcData(parsed);
      setEditableResult(JSON.stringify(parsed, null, 2));
      setOutputTab('preview');
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
      const areaNombre = areas.find(a => a.id === area)?.nombre || area;
      const title = `PDC ${grado} - ${areaNombre} (${trimestre})`;
      await api.saveHistoryItem({
        type: 'pdc',
        title: title,
        metadata: { nivel, grado, campo, area, trimestre, psp },
        content: JSON.stringify(pdcData, null, 2)
      });
      setSaveStatus('¡Guardado en el historial con éxito!');
    } catch (e) {
      setSaveStatus('Error al guardar en el historial.');
    }
  };

  const handleCopy = async () => {
    const success = await copyAsRichText(pdcData);
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
      const desc = `Exportación (${actionType}) de PDC: ${grado} - ${area}`;
      await api.consumeCredit(1, desc);
      await refreshCredits();
      actionCallback();
    } catch (err) {
      setError(err.message || 'Error al cobrar créditos.');
    }
  };

  const handleJsonTextareaChange = (val) => {
    setEditableResult(val);
    try {
      const parsed = JSON.parse(val);
      setPdcData(parsed);
    } catch (e) {
      // JSON inválido mientras se escribe
    }
  };

  const getHumanNivelName = (nivelId) => {
    if (!catalog) return '';
    return catalog.niveles.find(n => n.id === nivelId)?.nombre || '';
  };

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '24px' }}>
        Planificador de Desarrollo Curricular (PDC) - Bolivia
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

      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Formulario */}
        <form onSubmit={handleGenerate} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '82vh', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '4px', color: 'var(--primary)' }}>
            Configuración del PDC
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Nivel</label>
              <select value={nivel} onChange={(e) => handleNivelChange(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
                <option value="eifc">Educación Inicial</option>
                <option value="epcv">Educación Primaria</option>
                <option value="escp">Educación Secundaria</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Año de Escolaridad</label>
              <select value={grado} onChange={(e) => setGrado(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
                {grados.map(g => (
                  <option key={g} value={g}>{g}ro de {nivel === 'eifc' ? 'Inicial' : nivel === 'epcv' ? 'Primaria' : 'Secundaria'}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Campo de Saberes</label>
              <select value={campo} onChange={(e) => setCampo(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
                <option value="Cosmos y Pensamiento">Cosmos y Pensamiento</option>
                <option value="Comunidad y Sociedad">Comunidad y Sociedad</option>
                <option value="Vida Tierra Territorio">Vida Tierra Territorio</option>
                <option value="Ciencia Tecnología y Producción">Ciencia Tecnología y Producción</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Área (Materia)</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Trimestre</label>
            <select value={trimestre} onChange={(e) => setTrimestre(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
              <option value="Primer Trimestre">Primer Trimestre</option>
              <option value="Segundo Trimestre">Segundo Trimestre</option>
              <option value="Tercer Trimestre">Tercer Trimestre</option>
            </select>
          </div>

          {/* Sugerencias Oficiales Sembradas */}
          {seededContent && seededContent.length > 0 && (
            <div style={{
              background: 'rgba(37, 99, 235, 0.05)',
              border: '1px dashed var(--primary)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} /> Currículo Oficial (Sugerencias)
              </span>
              {seededContent.slice(0, 1).map((s, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ maxHeight: '100px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                    <strong>Perfil Salida:</strong> {s.perfil_salida}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '4px 8px', flex: 1 }} onClick={() => setObjetivoHolistico(s.perfil_salida)}>
                      Usar Perfil
                    </button>
                    <button type="button" className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '4px 8px', flex: 1 }} onClick={() => setContenidos(s.contenidos.join('\n'))}>
                      Usar Contenidos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Temática del PSP</label>
            <textarea rows={2} value={psp} onChange={(e) => setPsp(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.82rem', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Objetivo Holístico (Sugerido/Base)</label>
            <textarea rows={2} value={objetivoHolistico} onChange={(e) => setObjetivoHolistico(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.82rem', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Contenidos y Ejes Articuladores</label>
            <textarea rows={2} value={contenidos} onChange={(e) => setContenidos(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.82rem', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Estrategias Innovadoras Mundiales</label>
            <input type="text" value={metodologias} onChange={(e) => setMetodologias(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Casos para Adaptación Curricular</label>
            <textarea rows={2} value={adaptaciones} onChange={(e) => setAdaptaciones(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.82rem', resize: 'vertical' }} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px', marginTop: '4px' }}>
            {loading ? <><RefreshCw size={16} className="animate-spin" /> Generando PDC...</> : <><Sparkles size={16} /> Generar PDC con IA</>}
          </button>
        </form>

        {/* Panel de Salida y Editores */}
        <div className="glass-panel" style={{ padding: '24px', height: '82vh', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} /> Documento Generado
            </h3>
            
            {pdcData && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" onClick={() => handleExportAction('Copiado', handleCopy)} style={{ padding: '6px 10px', fontSize: '0.8rem' }} title="Copiar como formato enriquecido para Word">
                  <Copy size={13} /> {copySuccess ? '¡Copiado!' : 'Copiar'}
                </button>
                <button className="btn btn-outline" onClick={() => handleExportAction('Impresión/PDF', () => printDocument(`PDC ${grado}`, pdcData))} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                  <Printer size={13} /> Imprimir / PDF
                </button>
                <button className="btn btn-secondary" onClick={() => handleExportAction('Descarga Word', () => exportToWord(pdcData, `PDC_${grado}_${area}`))} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                  <Download size={13} /> Word (.docx)
                </button>
              </div>
            )}
          </div>

          {pdcData && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', paddingBottom: '2px' }}>
              <button type="button" onClick={() => setOutputTab('preview')} style={subTabStyle(outputTab === 'preview')}>
                Vista Previa Formal
              </button>
              <button type="button" onClick={() => setOutputTab('editor')} style={subTabStyle(outputTab === 'editor')}>
                Editor Visual
              </button>
              <button type="button" onClick={() => setOutputTab('json')} style={subTabStyle(outputTab === 'json')}>
                Código JSON
              </button>
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                <div style={{
                  width: '45px',
                  height: '45px',
                  border: '4px solid var(--border-color)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', textAlign: 'center', fontSize: '0.9rem', maxWidth: '300px' }}>
                  {loadingStep}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Esto puede tardar entre 10 y 20 segundos...</span>
              </div>
            ) : pdcData ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '60vh' }}>
                  {outputTab === 'preview' && <PdcVisualPreview data={pdcData} />}
                  {outputTab === 'editor' && <PdcVisualEditor data={pdcData} onChange={setPdcData} />}
                  {outputTab === 'json' && (
                    <textarea
                      value={editableResult}
                      onChange={(e) => handleJsonTextareaChange(e.target.value)}
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '16px',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        resize: 'none'
                      }}
                    />
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <button className="btn btn-primary" onClick={handleSaveToHistory} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                    <Save size={14} /> Guardar Cambios en Historial
                  </button>
                  {saveStatus && <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '500' }}>{saveStatus}</span>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                <Sparkles size={44} style={{ color: 'var(--border-color)', marginBottom: '14px' }} />
                <h4 style={{ fontWeight: '600', marginBottom: '6px' }}>PDC no generado</h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '300px', lineHeight: '1.4' }}>
                  Completa el formulario y presiona el botón para generar tu planificación bajo el MESCP con IA.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub Tab styles inside Preview Panel
const subTabStyle = (active) => ({
  padding: '6px 12px',
  background: 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '0.82rem',
  transition: 'all 0.15s'
});

// PdcVisualPreview Component
function PdcVisualPreview({ data }) {
  const { datosReferenciales, objetivoHolisticoNivel, estructuraPDC, adaptacionesSignificativas } = data;
  const isInicial = estructuraPDC.tipo === 'directo';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', color: '#1e293b', padding: '24px', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'Arial, sans-serif', border: '1px solid #e2e8f0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
      
      {/* Encabezado */}
      <div style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '1.15rem', textAlign: 'center', color: '#1e3a8a', borderBottom: '2px solid #1e3a8a', paddingBottom: '6px' }}>
        Plan de Desarrollo Curricular (PDC)
      </div>

      {/* Datos Referenciales */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
        <tbody>
          <tr>
            <td style={previewTdStyle}><strong>Distrito:</strong> {datosReferenciales.distrito}</td>
            <td style={previewTdStyle}><strong>Unidad Educativa:</strong> {datosReferenciales.unidadEducativa}</td>
          </tr>
          <tr>
            <td style={previewTdStyle}><strong>Nivel:</strong> {datosReferenciales.nivel}</td>
            <td style={previewTdStyle}><strong>Grado:</strong> {datosReferenciales.grado}</td>
          </tr>
          <tr>
            <td style={previewTdStyle}><strong>Maestra/o:</strong> {datosReferenciales.maestro}</td>
            <td style={previewTdStyle}><strong>Director/a:</strong> {datosReferenciales.director}</td>
          </tr>
          <tr>
            <td style={previewTdStyle}><strong>Trimestre:</strong> {datosReferenciales.trimestre}</td>
            <td style={previewTdStyle}><strong>Gestión/Fechas:</strong> {datosReferenciales.gestion} (Del {datosReferenciales.fechaInicio} al {datosReferenciales.fechaFin})</td>
          </tr>
        </tbody>
      </table>

      {/* Objetivo Holístico */}
      <div style={{ marginTop: '12px' }}>
        <h4 style={previewH4Style}>1. OBJETIVO HOLÍSTICO DE NIVEL / DE APRENDIZAJE</h4>
        <div style={{ padding: '8px 12px', borderLeft: '3px solid #1e3a8a', background: '#f8fafc', fontStyle: 'italic', textAlign: 'justify', lineHeight: '1.4', borderRadius: '0 4px 4px 0' }}>
          {objetivoHolisticoNivel}
        </div>
      </div>

      {/* Matriz Pedagógica */}
      <div style={{ marginTop: '12px' }}>
        <h4 style={previewH4Style}>2. DESARROLLO CURRICULAR Y PEDAGÓGICO</h4>
        
        {(estructuraPDC.areas || []).map((area, aIdx) => (
          <div key={aIdx} style={{ marginTop: '10px' }}>
            <h5 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0369a1', margin: '4px 0', borderBottom: '1px dashed #cbd5e1', paddingBottom: '3px' }}>
              ÁREA: {area.nombreArea.toUpperCase()}
            </h5>
            {area.objetivoAprendizaje && <div style={{ margin: '4px 0', fontSize: '0.8rem' }}><strong>Objetivo de Aprendizaje:</strong> {area.objetivoAprendizaje}</div>}
            {area.contenidos && area.contenidos.length > 0 && <div style={{ margin: '4px 0', fontSize: '0.8rem' }}><strong>Contenidos:</strong> {area.contenidos.join(', ')}</div>}
            
            {isInicial ? (
              <table style={previewTableStyle}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={previewThStyle}>Momentos Metodológicos</th>
                    <th style={previewThStyle}>Recursos/Materiales</th>
                    <th style={previewThStyle}>Criterios de Evaluación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={previewTdTableStyle}>
                      <p style={{ margin: '0 0 6px 0' }}><strong>Práctica:</strong> {area.momentosDirectos?.practica}</p>
                      <p style={{ margin: '0 0 6px 0' }}><strong>Teoría:</strong> {area.momentosDirectos?.teoria}</p>
                      <p style={{ margin: '0 0 6px 0' }}><strong>Valoración:</strong> {area.momentosDirectos?.valoracion}</p>
                      <p style={{ margin: '0' }}><strong>Producción:</strong> {area.momentosDirectos?.produccion}</p>
                    </td>
                    <td style={previewTdTableStyle}>
                      <p style={{ margin: '0 0 4px 0' }}><strong>Analógicos:</strong> {(area.recursosDirectos?.analogicos || []).join(', ')}</p>
                      <p style={{ margin: '0 0 4px 0' }}><strong>Producción:</strong> {(area.recursosDirectos?.produccion || []).join(', ')}</p>
                      <p style={{ margin: '0' }}><strong>Vida Diaria:</strong> {(area.recursosDirectos?.vida || []).join(', ')}</p>
                    </td>
                    <td style={previewTdTableStyle}>
                      <p style={{ margin: '0 0 4px 0' }}><strong>SER:</strong> {area.criteriosDirectos?.ser}</p>
                      <p style={{ margin: '0 0 4px 0' }}><strong>SABER:</strong> {area.criteriosDirectos?.saber}</p>
                      <p style={{ margin: '0 0 4px 0' }}><strong>HACER:</strong> {area.criteriosDirectos?.hacer}</p>
                      <p style={{ margin: '0' }}><strong>DECIDIR:</strong> {area.criteriosDirectos?.decidir}</p>
                    </td>
                  </tr>
                  {area.adaptacionesCurriculares && (
                    <tr>
                      <td colSpan="3" style={previewTdTableStyle}>
                        <strong>Adaptaciones Curriculares (Generales):</strong> {area.adaptacionesCurriculares}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table style={previewTableStyle}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ ...previewThStyle, width: '12%', textAlign: 'center' }}>Semana</th>
                    <th style={{ ...previewThStyle, width: '48%' }}>Momentos Metodológicos</th>
                    <th style={{ ...previewThStyle, width: '20%' }}>Recursos</th>
                    <th style={{ ...previewThStyle, width: '20%' }}>Criterios de Evaluación</th>
                  </tr>
                </thead>
                <tbody>
                  {(area.semanas || []).map((w, wIdx) => (
                    <tr key={wIdx}>
                      <td style={{ ...previewTdTableStyle, textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>
                        Semana {w.semana}<br/>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#64748b' }}>({w.periodos || 8} períodos)</span>
                      </td>
                      <td style={previewTdTableStyle}>
                        <p style={{ margin: '0 0 5px 0', textAlign: 'justify' }}><strong>Práctica:</strong> {w.momentos?.practica}</p>
                        <p style={{ margin: '0 0 5px 0', textAlign: 'justify' }}><strong>Teoría:</strong> {w.momentos?.teoria}</p>
                        <p style={{ margin: '0 0 5px 0', textAlign: 'justify' }}><strong>Valoración:</strong> {w.momentos?.valoracion}</p>
                        <p style={{ margin: '0', textAlign: 'justify' }}><strong>Producción:</strong> {w.momentos?.produccion}</p>
                      </td>
                      <td style={previewTdTableStyle}>
                        <p style={{ margin: '0 0 4px 0' }}><strong>Analógicos:</strong> {(w.recursos?.analogicos || []).join(', ')}</p>
                        <p style={{ margin: '0 0 4px 0' }}><strong>Producción:</strong> {(w.recursos?.produccion || []).join(', ')}</p>
                        <p style={{ margin: '0' }}><strong>Vida:</strong> {(w.recursos?.vida || []).join(', ')}</p>
                      </td>
                      <td style={previewTdTableStyle}>
                        <p style={{ margin: '0 0 4px 0' }}><strong>SER:</strong> {w.criteriosEvaluacion?.ser}</p>
                        <p style={{ margin: '0 0 4px 0' }}><strong>SABER:</strong> {w.criteriosEvaluacion?.saber}</p>
                        <p style={{ margin: '0 0 4px 0' }}><strong>HACER:</strong> {w.criteriosEvaluacion?.hacer}</p>
                        <p style={{ margin: '0' }}><strong>DECIDIR:</strong> {w.criteriosEvaluacion?.decidir}</p>
                      </td>
                    </tr>
                  ))}
                  {area.adaptacionesCurriculares && (
                    <tr>
                      <td colSpan="4" style={previewTdTableStyle}>
                        <strong>Adaptaciones Curriculares (Generales):</strong> {area.adaptacionesCurriculares}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {/* Adaptaciones Significativas */}
      {adaptacionesSignificativas && adaptacionesSignificativas.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <h4 style={previewH4Style}>3. ADAPTACIONES CURRICULARES SIGNIFICATIVAS</h4>
          <table style={previewTableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={previewThStyle}>Estudiante</th>
                <th style={previewThStyle}>Dificultad/Discapacidad</th>
                <th style={previewThStyle}>Contenido</th>
                <th style={previewThStyle}>Adaptación Metodológica</th>
                <th style={previewThStyle}>Criterio de Evaluación</th>
              </tr>
            </thead>
            <tbody>
              {adaptacionesSignificativas.map((st, idx) => (
                <tr key={idx}>
                  <td style={previewTdTableStyle}><strong>{st.estudiante}</strong></td>
                  <td style={previewTdTableStyle}>{st.discapacidad}</td>
                  <td style={previewTdTableStyle}>{st.contenido}</td>
                  <td style={previewTdTableStyle}>{st.adaptacion}</td>
                  <td style={previewTdTableStyle}>{st.criterioEvaluacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const previewTdStyle = {
  border: '1px solid #cbd5e1',
  padding: '6px 10px',
  textAlign: 'left'
};

const previewH4Style = {
  fontWeight: 'bold',
  fontSize: '0.9rem',
  color: '#1e3a8a',
  margin: '8px 0',
  textTransform: 'uppercase'
};

const previewTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.78rem'
};

const previewThStyle = {
  border: '1px solid #cbd5e1',
  padding: '6px',
  fontWeight: 'bold',
  textAlign: 'left',
  color: '#334155'
};

const previewTdTableStyle = {
  border: '1px solid #cbd5e1',
  padding: '6px',
  verticalAlign: 'top',
  textAlign: 'left',
  lineHeight: '1.35'
};

// PdcVisualEditor Component
function PdcVisualEditor({ data, onChange }) {
  const [activeTab, setActiveTab] = useState('referencial');

  const updateRef = (field, val) => {
    const updated = {
      ...data,
      datosReferenciales: {
        ...data.datosReferenciales,
        [field]: val
      }
    };
    onChange(updated);
  };

  const updateObjetivo = (val) => {
    onChange({ ...data, objetivoHolisticoNivel: val });
  };

  const updateArea = (areaIdx, field, val) => {
    const newAreas = [...data.estructuraPDC.areas];
    newAreas[areaIdx] = {
      ...newAreas[areaIdx],
      [field]: val
    };
    onChange({
      ...data,
      estructuraPDC: {
        ...data.estructuraPDC,
        areas: newAreas
      }
    });
  };

  const updateWeekMoments = (areaIdx, weekIdx, field, val) => {
    const newAreas = [...data.estructuraPDC.areas];
    const newWeeks = [...newAreas[areaIdx].semanas];
    newWeeks[weekIdx] = {
      ...newWeeks[weekIdx],
      momentos: {
        ...newWeeks[weekIdx].momentos,
        [field]: val
      }
    };
    newAreas[areaIdx] = {
      ...newAreas[areaIdx],
      semanas: newWeeks
    };
    onChange({
      ...data,
      estructuraPDC: {
        ...data.estructuraPDC,
        areas: newAreas
      }
    });
  };

  const updateWeekRecursos = (areaIdx, weekIdx, field, valString) => {
    const newAreas = [...data.estructuraPDC.areas];
    const newWeeks = [...newAreas[areaIdx].semanas];
    newWeeks[weekIdx] = {
      ...newWeeks[weekIdx],
      recursos: {
        ...newWeeks[weekIdx].recursos,
        [field]: valString.split(',').map(s => s.trim())
      }
    };
    newAreas[areaIdx] = {
      ...newAreas[areaIdx],
      semanas: newWeeks
    };
    onChange({
      ...data,
      estructuraPDC: {
        ...data.estructuraPDC,
        areas: newAreas
      }
    });
  };

  const updateWeekCriteria = (areaIdx, weekIdx, field, val) => {
    const newAreas = [...data.estructuraPDC.areas];
    const newWeeks = [...newAreas[areaIdx].semanas];
    newWeeks[weekIdx] = {
      ...newWeeks[weekIdx],
      criteriosEvaluacion: {
        ...newWeeks[weekIdx].criteriosEvaluacion,
        [field]: val
      }
    };
    newAreas[areaIdx] = {
      ...newAreas[areaIdx],
      semanas: newWeeks
    };
    onChange({
      ...data,
      estructuraPDC: {
        ...data.estructuraPDC,
        areas: newAreas
      }
    });
  };

  const updateDirectMoments = (areaIdx, field, val) => {
    const newAreas = [...data.estructuraPDC.areas];
    newAreas[areaIdx] = {
      ...newAreas[areaIdx],
      momentosDirectos: {
        ...newAreas[areaIdx].momentosDirectos,
        [field]: val
      }
    };
    onChange({
      ...data,
      estructuraPDC: {
        ...data.estructuraPDC,
        areas: newAreas
      }
    });
  };

  const updateDirectRecursos = (areaIdx, field, valString) => {
    const newAreas = [...data.estructuraPDC.areas];
    newAreas[areaIdx] = {
      ...newAreas[areaIdx],
      recursosDirectos: {
        ...newAreas[areaIdx].recursosDirectos,
        [field]: valString.split(',').map(s => s.trim())
      }
    };
    onChange({
      ...data,
      estructuraPDC: {
        ...data.estructuraPDC,
        areas: newAreas
      }
    });
  };

  const updateDirectCriteria = (areaIdx, field, val) => {
    const newAreas = [...data.estructuraPDC.areas];
    newAreas[areaIdx] = {
      ...newAreas[areaIdx],
      criteriosDirectos: {
        ...newAreas[areaIdx].criteriosDirectos,
        [field]: val
      }
    };
    onChange({
      ...data,
      estructuraPDC: {
        ...data.estructuraPDC,
        areas: newAreas
      }
    });
  };

  const updateAdaptacionSignificativa = (idx, field, val) => {
    const newSigs = [...data.adaptacionesSignificativas];
    newSigs[idx] = {
      ...newSigs[idx],
      [field]: val
    };
    onChange({
      ...data,
      adaptacionesSignificativas: newSigs
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Tabs de sección */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', paddingBottom: '2px' }}>
        <button type="button" onClick={() => setActiveTab('referencial')} style={tabStyle(activeTab === 'referencial')}>
          1. Datos y Objetivos
        </button>
        <button type="button" onClick={() => setActiveTab('matriz')} style={tabStyle(activeTab === 'matriz')}>
          2. Matriz de Desarrollo
        </button>
        <button type="button" onClick={() => setActiveTab('adaptaciones')} style={tabStyle(activeTab === 'adaptaciones')}>
          3. Adaptaciones Curriculares
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px' }}>
        {activeTab === 'referencial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', margin: '0 0 4px 0' }}>Datos Referenciales del PDC</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Distrito Educativo</label>
                <input type="text" value={data.datosReferenciales.distrito || ''} onChange={(e) => updateRef('distrito', e.target.value)} style={inputStyle} />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Unidad Educativa</label>
                <input type="text" value={data.datosReferenciales.unidadEducativa || ''} onChange={(e) => updateRef('unidadEducativa', e.target.value)} style={inputStyle} />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Maestra/o</label>
                <input type="text" value={data.datosReferenciales.maestro || ''} onChange={(e) => updateRef('maestro', e.target.value)} style={inputStyle} />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Director/a</label>
                <input type="text" value={data.datosReferenciales.director || ''} onChange={(e) => updateRef('director', e.target.value)} style={inputStyle} />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Fecha Inicio</label>
                <input type="date" value={data.datosReferenciales.fechaInicio || ''} onChange={(e) => updateRef('fechaInicio', e.target.value)} style={inputStyle} />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Fecha Fin</label>
                <input type="date" value={data.datosReferenciales.fechaFin || ''} onChange={(e) => updateRef('fechaFin', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ ...inputGroupStyle, marginTop: '8px' }}>
              <label style={labelStyle}>Objetivo Holístico de Nivel / de Aprendizaje</label>
              <textarea rows={3} value={data.objetivoHolisticoNivel || ''} onChange={(e) => updateObjetivo(e.target.value)} style={textareaStyle} />
            </div>
          </div>
        )}

        {activeTab === 'matriz' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
            {(data.estructuraPDC.areas || []).map((area, aIdx) => (
              <div key={aIdx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary)', margin: '0 0 10px 0' }}>Área: {area.nombreArea}</h4>
                
                <div style={{ ...inputGroupStyle, marginBottom: '12px' }}>
                  <label style={labelStyle}>Objetivo de Aprendizaje de la Materia</label>
                  <textarea rows={2} value={area.objetivoAprendizaje || ''} onChange={(e) => updateArea(aIdx, 'objetivoAprendizaje', e.target.value)} style={textareaStyle} />
                </div>

                {data.estructuraPDC.tipo === 'semanal' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                    {(area.semanas || []).map((w, wIdx) => (
                      <div key={wIdx} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', background: 'rgba(0,0,0,0.1)' }}>
                        <h5 style={{ fontWeight: '600', color: 'var(--secondary)', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Semana {w.semana} ({w.periodos} períodos)</h5>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>Práctica</label>
                            <textarea rows={2} value={w.momentos?.practica || ''} onChange={(e) => updateWeekMoments(aIdx, wIdx, 'practica', e.target.value)} style={textareaStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>Teoría</label>
                            <textarea rows={2} value={w.momentos?.teoria || ''} onChange={(e) => updateWeekMoments(aIdx, wIdx, 'teoria', e.target.value)} style={textareaStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>Valoración</label>
                            <textarea rows={2} value={w.momentos?.valoracion || ''} onChange={(e) => updateWeekMoments(aIdx, wIdx, 'valoracion', e.target.value)} style={textareaStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>Producción</label>
                            <textarea rows={2} value={w.momentos?.produccion || ''} onChange={(e) => updateWeekMoments(aIdx, wIdx, 'produccion', e.target.value)} style={textareaStyle} />
                          </div>
                        </div>

                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', margin: '10px 0 4px 0' }}>Recursos (separados por comas)</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>Analógicos</label>
                            <input type="text" value={(w.recursos?.analogicos || []).join(', ')} onChange={(e) => updateWeekRecursos(aIdx, wIdx, 'analogicos', e.target.value)} style={inputStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>Producción de Conocimiento</label>
                            <input type="text" value={(w.recursos?.produccion || []).join(', ')} onChange={(e) => updateWeekRecursos(aIdx, wIdx, 'produccion', e.target.value)} style={inputStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>Vida Diaria</label>
                            <input type="text" value={(w.recursos?.vida || []).join(', ')} onChange={(e) => updateWeekRecursos(aIdx, wIdx, 'vida', e.target.value)} style={inputStyle} />
                          </div>
                        </div>

                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', margin: '10px 0 4px 0' }}>Criterios de Evaluación</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>SER</label>
                            <input type="text" value={w.criteriosEvaluacion?.ser || ''} onChange={(e) => updateWeekCriteria(aIdx, wIdx, 'ser', e.target.value)} style={inputStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>SABER</label>
                            <input type="text" value={w.criteriosEvaluacion?.saber || ''} onChange={(e) => updateWeekCriteria(aIdx, wIdx, 'saber', e.target.value)} style={inputStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>HACER</label>
                            <input type="text" value={w.criteriosEvaluacion?.hacer || ''} onChange={(e) => updateWeekCriteria(aIdx, wIdx, 'hacer', e.target.value)} style={inputStyle} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={subLabelStyle}>DECIDIR</label>
                            <input type="text" value={w.criteriosEvaluacion?.decidir || ''} onChange={(e) => updateWeekCriteria(aIdx, wIdx, 'decidir', e.target.value)} style={inputStyle} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Direct (Inicial)
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--secondary)' }}>Momentos del Proceso Formativo</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Práctica</label>
                        <textarea rows={2} value={area.momentosDirectos?.practica || ''} onChange={(e) => updateDirectMoments(aIdx, 'practica', e.target.value)} style={textareaStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Teoría</label>
                        <textarea rows={2} value={area.momentosDirectos?.teoria || ''} onChange={(e) => updateDirectMoments(aIdx, 'teoria', e.target.value)} style={textareaStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Valoración</label>
                        <textarea rows={2} value={area.momentosDirectos?.valoracion || ''} onChange={(e) => updateDirectMoments(aIdx, 'valoracion', e.target.value)} style={textareaStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Producción</label>
                        <textarea rows={2} value={area.momentosDirectos?.produccion || ''} onChange={(e) => updateDirectMoments(aIdx, 'produccion', e.target.value)} style={textareaStyle} />
                      </div>
                    </div>

                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', margin: '4px 0' }}>Recursos (separados por comas)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Analógicos</label>
                        <input type="text" value={(area.recursosDirectos?.analogicos || []).join(', ')} onChange={(e) => updateDirectRecursos(aIdx, 'analogicos', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>De Producción</label>
                        <input type="text" value={(area.recursosDirectos?.produccion || []).join(', ')} onChange={(e) => updateDirectRecursos(aIdx, 'produccion', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Vida Diaria</label>
                        <input type="text" value={(area.recursosDirectos?.vida || []).join(', ')} onChange={(e) => updateDirectRecursos(aIdx, 'vida', e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', margin: '4px 0' }}>Criterios de Evaluación</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>SER</label>
                        <input type="text" value={area.criteriosDirectos?.ser || ''} onChange={(e) => updateDirectCriteria(aIdx, 'ser', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>SABER</label>
                        <input type="text" value={area.criteriosDirectos?.saber || ''} onChange={(e) => updateDirectCriteria(aIdx, 'saber', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>HACER</label>
                        <input type="text" value={area.criteriosDirectos?.hacer || ''} onChange={(e) => updateDirectCriteria(aIdx, 'hacer', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>DECIDIR</label>
                        <input type="text" value={area.criteriosDirectos?.decidir || ''} onChange={(e) => updateDirectCriteria(aIdx, 'decidir', e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'adaptaciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '55vh', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>Adaptaciones Metodológicas Generales</h4>
            {(data.estructuraPDC.areas || []).map((area, aIdx) => (
              <div key={aIdx} style={inputGroupStyle}>
                <label style={labelStyle}>Adaptación en {area.nombreArea}</label>
                <textarea rows={2} value={area.adaptacionesCurriculares || ''} onChange={(e) => updateArea(aIdx, 'adaptacionesCurriculares', e.target.value)} style={textareaStyle} />
              </div>
            ))}

            {data.adaptacionesSignificativas && data.adaptacionesSignificativas.length > 0 && (
              <>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', marginTop: '8px' }}>Adaptaciones Curriculares Significativas</h4>
                {data.adaptacionesSignificativas.map((st, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)' }}>{st.estudiante}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Dificultad/Discapacidad</label>
                        <input type="text" value={st.discapacidad || ''} onChange={(e) => updateAdaptacionSignificativa(idx, 'discapacidad', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={subLabelStyle}>Contenido Adaptado</label>
                        <input type="text" value={st.contenido || ''} onChange={(e) => updateAdaptacionSignificativa(idx, 'contenido', e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={subLabelStyle}>Estrategia de Adaptación</label>
                      <textarea rows={2} value={st.adaptacion || ''} onChange={(e) => updateAdaptacionSignificativa(idx, 'adaptacion', e.target.value)} style={textareaStyle} />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={subLabelStyle}>Criterio de Evaluación Adaptado</label>
                      <input type="text" value={st.criterioEvaluacion || ''} onChange={(e) => updateAdaptacionSignificativa(idx, 'criterioEvaluacion', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Visual Editor Helper styles
const tabStyle = (active) => ({
  flex: 1,
  padding: '6px 12px',
  background: active ? 'var(--primary-glow)' : 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '0.78rem',
  transition: 'all 0.2s',
  textAlign: 'center'
});

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '3px'
};

const labelStyle = {
  fontSize: '0.78rem',
  fontWeight: '600',
  color: 'var(--text-secondary)'
};

const subLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: '500',
  color: 'var(--text-muted)'
};

const inputStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '0.8rem'
};

const textareaStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  resize: 'vertical',
  lineHeight: '1.3'
};
