import { NavLink } from "react-router-dom";
import { Lock, LayoutDashboard, Users, CheckSquare, FileText, Shield, Settings } from "./Icons";

export function Sidebar({ role }) {
  return (
    <aside className="app-sidebar">
      <header className="app-sidebar__header">
        <NavLink to="/" className="app-sidebar__brand">
          <div className="app-sidebar__logo">
            <Lock size={18} />
          </div>
          <div className="app-sidebar__title">
            <span className="app-sidebar__title-main">SecureClient</span>
            <span className="app-sidebar__title-sub">Manager</span>
          </div>
        </NavLink>
      </header>

      <div className="app-sidebar__content">
        <div className="app-sidebar__group">
          <div className="app-sidebar__group-title">Operación</div>
          <nav className="app-sidebar__nav">
            <NavLink to="/" className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}>
              <Users />
              <span>Clientes</span>
            </NavLink>
            <NavLink to="/tareas" className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}>
              <CheckSquare />
              <span>Tareas</span>
            </NavLink>

          </nav>
        </div>

        {role === 'admin' && (
          <div className="app-sidebar__group">
            <div className="app-sidebar__group-title">
              Administración <span className="app-sidebar__badge">ADMIN</span>
            </div>
            <nav className="app-sidebar__nav">
              <NavLink to="/auditoria" className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}>
                <Shield />
                <span>Auditoría</span>
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}>
                <Users />
                <span>Gestión de Usuarios</span>
              </NavLink>
              <NavLink to="/admin/tenants" className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}>
                <Settings />
                <span>Configuración</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <footer className="app-sidebar__footer">
        <div className="status-dot"></div>
        <span>Sesión cifrada · TLS 1.3</span>
      </footer>
    </aside>
  );
}
