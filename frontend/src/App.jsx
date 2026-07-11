import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

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
          Bienvenido al panel de administración. Esta sección está en construcción.
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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
              </ProtectedRoute>
            }
          />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
