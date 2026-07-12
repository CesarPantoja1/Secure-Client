import styles from './MetricCard.module.css';

const ICON_MAP = {
  Users: '👥',
  Tasks: '📋',
  Docs: '📄',
  CheckCircle: '✅',
};

export default function MetricCard({ title, value, subtitle, icon, iconColor = '#4f46e5' }) {
  const emojiIcon = ICON_MAP[icon] || '📊';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div 
          className={styles.iconContainer}
          style={{ color: iconColor, backgroundColor: `${iconColor}1a` }}
        >
          <span className={styles.icon}>{emojiIcon}</span>
        </div>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.subtitle}>{subtitle}</div>
    </div>
  );
}
