import styles from './DashboardLists.module.css';

// Función helper para obtener iniciales
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'activo':
      return { bg: '#dcfce7', text: '#166534' }; // Green
    case 'pendiente':
      return { bg: '#fef08a', text: '#854d0e' }; // Yellow
    case 'en riesgo':
      return { bg: '#fee2e2', text: '#991b1b' }; // Red
    default:
      return { bg: '#f3f4f6', text: '#374151' }; // Gray
  }
};

const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  
  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export function RecentClientsList({ clients = [] }) {
  return (
    <div className={styles.listCard}>
      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>Clientes recientes</h3>
        <p className={styles.listSubtitle}>Últimas interacciones visibles</p>
      </div>

      <div className={styles.clientsContainer}>
        {clients.length === 0 ? (
          <p className={styles.emptyText}>No hay clientes recientes.</p>
        ) : (
          clients.map((client) => {
            const initials = getInitials(client.nombre);
            const statusStyle = getStatusColor(client.estado);
            
            // Format time correctly
            let timeStr = formatTimeAgo(client.created_at);
            timeStr = timeStr.charAt(0).toUpperCase() + timeStr.slice(1); // Capitalize first letter

            return (
              <div key={client.id} className={styles.clientRow}>
                <div className={styles.clientAvatar}>
                  {initials}
                </div>
                <div className={styles.clientInfo}>
                  <h4 className={styles.clientName}>{client.nombre}</h4>
                  <p className={styles.clientCompany}>{client.empresa} · En trámite</p>
                </div>
                <div className={styles.clientStatus}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                  >
                    {client.estado}
                  </span>
                </div>
                <div className={styles.clientTime}>
                  {timeStr}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RecentAuditList({ logs = [] }) {
  return (
    <div className={styles.listCard}>
      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>Auditoría reciente</h3>
        <p className={styles.listSubtitle}>Eventos del tenant</p>
      </div>

      <div className={styles.auditContainer}>
        {logs.length === 0 ? (
          <p className={styles.emptyText}>No hay eventos de auditoría recientes.</p>
        ) : (
          logs.slice(0, 5).map((log) => {
            const logTime = formatTime(log.timestamp);
            
            return (
              <div key={log.id} className={styles.auditRow}>
                <div className={styles.auditActionRow}>
                  <span className={styles.auditActionBadge}>{log.accion.toUpperCase()}</span>
                  <span className={styles.auditTarget}>{log.tabla_afectada}</span>
                </div>
                <div className={styles.auditDetailRow}>
                  {log.user_email || 'usuario_desconocido'} · {logTime}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className={styles.auditFooter}>
        <a href="/auditoria" className={styles.auditLink}>Ver auditoría completa &rarr;</a>
      </div>
    </div>
  );
}
