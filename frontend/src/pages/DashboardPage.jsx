import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import ErrorNotification from '../components/ErrorNotification';
import MetricCard from '../components/MetricCard';
import { PipelineChart, TaskStatusChart } from '../components/DashboardCharts';
import { RecentClientsList, RecentAuditList } from '../components/DashboardLists';
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

  return (
    <div className={styles.container}>
      <ErrorNotification error={error} onDismiss={clearError} />
      
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Estudio Legal Fernández & Asoc. - Vista como <strong>{isAdmin ? 'Administrador' : 'Empleado'}</strong>
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot}></span>
            Datos en vivo (mock RBAC)
          </span>
        </div>
      </div>

      {dashboardData && (
        <div className={styles.content}>
          {/* Top 4 Metrics Row */}
          <div className={styles.metricsGrid}>
            <MetricCard 
              title="Clientes del Tenant" 
              value={dashboardData.total_clientes} 
              subtitle={`${dashboardData.clientes_activos} activos · ${dashboardData.clientes_riesgo} en riesgo`}
              icon="Users" 
              iconColor="#4f46e5" 
            />
            <MetricCard 
              title="Tareas Abiertas" 
              value={dashboardData.tareas_pendientes + dashboardData.tareas_en_progreso} 
              subtitle={`${dashboardData.tareas_criticas} críticas · ${dashboardData.tareas_bloqueadas} bloqueada`}
              icon="Tasks" 
              iconColor="#4f46e5" 
            />
            <MetricCard 
              title="Trámites en Curso" 
              value={dashboardData.tareas_en_progreso} 
              subtitle={`${dashboardData.tareas_completadas} completados`}
              icon="Docs" 
              iconColor="#4f46e5" 
            />
            {isAdmin ? (
              <MetricCard 
                title="Usuarios Activos" 
                value={dashboardData.total_usuarios || 0} 
                subtitle="Verificados en el sistema"
                icon="Users" 
                iconColor="#4f46e5" 
              />
            ) : (
              <MetricCard 
                title="Mis Tareas Completadas" 
                value={dashboardData.tareas_completadas} 
                subtitle="Total histórico"
                icon="CheckCircle" 
                iconColor="#4f46e5" 
              />
            )}
          </div>

          {/* Charts Row */}
          <div className={styles.chartsGrid}>
            <PipelineChart data={dashboardData.pipeline_clientes || {}} />
            <TaskStatusChart data={dashboardData.tareas_estado_dist || {}} />
          </div>

          {/* Admin only: Lists Row */}
          {isAdmin && (
            <div className={styles.listsGrid}>
              <RecentClientsList clients={dashboardData.clientes_recientes || []} />
              <RecentAuditList logs={dashboardData.actividad_reciente || []} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
