import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import ErrorNotification from '../components/ErrorNotification';
import TareaFormModal from '../components/TareaFormModal';
import styles from './TareasListPage.module.css';

// SVG Icons as components to match the design
const CheckSquareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default function TareasListPage() {
  const { role, user } = useAuth();
  const { execute, loading, error, clearError } = useApi();

  const [tareas, setTareas] = useState([]);
  const [clientesMap, setClientesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);

  // Estado del Dropdown de acciones
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  const pageSize = 10;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Cargar diccionarios para nombres de clientes y usuarios
  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        const clientesData = await execute('/api/clientes?page_size=100');
        if (clientesData && clientesData.items) {
          const cMap = {};
          clientesData.items.forEach(c => cMap[c.id] = c.nombre);
          setClientesMap(cMap);
        }
        
        if (role === 'admin') {
          const usersData = await execute('/api/admin/users');
          if (usersData && usersData.users) {
            const uMap = {};
            usersData.users.forEach(u => uMap[u.id] = u.nombre_completo || u.email);
            setUsersMap(uMap);
          }
        }
      } catch {
        // Ignorar errores de carga de diccionarios
      }
    };
    fetchDictionaries();
  }, [execute, role]);

  const fetchTareas = useCallback(async () => {
    try {
      let url = `/api/tareas?page=${page}&page_size=${pageSize}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (filtroEstado) url += `&estado=${filtroEstado}`;
      if (filtroPrioridad) url += `&prioridad=${filtroPrioridad}`;
      if (filtroResponsable) url += `&asignado_a=${filtroResponsable}`;
      
      const data = await execute(url);
      
      if (data && data.items) {
        setTareas(data.items);
        setTotal(data.total);
      }
    } catch {
      // Manejado globalmente
    }
  }, [execute, page, pageSize, filtroEstado, filtroPrioridad, filtroResponsable, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTareas();
  }, [fetchTareas]);

  const openNewModal = () => {
    setCurrentEditId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e, id) => {
    e.stopPropagation();
    setDropdownOpenId(null);
    setCurrentEditId(id);
    setIsModalOpen(true);
  };

  const toggleDropdown = (e, id) => {
    e.stopPropagation();
    setDropdownOpenId(prev => prev === id ? null : id);
  };

  const handleMarkCompleted = async (e, id) => {
    e.stopPropagation();
    setDropdownOpenId(null);
    try {
      await execute(`/api/tareas/${id}`, {
        method: 'PUT',
        body: { estado: 'completada' }
      });
      fetchTareas();
    } catch {
      // Manejado por useApi
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDropdownOpenId(null);
    if (!window.confirm('¿Eliminar esta tarea de forma permanente?')) return;
    try {
      await execute(`/api/tareas/${id}`, { method: 'DELETE' });
      fetchTareas();
    } catch {
      // Manejado por useApi
    }
  };

  // Funciones de parseo de UI
  const formatId = (id) => `T-${id.substring(0, 4).toUpperCase()}`;
  
  const getBadgePrioridad = (prio) => {
    const p = prio?.toLowerCase() || 'media';
    return `${styles.badgePrioridad} ${styles[`prioridad-${p}`]}`;
  };
  
  const getBadgeEstado = (est) => {
    const e = est?.toLowerCase() || 'pendiente';
    return `${styles.badgeEstado} ${styles[`estado-${e}`]}`;
  };
  
  const formatEstado = (est) => {
    if (est === 'en_progreso') return 'En Progreso';
    if (est === 'completada') return 'Completada';
    return 'Pendiente';
  };
  
  const formatPrioridad = (prio) => {
    return prio ? prio.charAt(0).toUpperCase() + prio.slice(1) : 'Media';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1><span className={styles.titleIcon}><CheckSquareIcon /></span> Tareas</h1>
          <p>{total} de {total} tareas · filtros y acciones auditadas</p>
        </div>
        <button className={styles.btnPrimary} onClick={openNewModal}>
          + Nueva tarea
        </button>
      </div>

      <div className={styles.alertBox}>
        <span className={styles.alertIcon}><LockIcon /></span>
        <span>
          <span className={styles.strong}>RBAC activo</span> · Sesión como <span className={styles.strong}>{user?.email}</span> ({role === 'admin' ? 'Administrador' : 'Empleado'}). Ves {role === 'admin' ? 'todas las tareas del tenant.' : 'las tareas correspondientes a tu rol.'}
        </span>
      </div>

      <ErrorNotification error={error} onDismiss={clearError} />

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input 
            type="text" 
            placeholder="Buscar por título, cliente o ID..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
        
        <select 
          className={styles.selectInput}
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completada">Completada</option>
        </select>

        <select 
          className={styles.selectInput}
          value={filtroPrioridad}
          onChange={(e) => { setFiltroPrioridad(e.target.value); setPage(1); }}
        >
          <option value="">Toda prioridad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        <select 
          className={styles.selectInput}
          value={filtroResponsable}
          onChange={(e) => { setFiltroResponsable(e.target.value); setPage(1); }}
        >
          <option value="">Todos los responsables</option>
          {Object.entries(usersMap).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading && tareas.length === 0 ? (
          <div className={styles.loading}>Cargando tareas...</div>
        ) : tareas.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron tareas con estos filtros.</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tarea</th>
                  <th>Cliente</th>
                  <th>Responsable</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Vence</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map(t => (
                  <tr key={t.id}>
                    <td className={styles.tareaId}>{formatId(t.id)}</td>
                    <td>
                      <div className={styles.tareaTitle}>{t.titulo}</div>
                      {t.descripcion && <div className={styles.tareaDesc}>{t.descripcion}</div>}
                    </td>
                    <td>{clientesMap[t.cliente_id] || '-'}</td>
                    <td>{usersMap[t.asignado_a] || t.asignado_a?.substring(0,8) || 'Sin asignar'}</td>
                    <td>
                      <span className={getBadgePrioridad(t.prioridad)}>
                        {formatPrioridad(t.prioridad)}
                      </span>
                    </td>
                    <td>
                      <span className={getBadgeEstado(t.estado)}>
                        {formatEstado(t.estado)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.vence}>
                        <CalendarIcon />
                        {formatDate(t.fecha_limite)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionsWrapper}>
                        <button className={styles.actions} onClick={(e) => toggleDropdown(e, t.id)}>
                          ...
                        </button>
                        {dropdownOpenId === t.id && (
                          <div className={styles.dropdownMenu}>
                            <button className={styles.dropdownItem} onClick={(e) => openEditModal(e, t.id)}>
                              <PencilIcon /> Editar
                            </button>
                            <button className={styles.dropdownItem} onClick={(e) => handleMarkCompleted(e, t.id)}>
                              <CheckCircleIcon /> Marcar completada
                            </button>
                            {role === 'admin' && (
                              <button className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`} onClick={(e) => handleDelete(e, t.id)}>
                                <TrashIcon /> Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                Página {page} de {totalPages} · {total} resultados
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

      <TareaFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTareas();
        }}
        tareaId={currentEditId}
      />
    </div>
  );
}
