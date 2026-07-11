
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';

export default function Layout({ children }) {
  const { role } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar role={role} />
      
      <div className="app-main">
        <Header />
        
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
