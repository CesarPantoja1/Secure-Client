/* eslint-disable */
import { FileText } from './layout/Icons';

export default function RecentActivity({ activity }) {
  if (!activity || activity.length === 0) {
    return <div className="recent-activity-empty">No hay actividad reciente.</div>;
  }

  return (
    <ul className="recent-activity-list">
      {activity.map((item) => (
        <li key={item.id} className="recent-activity-item">
          <div className="recent-activity-icon">
            <FileText size={16} />
          </div>
          <div className="recent-activity-content">
            <p className="recent-activity-desc">{item.descripcion}</p>
            <span className="recent-activity-time">
              {new Date(item.timestamp).toLocaleString('es-ES')}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
