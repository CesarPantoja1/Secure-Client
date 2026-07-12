/* eslint-disable */
import { Users, Clock, Loader, CheckCircle } from './layout/Icons';

export default function MetricCard({ title, value, icon, color }) {
  const IconComponent = {
    'Users': Users,
    'Clock': Clock,
    'Loader': Loader,
    'CheckCircle': CheckCircle,
  }[icon] || Users;

  return (
    <div className="metric-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="metric-card__icon" style={{ color }}>
        <IconComponent size={24} />
      </div>
      <div className="metric-card__content">
        <h3 className="metric-card__title">{title}</h3>
        <p className="metric-card__value">{value}</p>
      </div>
    </div>
  );
}
