import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../utils/apiRequest";
import ErrorNotification from "../components/ErrorNotification";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminTenantsPage() {
  const [formData, setFormData] = useState({
    nombre_tenant: "",
    email_admin: "",
    password_admin: "",
    nombre_completo_admin: "",
  });

  const [touched, setTouched] = useState({
    nombre_tenant: false,
    email_admin: false,
    password_admin: false,
    nombre_completo_admin: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ---- validation ---- */
  const emailValid = EMAIL_RE.test(formData.email_admin);
  const passwordValid = formData.password_admin.length >= 8;
  const tenantNameValid = formData.nombre_tenant.trim().length > 0;
  const adminNameValid = formData.nombre_completo_admin.trim().length > 0;

  const formValid = emailValid && passwordValid && tenantNameValid && adminNameValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await apiRequest("/api/admin/tenants", {
        method: "POST",
        body: formData,
      });
      setSuccessMsg(`¡Éxito! Organización creada con ID: ${data.tenant_id}`);
      setFormData({
        nombre_tenant: "",
        email_admin: "",
        password_admin: "",
        nombre_completo_admin: "",
      });
      setTouched({
        nombre_tenant: false,
        email_admin: false,
        password_admin: false,
        nombre_completo_admin: false,
      });
    } catch (err) {
      setError(err.detail || err.message || "Error al crear el tenant");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-split">
      {/* ======================== LEFT PANEL ======================== */}
      <aside className="login-brand" style={{ justifyContent: "space-between" }}>
        {/* Brand header & Back button */}
        <div className="login-brand__header">
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--brand-text)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              transition: "color var(--t-fast)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--brand-heading)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--brand-text)")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al Dashboard
          </Link>
        </div>

        {/* Hero copy */}
        <div className="login-brand__hero" style={{ marginTop: "40px" }}>
          <div className="login-brand__logo" style={{ marginBottom: "24px" }}>
            <svg width="42" height="42" viewBox="0 0 38 38" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="34" height="34" rx="8" stroke="#818cf8" strokeWidth="2" />
              <path d="M12 19h14M19 12v14" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="login-brand__heading">
            Aprovisionamiento seguro de nuevos Tenants.
          </h1>
          <p className="login-brand__desc">
            Cada organización recibe un entorno de datos completamente aislado. El administrador principal es registrado con metadatos específicos que aseguran el correcto aislamiento institucional.
          </p>
        </div>

        {/* Feature badges */}
        <div className="login-brand__badges" style={{ marginTop: "40px" }}>
          <div className="login-badge">
            <span className="login-badge__label">Aislamiento</span>
            <span className="login-badge__desc">Datos blindados</span>
          </div>
          <div className="login-badge">
            <span className="login-badge__label">Supabase</span>
            <span className="login-badge__desc">Service Role RBAC</span>
          </div>
          <div className="login-badge">
            <span className="login-badge__label">Auditoría</span>
            <span className="login-badge__desc">Logs de creación</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="login-brand__footer" style={{ marginTop: "40px" }}>
          SecureClient Manager · Panel de Administración Global
        </footer>
      </aside>

      {/* ======================== RIGHT PANEL ======================== */}
      <main className="login-form-panel">
        <div className="login-form-container" style={{ maxWidth: "440px" }}>
          <div className="login-form-header">
            <h2 className="login-form-header__title">Alta de Tenant</h2>
            <p className="login-form-header__subtitle">
              Crea una nueva organización y a su administrador de forma segura.
            </p>
          </div>

          {/* Success / Error notification */}
          {error && (
            <ErrorNotification
              message={error}
              variant="error"
              onDismiss={() => setError(null)}
            />
          )}

          {successMsg && (
            <div className="success-banner" style={{ display: "flex", gap: "10px", alignItems: "center", background: "var(--color-success)", color: "white", padding: "12px 16px", borderRadius: "var(--radius-sm)", marginBottom: "20px", fontSize: "14px", fontWeight: "500" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Nombre del Tenant */}
            <div className="form-group">
              <label htmlFor="nombre_tenant" className="form-label">
                Nombre de la organización (Tenant)
              </label>
              <div
                className={`form-input-wrapper ${
                  touched.nombre_tenant && !tenantNameValid ? "form-input-wrapper--invalid" : ""
                }`}
              >
                <span className="form-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="9" y1="22" x2="9" y2="16" />
                    <line x1="15" y1="22" x2="15" y2="16" />
                    <line x1="9" y1="16" x2="15" y2="16" />
                    <path d="M9 6h6M9 10h6" />
                  </svg>
                </span>
                <input
                  id="nombre_tenant"
                  name="nombre_tenant"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Clínica Dental San José"
                  value={formData.nombre_tenant}
                  onChange={handleChange}
                  onBlur={() => handleBlur("nombre_tenant")}
                  maxLength={100}
                  required
                />
              </div>
              {touched.nombre_tenant && !tenantNameValid && (
                <p className="form-hint form-hint--error">
                  El nombre de la organización es obligatorio
                </p>
              )}
            </div>

            {/* Nombre del Administrador */}
            <div className="form-group">
              <label htmlFor="nombre_completo_admin" className="form-label">
                Nombre completo del Administrador
              </label>
              <div
                className={`form-input-wrapper ${
                  touched.nombre_completo_admin && !adminNameValid ? "form-input-wrapper--invalid" : ""
                }`}
              >
                <span className="form-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="nombre_completo_admin"
                  name="nombre_completo_admin"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Carlos Mendoza"
                  value={formData.nombre_completo_admin}
                  onChange={handleChange}
                  onBlur={() => handleBlur("nombre_completo_admin")}
                  required
                />
              </div>
              {touched.nombre_completo_admin && !adminNameValid && (
                <p className="form-hint form-hint--error">
                  El nombre del administrador es obligatorio
                </p>
              )}
            </div>

            {/* Correo del Administrador */}
            <div className="form-group">
              <label htmlFor="email_admin" className="form-label">
                Correo corporativo del Administrador
              </label>
              <div
                className={`form-input-wrapper ${
                  touched.email_admin && !emailValid ? "form-input-wrapper--invalid" : ""
                }`}
              >
                <span className="form-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="email_admin"
                  name="email_admin"
                  type="email"
                  className="form-input"
                  placeholder="admin@organizacion.com"
                  value={formData.email_admin}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email_admin")}
                  required
                />
              </div>
              {touched.email_admin && !emailValid && touched.email_admin && (
                <p className="form-hint form-hint--error">
                  Ingresa un correo electrónico válido
                </p>
              )}
            </div>

            {/* Contraseña Temporal */}
            <div className="form-group">
              <label htmlFor="password_admin" className="form-label">
                Contraseña Temporal
              </label>
              <div
                className={`form-input-wrapper ${
                  touched.password_admin && !passwordValid ? "form-input-wrapper--invalid" : ""
                }`}
              >
                <span className="form-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password_admin"
                  name="password_admin"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={formData.password_admin}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password_admin")}
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password_admin && !passwordValid && (
                <p className="form-hint form-hint--error">
                  La contraseña debe tener mínimo 8 caracteres
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn--primary login-form__submit"
              disabled={!formValid || submitting}
              style={{ marginTop: "12px" }}
            >
              {submitting ? (
                <span className="btn__spinner" aria-hidden="true" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              )}
              {submitting ? "Creando..." : "Crear Tenant de forma segura"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
