import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import styles from './ClienteDetailPage.module.css';
import NotasReunion from '../components/NotasReunion';

export default function ClienteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { execute, loading, error, clearError } = useApi();

  const [cliente, setCliente] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  const fetchCliente = useCallback(async () => {
    try {
      const data = await execute(`/api/clientes/${id}`);
      setCliente(data);
    } catch {
      // Error manejado por useApi
    }
  }, [execute, id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCliente();
  }, [fetchCliente]);

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente? Esta acción es irreversible.")) {
      return;
    }
    
    try {
      await execute(`/api/clientes/${id}`, { method: 'DELETE' });
      navigate('/clientes');
    } catch {
      // Error manejado por useApi
    }
  };

  const getBadgeClass = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'contable': return styles.badgeContable;
      case 'medico': return styles.badgeMedico;
      case 'marketing': return styles.badgeMarketing;
      default: return '';
    }
  };

  if (loading && !cliente) {
    return <div className={styles.loading}>Cargando información del cliente...</div>;
  }

  if (error && error.status === 404) {
    return (
      <div className={styles.errorState}>
        <h2 className={styles.errorTitle}>Cliente no encontrado</h2>
        <button className={styles.btnBack} onClick={() => { clearError(); navigate('/clientes'); }}>
          Volver al listado
        </button>
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{cliente.nombre}</h1>
          <p className={styles.subtitle}>ID: {cliente.id}</p>
        </div>
        <div className={styles.actions}>
          <button className={`${styles.btnAction} ${styles.btnBack}`} onClick={() => navigate('/clientes')}>
            Volver
          </button>
          <button className={`${styles.btnAction} ${styles.btnEdit}`} onClick={() => navigate(`/clientes/${id}/editar`)}>
            Editar
          </button>
          {role === 'admin' && (
            <button className={`${styles.btnAction} ${styles.btnDelete}`} onClick={handleDelete}>
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className={styles.tabs}>
        <button 
          className={activeTab === 'info' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('info')}
        >
          Información del Cliente
        </button>
        <button 
          className={activeTab === 'notas' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('notas')}
        >
          Historial de Reuniones
        </button>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'info' && (
        <div className={styles.card}>
          <div className={styles.cardSection}>
            <h2 className={styles.sectionTitle}>Información de Contacto</h2>
            <div className={styles.gridInfo}>
              <div className={styles.infoGroup}>
                <span className={styles.label}>Correo Electrónico</span>
                <span className={styles.value}>{cliente.email || 'No especificado'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>Teléfono</span>
                <span className={styles.value}>{cliente.telefono || 'No especificado'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>Tipo de Cliente</span>
                <span className={styles.value}>
                  <span className={`${styles.badge} ${getBadgeClass(cliente.tipo)}`}>
                    {cliente.tipo.charAt(0).toUpperCase() + cliente.tipo.slice(1)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className={styles.cardSection}>
            <h2 className={styles.sectionTitle}>Metadatos</h2>
            <div className={styles.gridInfo}>
              <div className={styles.infoGroup}>
                <span className={styles.label}>Creado el</span>
                <span className={styles.value}>{new Date(cliente.created_at).toLocaleString('es-ES')}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>Última actualización</span>
                <span className={styles.value}>{new Date(cliente.updated_at).toLocaleString('es-ES')}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>ID de Creador</span>
                <span className={styles.value} style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                  {cliente.created_by || 'Sistema'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'notas' && (
        <NotasReunion clienteId={id} />
      )}
    </div>
  );
}
