import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import ErrorNotification from '../components/ErrorNotification';
import MetricCard from '../components/MetricCard';
import RecentActivity from '../components/RecentActivity';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { role } = useAuth();
  const { execute, loading, error, clearError } = useApi();
  
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await execute('/api/dashboard');
      setDashboardData(data);
    } catch {
      // Manejado por useApi y ErrorNotification
    }
  }, [execute]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !dashboardData) {
    return <div className={styles.loading}>Cargando panel de control...</div>;
  }

  const isAdmin = role === 'admin';
  const gridClass = isAdmin ? `${styles.metricsGrid} ${styles.metricsGridAdmin}` : styles.metricsGrid;

  return (
    <div className={styles.container}>
      <ErrorNotification error={error} onDismiss={clearError} />
      
      <div className={styles.header}>
        <h1 className={styles.title}>Panel de Control</h1>
        <p className={styles.subtitle}>
          {isAdmin ? 'Vista de administrador - Métricas globales del tenant' : 'Vista personal - Tus métricas de trabajo'}
        </p>
      </div>

      {dashboardData && (
        <>
          <div className={gridClass}>
            {isAdmin ? (
              <>
                <MetricCard 
                  title="Total Clientes" 
                  value={dashboardData.total_clientes} 
                  icon="Users" 
                  color="var(--color-primary-500)" 
                />
                <MetricCard 
                  title="Tareas Pendientes" 
                  value={dashboardData.tareas_pendientes} 
                  icon="Clock" 
                  color="var(--color-error)" 
                />
                <MetricCard 
                  title="Tareas en Progreso" 
                  value={dashboardData.tareas_en_progreso} 
                  icon="Loader" 
                  color="var(--color-warning)" 
                />
                <MetricCard 
                  title="Tareas Completadas" 
                  value={dashboardData.tareas_completadas} 
                  icon="CheckCircle" 
                  color="var(--color-success)" 
                />
                <MetricCard 
                  title="Total Usuarios" 
                  value={dashboardData.total_usuarios || 0} 
                  icon="Users" 
                  color="#6366f1" 
                />
              </>
            ) : (
              <>
                <MetricCard 
                  title="Mis Clientes" 
                  value={dashboardData.total_clientes} 
                  icon="Users" 
                  color="var(--color-primary-500)" 
                />
                <MetricCard 
                  title="Mis Tareas Pendientes" 
                  value={dashboardData.tareas_pendientes} 
                  icon="Clock" 
                  color="var(--color-error)" 
                />
                <MetricCard 
                  title="Mis Tareas en Progreso" 
                  value={dashboardData.tareas_en_progreso} 
                  icon="Loader" 
                  color="var(--color-warning)" 
                />
                <MetricCard 
                  title="Mis Tareas Completadas" 
                  value={dashboardData.tareas_completadas} 
                  icon="CheckCircle" 
                  color="var(--color-success)" 
                />
              </>
            )}
          </div>

          <div className={styles.activitySection}>
            <h2 className={styles.activityTitle}>Actividad Reciente</h2>
            <RecentActivity activity={dashboardData.actividad_reciente} />
          </div>
        </>
      )}
    </div>
  );
}
