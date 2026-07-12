import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminTenantsPage from "./pages/AdminTenantsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Placeholders para páginas no implementadas
import AdminUsersPage from "./pages/AdminUsersPage";
import ClientesListPage from "./pages/ClientesListPage";
import ClienteFormPage from "./pages/ClienteFormPage";
import ClienteDetailPage from "./pages/ClienteDetailPage";

import TareasListPage from "./pages/TareasListPage";
const TareaFormPage = () => <div style={{padding: 20}}><h2>Formulario de Tarea - En construcción</h2></div>;
const AuditoriaPage = () => <div style={{padding: 20}}><h2>Auditoría - En construcción</h2></div>;
const NotasPage = () => <div style={{padding: 20}}><h2>Notas - En construcción</h2></div>;

function DashboardPlaceholder() {

  return (
    <div className="dashboard-placeholder">
      <div className="dashboard-placeholder__card">
        <div className="dashboard-placeholder__icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="url(#dash-grad)" />
            <path
              d="M14 28l6-8 5 6 4-4 6 8"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="18" r="3" fill="#fff" fillOpacity="0.7" />
            <defs>
              <linearGradient id="dash-grad" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#7c3aed" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="dashboard-placeholder__title">Dashboard</h1>
        <p className="dashboard-placeholder__subtitle">
          Bienvenido al panel principal. Esta sección está en construcción.
        </p>
        <span className="dashboard-placeholder__badge">En desarrollo</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas protegidas genéricas (empleado y admin) */}
          <Route 
            element={
              <ProtectedRoute>
                <Layout>
                  <Outlet />
                </Layout>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPlaceholder />} />
            <Route path="/clientes" element={<ClientesListPage />} />
            <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
            <Route path="/clientes/:id" element={<ClienteDetailPage />} />
            <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
            <Route path="/tareas" element={<TareasListPage />} />
            <Route path="/tareas/nueva" element={<TareaFormPage />} />
            <Route path="/tareas/:id/editar" element={<TareaFormPage />} />
            <Route path="/notas" element={<NotasPage />} />
          </Route>

          {/* Rutas protegidas exclusivas (solo admin) */}
          <Route 
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <Outlet />
                </Layout>
              </ProtectedRoute>
            }
          >
            <Route path="/admin/tenants" element={<AdminTenantsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/auditoria" element={<AuditoriaPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
