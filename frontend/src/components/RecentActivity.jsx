 
import styles from './RecentActivity.module.css';

const ACTION_ICONS = {
  INSERT: '🟢',
  UPDATE: '🟡',
  DELETE: '🔴',
  AUDIT_QUERY: '🔍',
  AUDIT_EXPORT: '📤',
};

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) {
    return `hace ${diffMins === 0 ? 1 : diffMins} min`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

export default function RecentActivity({ activity }) {
  const hasActivity = activity && activity.length > 0;

  return (
    <div className={styles.container}>
      {hasActivity ? (
        <ul className={styles.list}>
          {activity.map((item) => {
            const icon = ACTION_ICONS[item.accion?.toUpperCase()] || '📝';
            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.icon}>{icon}</div>
                <div className={styles.content}>
                  <p className={styles.description}>{item.descripcion}</p>
                  <span className={styles.time}>
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📋</span>
          <p>No hay actividad reciente</p>
        </div>
      )}
    </div>
  );
}
