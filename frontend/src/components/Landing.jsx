import React from 'react';
import { BookOpen, Sparkles, FileText, CheckSquare, Upload, ArrowRight, Shield } from 'lucide-react';

export default function Landing({ onEnterApp, theme }) {
  return (
    <div className="landing-container animate-fade-in" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'var(--transition-smooth)',
      padding: '0 24px'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 0',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={24} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.025em' }}>
            AVELINO<span className="gradient-text" style={{ fontWeight: '800' }}>.IA</span>
          </span>
        </div>
        <button className="btn btn-outline" onClick={onEnterApp} style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
          Entrar a la Consola
        </button>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '80px auto 40px auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--border-color)',
          padding: '6px 14px',
          borderRadius: '30px',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}>
          <span style={{ color: 'var(--secondary)' }}>●</span> Adaptado al Modelo MESCP (Ley 070) de Bolivia
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          lineHeight: '1.15',
          letterSpacing: '-0.03em',
          maxWidth: '850px',
          margin: '0 auto'
        }}>
          Transforma tu Labor Docente con Inteligencia Artificial <span className="gradient-text">Vanguardista</span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '650px',
          lineHeight: '1.6',
          margin: '0 auto'
        }}>
          Genera planificaciones de desarrollo curricular (PDCs), evaluaciones precisas y fichas de autoevaluación adaptadas a los contenidos oficiales del Ministerio de Educación de Bolivia y pedagogías innovadoras globales.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button className="btn btn-primary" onClick={onEnterApp} style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
            Empezar Ahora <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Feature grid */}
      <section style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '60px auto 100px auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {/* Card 1 */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(37, 99, 235, 0.1)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Planificador PDC (MESCP)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Genera Planes de Desarrollo Curricular completos con objetivos holísticos, momentos metodológicos (Práctica-Teoría-Valoración-Producción) y criterios evaluativos por dimensiones.
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(5, 150, 105, 0.1)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Evaluaciones y Rúbricas</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Crea cuestionarios de opción múltiple, preguntas abiertas de razonamiento crítico o rúbricas de evaluación detalladas por dimensiones listas para descargar.
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(234, 88, 12, 0.1)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckSquare size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Autoevaluaciones</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Diseña fichas didácticas que incentivan el análisis reflexivo y metacognición en las dimensiones de valores (SER) y compromisos prácticos (DECIDIR).
          </p>
        </div>

        {/* Card 4 */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.1)',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Upload size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Base de Datos Inteligente</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Sube tu PSP escolar, planes anuales locales o metodologías innovadoras específicas y permite que la IA las estudie y las aplique al generar tus archivos.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '30px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        <span>© 2026 Avelino.IA. Diseñado con altos estándares estéticos para la educación de vanguardia.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} /> Datos locales y procesamiento seguro.
        </div>
      </footer>
    </div>
  );
}
