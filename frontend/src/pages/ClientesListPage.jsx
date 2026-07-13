import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import ErrorNotification from '../components/ErrorNotification';
import styles from './ClientesListPage.module.css';

export default function ClientesListPage() {
  const { role } = useAuth();
  const { execute, loading, error, clearError } = useApi();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const pageSize = 10;

  // Debounce para la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);


  const fetchClientes = useCallback(async () => {
    try {
      let url = `/api/clientes?page=${page}&page_size=${pageSize}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (filtroTipo) url += `&tipo=${encodeURIComponent(filtroTipo)}`;
      
      const data = await execute(url);
      
      if (data && data.items) {
        setClientes(data.items);
        setTotal(data.total);
      }
    } catch {
      // Manejado por useApi / ErrorNotification
    }
  }, [execute, page, pageSize, debouncedSearch, filtroTipo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClientes();
  }, [fetchClientes]);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Evitar navegar al detalle
    if (!window.confirm("¿Eliminar este cliente de forma permanente?")) return;
    
    try {
      await execute(`/api/clientes/${id}`, { method: 'DELETE' });
      fetchClientes();
    } catch {
      // Manejado por useApi
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de clientes</h1>
          <p className={styles.subtitle}>
            Listado de clientes registrados en el sistema ({total} en total)
          </p>
        </div>
        <button 
          className={styles.btnPrimary} 
          onClick={() => navigate('/clientes/nuevo')}
        >
          + Nuevo Cliente
        </button>
      </div>

      <ErrorNotification 
        error={error} 
        onDismiss={clearError} 
      />

      <div className={styles.controls}>
        <input 
          type="text" 
          placeholder="Buscar por nombre..." 
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
        />
        <select 
          className={styles.filterSelect}
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
        >
          <option value="">Todos los tipos</option>
          <option value="contable">Contable</option>
          <option value="medico">Médico</option>
          <option value="marketing">Marketing</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading && clientes.length === 0 ? (
          <div className={styles.loading}>Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron clientes con estos criterios.</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Fecha de creación</th>
                  {role === 'admin' && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr 
                    key={cliente.id} 
                    className={styles.row}
                    onClick={() => navigate(`/clientes/${cliente.id}`)}
                  >
                    <td style={{ fontWeight: 500 }}>{cliente.nombre}</td>
                    <td>{cliente.email || '-'}</td>
                    <td>{cliente.telefono || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(cliente.tipo)}`}>
                        {cliente.tipo.charAt(0).toUpperCase() + cliente.tipo.slice(1)}
                      </span>
                    </td>
                    <td>{new Date(cliente.created_at).toLocaleDateString('es-ES')}</td>
                    {role === 'admin' && (
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className={styles.btnDelete}
                          onClick={(e) => handleDelete(e, cliente.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                Página {page} de {totalPages}
              </div>
              <div className={styles.pageControls}>
                <button 
                  className={styles.btnPage} 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button 
                  className={styles.btnPage} 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
