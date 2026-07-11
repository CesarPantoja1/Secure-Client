import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth(); // asumimos que el context provee esto

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere un rol específico y el usuario no lo tiene, redirigir al dashboard
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Todo OK, renderizar los hijos (contenido protegido)
  return children;
}
