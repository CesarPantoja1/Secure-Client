import styles from './DashboardCharts.module.css';

export function PipelineChart({ data = {} }) {
  const maxValue = Math.max(...Object.values(data), 1);
  
  // Mapeamos los tipos reales de DB a las etiquetas visuales
  const stages = [
    { label: 'Contable', key: 'contable' },
    { label: 'Médico', key: 'medico' },
    { label: 'Marketing', key: 'marketing' },
  ];

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleWrapper}>
          <span className={styles.chartIcon}>📉</span>
          <h3 className={styles.chartTitle}>Distribución de Clientes</h3>
        </div>
        <p className={styles.chartSubtitle}>Por tipo de servicio</p>
      </div>

      <div className={styles.barChartContainer}>
        {/* Y-Axis labels */}
        <div className={styles.yAxis}>
          <span>{maxValue}</span>
          <span>{Math.floor(maxValue * 0.75)}</span>
          <span>{Math.floor(maxValue * 0.5)}</span>
          <span>{Math.floor(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className={styles.barsArea}>
          {stages.map((stage) => {
            const count = data[stage.key] || 0;
            const heightPercent = `${(count / maxValue) * 100}%`;
            return (
              <div key={stage.key} className={styles.barColumn}>
                <div className={styles.barWrapper}>
                  <div className={styles.bar} style={{ height: heightPercent }}>
                    <div className={styles.barTooltip}>{count}</div>
                  </div>
                </div>
                <span className={styles.barLabel}>{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TaskStatusChart({ data = {} }) {
  const total = Object.values(data).reduce((acc, curr) => acc + curr, 0) || 1;

  const statuses = [
    { label: 'Pendiente', key: 'pendiente', color: '#f59e0b' },
    { label: 'En Progreso', key: 'en_progreso', color: '#3b82f6' },
    { label: 'Completada', key: 'completada', color: '#10b981' },
  ];

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Tareas por estado</h3>
        <p className={styles.chartSubtitle}>{total} tareas visibles</p>
      </div>

      <div className={styles.progressList}>
        {statuses.map((status) => {
          const count = data[status.key] || 0;
          const percent = Math.round((count / total) * 100);
          return (
            <div key={status.key} className={styles.progressItem}>
              <div className={styles.progressItemHeader}>
                <span className={styles.progressLabel}>{status.label}</span>
                <span className={styles.progressValue}>{count} · {percent}%</span>
              </div>
              <div className={styles.progressBarTrack}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${percent}%`, backgroundColor: status.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
