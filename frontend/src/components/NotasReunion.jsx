import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import styles from './NotasReunion.module.css';

// Helper para fecha relativa amigable
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Hace un momento';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} hr`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const PAGE_SIZE = 5;

export default function NotasReunion({ clienteId }) {
  const { execute, loading } = useApi();
  const [notas, setNotas] = useState([]);
  
  // Estados UI
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  
  // Estados Formulario
  const [nuevaNota, setNuevaNota] = useState('');
  const [nuevaNotaSensible, setNuevaNotaSensible] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const fetchNotas = useCallback(async () => {
    try {
      const data = await execute(`/api/notas/${clienteId}`);
      if (data) {
        setNotas(data);
      }
    } catch (err) {
      console.error("Error al obtener notas", err);
    }
  }, [clienteId, execute]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotas();
  }, [fetchNotas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaNota.trim() && !nuevaNotaSensible.trim()) {
      setErrorSubmit("Debes proveer contenido para la nota.");
      return;
    }
    setErrorSubmit(null);
    setSubmitting(true);
    
    try {
      const res = await execute('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          cliente_id: clienteId,
          contenido: nuevaNota.trim() || null,
          contenido_sensible: nuevaNotaSensible.trim() || null
        }
      });
      
      if (res) {
        setNotas(prev => [res, ...prev]);
        setNuevaNota('');
        setNuevaNotaSensible('');
        setShowForm(false);
        setPage(1); // Volver a la página 1 para ver la nota recién agregada
      }
    } catch {
      setErrorSubmit("Ocurrió un error al guardar la nota.");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return 'U';
    const parts = nameOrEmail.split(/[\s.@]+/);
    if (parts.length > 1 && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  };

  // Paginación en cliente
  const totalPages = Math.ceil(notas.length / PAGE_SIZE) || 1;
  const paginatedNotas = notas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Historial de Reuniones y Acuerdos</h2>
        <button 
          className={`${styles.btnAdd} ${showForm ? styles.btnAddCancel : ''}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cerrar Formulario' : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Agregar Acuerdo
            </>
          )}
        </button>
      </div>
      
      {/* Formulario Inline (Ocultable) */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Acuerdos Generales</label>
            <textarea 
              className={styles.textarea}
              value={nuevaNota}
              onChange={(e) => setNuevaNota(e.target.value)}
              placeholder="Escribe los acuerdos o detalles generales de la reunión aquí..."
              disabled={submitting}
            />
          </div>
          
          <div className={styles.inputGroupSensible}>
            <label className={styles.labelSensible}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Información Restringida (Protección Nivel Superior)
            </label>
            <textarea 
              className={styles.textareaSensible}
              value={nuevaNotaSensible}
              onChange={(e) => setNuevaNotaSensible(e.target.value)}
              placeholder="Datos sensibles de salud, estrategias corporativas privadas o finanzas..."
              disabled={submitting}
            />
          </div>

          {errorSubmit && <p className={styles.errorText}>{errorSubmit}</p>}
          
          <button type="submit" className={styles.btnSubmit} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar Acuerdo'}
          </button>
        </form>
      )}

      {/* Lista de notas (Oculta si el formulario está abierto) */}
      {!showForm && (
        <>
          <div className={styles.listContainer}>
            {loading && notas.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.loadingText}>Cargando historial...</p>
              </div>
            ) : notas.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={styles.emptyIcon}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p className={styles.emptyText}>No hay acuerdos ni reuniones registradas aún.<br/>Sé el primero en agregar información valiosa.</p>
              </div>
            ) : (
              paginatedNotas.map((nota) => (
                <div key={nota.id} className={styles.notaCard}>
                  <div className={styles.notaHeader}>
                    <div className={styles.authorSection}>
                      <div className={styles.avatar}>
                        {getInitials(nota.autor_nombre !== 'Usuario Desconocido' ? nota.autor_nombre : nota.autor_email)}
                      </div>
                      <div className={styles.authorMeta}>
                        <span className={styles.notaAuthor}>
                          {nota.autor_nombre !== 'Usuario Desconocido' ? nota.autor_nombre : nota.autor_email}
                        </span>
                        <span className={styles.notaEmail}>
                          {nota.autor_email !== nota.autor_nombre ? nota.autor_email : ''}
                        </span>
                      </div>
                    </div>
                    <span className={styles.notaDate} title={new Date(nota.created_at).toLocaleString()}>
                      {getRelativeTime(nota.created_at)}
                    </span>
                  </div>
                  
                  {nota.contenido && (
                    <div className={styles.notaContent}>
                      {nota.contenido}
                    </div>
                  )}
                  
                  {nota.contenido_sensible && (
                    <div className={styles.notaContentSensible}>
                      <div className={styles.sensibleBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Dato Protegido
                      </div>
                      <p>{nota.contenido_sensible}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Paginación */}
          {notas.length > PAGE_SIZE && (
            <div className={styles.pagination}>
              <button 
                className={styles.btnPage} 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
              <button 
                className={styles.btnPage} 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
