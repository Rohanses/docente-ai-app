import React, { useState, useEffect } from 'react';
import { Trash2, FileText, Download, Copy, Printer, Calendar, RefreshCw, Eye } from 'lucide-react';
import api from '../utils/api';
import { exportToWord, copyAsRichText, printDocument, jsonToMarkdown } from '../utils/exportUtils';

export default function History({ currentUser, refreshCredits }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (e) {
      console.error('Error cargando historial:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento del historial?')) return;
    try {
      await api.deleteHistoryItem(id);
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
      fetchHistory();
    } catch (e) {
      alert('Error al eliminar elemento.');
    }
  };

  const handleCopy = async (content) => {
    const success = await copyAsRichText(content);
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
      alert('Créditos insuficientes para descargar. Por favor, solicita más créditos a tu administrador.');
      return;
    }

    try {
      const desc = `Exportación (${actionType}) desde historial de: ${selectedItem?.title || 'Documento'}`;
      await api.consumeCredit(1, desc);
      await refreshCredits();
      actionCallback();
    } catch (err) {
      alert(err.message || 'Error al cobrar créditos.');
    }
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Historial de Documentos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Visualiza, edita o exporta las planificaciones y evaluaciones creadas anteriormente.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchHistory} disabled={loading} style={{ padding: '8px 14px' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '350px 1fr' : '1fr', gap: '24px', transition: 'all 0.3s ease' }}>
        
        {/* Lista de Historial */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '75vh', overflowY: 'auto' }}>
          {loading && history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Cargando historial...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              No hay documentos guardados en el historial. ¡Comienza generando un PDC!
            </div>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: selectedItem && selectedItem.id === item.id ? 'var(--primary-glow)' : 'var(--bg-secondary)',
                  border: selectedItem && selectedItem.id === item.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: item.type === 'pdc' ? 'rgba(37,99,235,0.1)' : item.type === 'evaluation' ? 'rgba(5,150,109,0.1)' : 'rgba(234,88,12,0.1)',
                    color: item.type === 'pdc' ? 'var(--primary)' : item.type === 'evaluation' ? 'var(--secondary)' : 'var(--accent)',
                    textTransform: 'uppercase'
                  }}>
                    {item.type}
                  </span>
                  
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      padding: '4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  {item.title}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Calendar size={12} /> {formatDate(item.date)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Visualizador de Detalle */}
        {selectedItem && (
          <div className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{selectedItem.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generado el {formatDate(selectedItem.date)}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => handleExportAction('Copiado', () => handleCopy(selectedItem.content))} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Copy size={15} /> {copySuccess ? '¡Copiado!' : 'Copiar formato'}
                </button>
                <button className="btn btn-outline" onClick={() => handleExportAction('Impresión/PDF', () => printDocument(selectedItem.title, selectedItem.content))} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Printer size={15} /> Imprimir / PDF
                </button>
                <button className="btn btn-secondary" onClick={() => handleExportAction('Descarga Word', () => exportToWord(selectedItem.content, selectedItem.title))} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Download size={15} /> Exportar Word
                </button>
              </div>
            </div>

            {/* Contenedor de Previsualización */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '24px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              lineHeight: '1.5'
            }}>
              {(() => {
                try {
                  const parsed = JSON.parse(selectedItem.content);
                  return jsonToMarkdown(parsed);
                } catch (e) {
                  return selectedItem.content;
                }
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
