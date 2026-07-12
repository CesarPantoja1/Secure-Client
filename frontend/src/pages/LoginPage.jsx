import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ErrorNotification from "../components/ErrorNotification";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = [
  { id: "admin", label: "Administrador", desc: "Acceso total" },
  { id: "employee", label: "Empleado", desc: "Acceso restringido" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const infoMessage = location.state?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ---- validation ---- */
  const emailValid = EMAIL_RE.test(email);
  const formValid = emailValid && password.length > 0;
  const emailTouched = email.length > 0;

  /* ---- submit ---- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formValid || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.detail || err.message || "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-split">
      {/* ======================== LEFT PANEL ======================== */}
      <aside className="login-brand">
        {/* Brand header */}
        <div className="login-brand__header">
          <div className="login-brand__logo">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
              <circle cx="19" cy="19" r="18" stroke="#818cf8" strokeWidth="2" />
              <circle cx="19" cy="19" r="10" stroke="#818cf8" strokeWidth="2" />
              <circle cx="19" cy="19" r="3" fill="#818cf8" />
            </svg>
          </div>
          <div className="login-brand__name">
            <span className="login-brand__title">SecureClient Manager</span>
            <span className="login-brand__version">SCM · V2.4</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="login-brand__hero">
          <h1 className="login-brand__heading">
            Gestión de clientes con trazabilidad institucional.
          </h1>
          <p className="login-brand__desc">
            Plataforma multi-tenant para consultorios médicos, estudios
            contables y agencias. Control de acceso por rol, auditoría
            inmutable y cifrado en tránsito y reposo.
          </p>
        </div>

        {/* Feature badges */}
        <div className="login-brand__badges">
          <div className="login-badge">
            <span className="login-badge__label">RBAC</span>
            <span className="login-badge__desc">Roles granulares</span>
          </div>
          <div className="login-badge">
            <span className="login-badge__label">Audit</span>
            <span className="login-badge__desc">Log inmutable</span>
          </div>
          <div className="login-badge">
            <span className="login-badge__label">SOC 2</span>
            <span className="login-badge__desc">Type II</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="login-brand__footer">
          © 2026 SCM. Todas las conexiones registradas por dirección IP.
        </footer>
      </aside>

      {/* ======================== RIGHT PANEL ======================== */}
      <main className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="login-form-header__title">Iniciar sesión</h2>
            <p className="login-form-header__subtitle">
              Acceso restringido. Se registrará su IP y user-agent.
            </p>
          </div>

          {/* Session expiration or info message */}
          {infoMessage && (
            <div className="login-info-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Error notification */}
          {error && (
            <ErrorNotification
              message={error}
              variant={error.includes("intentos") ? "warning" : "error"}
              onDismiss={() => setError(null)}
            />
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Correo corporativo
              </label>
              <div
                className={`form-input-wrapper ${
                  emailTouched && !emailValid ? "form-input-wrapper--invalid" : ""
                }`}
              >
                <span className="form-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 4.5l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="laura.mendez@nortia.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
              {emailTouched && !emailValid && (
                <p className="form-hint form-hint--error">
                  Ingresa un correo electrónico válido
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label">
                  Contraseña
                </label>
                <button type="button" className="form-link" tabIndex={-1}>
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="form-input-wrapper">
                <span className="form-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="9" cy="12.5" r="1.25" fill="currentColor" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M3.5 7C5 5 7 3.5 9 3.5s4 1.5 5.5 3.5c-1.5 2-3.5 3.5-5.5 3.5S5 9 3.5 7z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.5 9C5 7 7 5.5 9 5.5s4 1.5 5.5 3.5c-1.5 2-3.5 3.5-5.5 3.5S5 11 3.5 9z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div className="form-group">
              <span className="form-label">Rol de demostración</span>
              <div className="role-selector">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-card ${role === r.id ? "role-card--active" : ""}`}
                    onClick={() => setRole(r.id)}
                  >
                    <span className="role-card__label">{r.label}</span>
                    <span className="role-card__desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="btn btn--primary login-form__submit"
              disabled={!formValid || submitting}
            >
              {submitting ? (
                <span className="btn__spinner" aria-hidden="true" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="6.5" y="5" width="3" height="4.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M8 9.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? "Ingresando…" : "Ingresar de forma segura"}
            </button>
          </form>

          <p className="login-form-footer">
            Al continuar acepta las políticas de uso y auditoría de SCM.
          </p>
        </div>
      </main>
    </div>
  );
}
