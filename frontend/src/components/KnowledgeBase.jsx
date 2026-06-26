import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState({ official: [], user: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (e) {
      setError('No se pudieron recuperar los documentos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'txt' && ext !== 'md') {
      setError('Solo se admiten archivos .txt o .md en esta versión.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadSuccess('');

    try {
      await api.uploadDocument(file);
      setUploadSuccess(`¡Archivo "${file.name}" subido e integrado con éxito!`);
      fetchDocs();
    } catch (err) {
      setError(err.message || 'Error al subir el archivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el documento "${name}"?`)) return;
    
    setError('');
    try {
      await api.deleteDocument(name);
      fetchDocs();
    } catch (err) {
      setError('No se pudo eliminar el archivo.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Base de Conocimientos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Gestiona la documentación base y personalizada que estudia la IA para guiar sus planificaciones.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchDocs} disabled={loading} style={{ padding: '8px 14px' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
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
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {uploadSuccess && (
        <div style={{
          background: 'rgba(5, 150, 105, 0.1)',
          border: '1px solid var(--secondary)',
          color: 'var(--secondary)',
          padding: '12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} /> {uploadSuccess}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Documentación del Usuario (PSP, Metodologías locales, etc.) */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--accent)' }} /> Mis Documentos (Locales)
            </h3>
            
            <label className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <Upload size={16} /> Subir PSP/Pauta
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Sube el Proyecto Socioproductivo (PSP) de tu escuela o lineamientos específicos en archivos .txt o .md. Serán inyectados en el contexto al generar planificaciones.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {documents.user.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 10px',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px'
              }}>
                No has subido ningún documento aún. Sube tu PSP para guiar a la IA.
              </div>
            ) : (
              documents.user.map(doc => (
                <div key={doc.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.name)}
                    style={{
                      background: 'transparent',
                      color: '#ef4444',
                      padding: '4px',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    title="Eliminar documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Documentación Curricular Base (Pre-cargada) */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Currículo Base y Programas
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Leyes, resoluciones y currículos oficiales del Ministerio de Educación de Bolivia pre-cargados que la IA utiliza para alinear los contenidos y perfiles de salida oficiales.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {documents.official.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                Recuperando archivos oficiales del servidor...
              </div>
            ) : (
              documents.official.map(doc => (
                <div key={doc.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}>
                  <BookOpen size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.name}>
                    {doc.name.replace('.md', '').replace(/-/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
