import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import ErrorNotification from "../components/ErrorNotification";
import styles from "./AdminUsersPage.module.css";


export default function AdminUsersPage() {
  const { execute, loading, error, clearError } = useApi();
  const { user: authUser } = useAuth(); // Para identificar "Vos"
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = useCallback(async (currentPage) => {
    try {
      const data = await execute(`/api/admin/users?page=${currentPage}&page_size=${pageSize}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      // Manejado por useApi / ErrorNotification
    }
  }, [execute, pageSize]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const handleNextPage = () => { if (page * pageSize < total) setPage(page + 1); };
  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };

  // Handlers
  const handleNewUser = () => alert("Nuevo Usuario - En desarrollo (Tarea 3.4)");
  const handleActionsClick = (user) => alert(`Acciones para ${user.email} - En desarrollo (Tarea 3.4)`);

  // Métricas derivadas (Mock para las que no devuelve el backend aún)
  const adminsCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);

  // Utilidad para colores de avatar
  const getAvatarColor = (name) => {
    const char = name ? name.charAt(0).toUpperCase() : 'A';
    if (['A','E','I','O','U'].includes(char)) return styles.avatarBlue;
    if (['M','N','P','Q','R'].includes(char)) return styles.avatarPink;
    if (['S','T','V','W','X'].includes(char)) return styles.avatarGreen;
    if (['B','C','D','F','G'].includes(char)) return styles.avatarCyan;
    return styles.avatarRed;
  };

  const getInitials = (name) => {
    if (!name) return 'SN';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.pageContainer}>
      <ErrorNotification error={error} onDismiss={clearError} />

      {/* Header */}
      <div className={styles.overline}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg className={styles.overlineIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <span>Sólo administradores · Tenant {authUser?.tenantName || 'Fernández & Asoc.'}</span>
      </div>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Gestión de usuarios</h1>
          <p className={styles.subtitle}>Invitá miembros, ajustá roles (RBAC) y controlá accesos al tenant.</p>
        </div>
        <button className={styles.inviteBtn} onClick={handleNewUser}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Miembros</span>
            <span className={styles.metricValue}>{total}</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconBlue}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Administradores</span>
            <span className={styles.metricValue}>{adminsCount || 1}</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconPurple}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Invitaciones pendientes</span>
            <span className={styles.metricValue}>1</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconOrange}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Con MFA activo</span>
            <span className={styles.metricValue}>3/5</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconGreen}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className={styles.filtersRow}>
        <div className={styles.searchInputWrapper}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" className={styles.searchInput} placeholder="Buscar por nombre o correo..." />
        </div>
        
        <button className={styles.filterSelect}>
          Todos los roles
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        
        <button className={styles.filterSelect}>
          Todos los estados
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        
        <button className={styles.filterSelect}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Más
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No hay usuarios</td></tr>
            ) : (
              users.map(user => {
                const isMe = authUser && authUser.user_id === user.id;
                
                return (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={`${styles.avatar} ${getAvatarColor(user.nombre_completo)}`}>
                          {getInitials(user.nombre_completo)}
                        </div>
                        <div className={styles.userInfo}>
                          <div className={styles.userNameRow}>
                            <span className={styles.userName}>{user.nombre_completo || "Sin Nombre"}</span>
                            {isMe && <span className={styles.youBadge}>Tú</span>}
                          </div>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button className={styles.rolePill} onClick={() => handleActionsClick(user)}>
                        {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.activo ? styles.statusActive : styles.statusInactive}`}>
                        <div className={styles.statusDot}></div>
                        {user.activo ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className={styles.actionBtn} onClick={() => handleActionsClick(user)} title="Opciones">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="19" cy="12" r="1"></circle>
                          <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {total > pageSize && (
          <div className={styles.paginationRow}>
            <span className={styles.paginationText}>
              Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} de {total} usuarios
            </span>
            <div className={styles.paginationControls}>
              <button className={styles.pageBtn} onClick={handlePrevPage} disabled={page === 1}>
                Anterior
              </button>
              <button className={styles.pageBtn} onClick={handleNextPage} disabled={page * pageSize >= total}>
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
