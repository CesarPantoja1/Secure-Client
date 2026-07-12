import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminTenantsPage from "./pages/AdminTenantsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";

// Placeholders para páginas no implementadas
import AdminUsersPage from "./pages/AdminUsersPage";
import ClientesListPage from "./pages/ClientesListPage";
import ClienteFormPage from "./pages/ClienteFormPage";
import ClienteDetailPage from "./pages/ClienteDetailPage";
import TareasListPage from "./pages/TareasListPage";
import AuditoriaPage from "./pages/AuditoriaPage";
const NotasPage = () => <div style={{padding: 20}}><h2>Notas - En construcción</h2></div>;



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
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesListPage />} />
            <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
            <Route path="/clientes/:id" element={<ClienteDetailPage />} />
            <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
            <Route path="/tareas" element={<TareasListPage />} />
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
