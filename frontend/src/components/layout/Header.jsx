
import { Building2, SearchIcon, BellIcon, UserIcon, LogOutIcon, Shield } from "./Icons";
import { useAuth } from "../../contexts/AuthContext";

export function Header() {
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    if (logout) await logout();
  };

  // Simulación de datos extraídos del user o defaults
  const userName = user?.name || (role === 'admin' ? 'Administrador' : 'Empleado');
  const initials = userName.substring(0, 2).toUpperCase();
  const tenantName = user?.tenantName || 'Estudio Legal Fernández & Asoc.';

  return (
    <header className="app-header">
      <div className="app-header__tenant">
        <Building2 />
        <span>Tenant:</span>
        <span className="app-header__tenant-name">{tenantName}</span>
      </div>

      <div className="app-header__search">
        <div className="search-input-wrapper">
          <SearchIcon />
          <input type="text" placeholder="Buscar clientes, tareas, notas..." />
        </div>
      </div>

      <div className="app-header__actions">
        <button className="action-btn">
          <BellIcon />
          <span className="badge"></span>
        </button>

        <div className="user-dropdown-container">
          <button className="user-profile-btn">
            <span className={`user-role-pill ${role === 'admin' ? 'admin' : 'employee'}`}>
              <Shield size={14} />
              {role === 'admin' ? 'Administrador' : 'Empleado'}
            </span>
            <div className="user-avatar">
              {initials}
            </div>
          </button>

          <div className="user-dropdown-menu">
            <div className="dropdown-header">
              <div className="dropdown-header-name">{userName}</div>
              <div className="dropdown-header-email">{user?.email || 'admin@estudio.com'}</div>
            </div>
            
            <button className="dropdown-item">
              <UserIcon size={16} />
              Mi perfil
            </button>
            
            <div style={{ height: '1px', background: 'var(--surface-border)', margin: '4px 0' }} />
            
            <button className="dropdown-item danger" onClick={handleLogout}>
              <LogOutIcon size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
