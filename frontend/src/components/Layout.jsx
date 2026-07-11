import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? '#60a5fa' : 'white',
    textDecoration: 'none',
    fontWeight: isActive ? 'bold' : 'normal',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    transition: 'background-color 0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 2rem',
        backgroundColor: '#1f2937',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '0.5px' }}>
          SCM
        </div>
        
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <NavLink to="/" style={navLinkStyle}>Dashboard</NavLink>
          <NavLink to="/clientes" style={navLinkStyle}>Clientes</NavLink>
          <NavLink to="/tareas" style={navLinkStyle}>Tareas</NavLink>
          <NavLink to="/notas" style={navLinkStyle}>Notas</NavLink>

          {role === 'admin' && (
            <>
              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }} />
              <NavLink to="/auditoria" style={navLinkStyle}>Auditoría</NavLink>
              <NavLink to="/admin/tenants" style={navLinkStyle}>Tenants</NavLink>
              <NavLink to="/admin/users" style={navLinkStyle}>Usuarios</NavLink>
            </>
          )}
        </nav>
        
        <button 
          onClick={handleLogout}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          Cerrar Sesión
        </button>
      </header>
      
      <main style={{ flex: 1, padding: '2rem', backgroundColor: '#f9fafb' }}>
        {children}
      </main>
    </div>
  );
}
