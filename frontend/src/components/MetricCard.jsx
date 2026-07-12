/* eslint-disable react/prop-types */
import styles from './MetricCard.module.css';

const ICON_MAP = {
  Users: '👥',
  Clock: '⏰',
  Loader: '🔄',
  CheckCircle: '✅',
  FileText: '📝',
};

export default function MetricCard({ title, value, icon, color }) {
  const emojiIcon = ICON_MAP[icon] || '📊';

  // Helper to add opacity to a hex color or use a default subtle background
  // If color is a CSS variable (like var(--color-primary-500)), we'll just use a generic light gray for the circle bg
  // to keep it simple, or we can use the color directly if it's hex.
  const isHex = color && color.startsWith('#');
  
  // A simple trick to do 10% opacity in hex is adding '1A' at the end
  const circleBg = isHex ? `${color}1A` : 'rgba(0, 0, 0, 0.05)';
  const iconColor = isHex ? color : 'inherit';

  return (
    <div 
      className={styles.card} 
      style={{ borderLeftColor: color }}
    >
      <div 
        className={styles.iconContainer} 
        style={{ backgroundColor: circleBg, color: iconColor }}
      >
        <span className={styles.icon}>{emojiIcon}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.title}>{title}</div>
      </div>
    </div>
  );
}
