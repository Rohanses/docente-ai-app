import React, { useState, useEffect } from 'react';
import { Users, FileText, Download, Coins, ArrowUpRight, Search, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function AdminPanel() {
  const [stats, setStats] = useState({ totalTeachers: 0, totalGenerations: 0, totalDownloads: 0, activeCredits: 0 });
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal / Form state para créditos
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState(10);
  const [creditReason, setCreditReason] = useState('Recarga mensual de cortesía');
  const [updatingUser, setUpdatingUser] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsData = await api.getAdminStats();
      const usersData = await api.getAdminUsers();
      const transData = await api.getAdminTransactions();
      
      setStats(statsData);
      setUsers(usersData);
      setTransactions(transData);
    } catch (e) {
      setError('Error al recuperar información de administración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantCredits = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setUpdatingUser(true);
    try {
      await api.addAdminCredits(selectedUser.id, creditAmount, creditReason);
      setSelectedUser(null);
      setCreditAmount(10);
      setCreditReason('Recarga mensual de cortesía');
      // Recargar datos
      fetchData();
    } catch (err) {
      alert(err.message || 'Error al actualizar créditos.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Panel de Control del Administrador</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Estadísticas globales, auditoría de transacciones y administración de créditos de docentes.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchData} disabled={loading} style={{ padding: '8px 14px' }}>
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
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '14px', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Docentes Activos</span>
            <h4 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{stats.totalTeachers}</h4>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--secondary)', padding: '14px', borderRadius: '12px' }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>PDCs y Evaluaciones</span>
            <h4 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{stats.totalGenerations}</h4>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(234, 88, 12, 0.1)', color: 'var(--accent)', padding: '14px', borderRadius: '12px' }}>
            <Download size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Descargas Totales</span>
            <h4 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{stats.totalDownloads}</h4>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', padding: '14px', borderRadius: '12px' }}>
            <Coins size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Créditos en Circulación</span>
            <h4 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{stats.activeCredits}</h4>
          </div>
        </div>
      </div>

      {/* Grid: Usuarios y Transacciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Tabla de Usuarios */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Gestión de Docentes</h3>
            
            {/* Buscador */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 8px 8px 32px',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Docente / Correo</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Nivel</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Rol</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Créditos</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No se encontraron docentes registrados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {(u.nivel || 'General').replace('Educación ', '')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          background: u.role === 'admin' ? 'rgba(37,99,235,0.1)' : 'rgba(5,150,109,0.1)',
                          color: u.role === 'admin' ? 'var(--primary)' : 'var(--secondary)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {u.role === 'admin' ? '∞' : u.credits}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {u.role !== 'admin' && (
                          <button
                            className="btn btn-outline"
                            onClick={() => setSelectedUser(u)}
                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', gap: '4px' }}
                          >
                            <PlusCircle size={12} /> Cargar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de Transacciones */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Registro de Créditos</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.85rem' }}>
                No hay transacciones registradas.
              </div>
            ) : (
              transactions.map(t => (
                <div key={t.id} style={{
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={t.userEmail}>
                      {t.userEmail}
                    </span>
                    <span style={{
                      fontWeight: 'bold',
                      color: t.type === 'add' ? 'var(--secondary)' : 'var(--accent)'
                    }}>
                      {t.type === 'add' ? '+' : '-'}{t.amount} cr
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{t.description}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {formatDate(t.date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal / Formulario de Carga */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Cargar Créditos</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Asignar créditos a: <strong>{selectedUser.name}</strong> ({selectedUser.email})
              </p>
            </div>

            <form onSubmit={handleGrantCredits} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Cantidad de Créditos</label>
                <input
                  type="number"
                  min={-100}
                  max={500}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value))}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)'
                  }}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Puedes usar valores negativos para descontar.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Razón / Descripción</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedUser(null)}
                  disabled={updatingUser}
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingUser}
                  style={{ padding: '8px 20px' }}
                >
                  {updatingUser ? 'Guardando...' : 'Aplicar Carga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
