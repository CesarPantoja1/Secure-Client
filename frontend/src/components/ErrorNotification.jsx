import { useState, useEffect } from "react";

/**
 * ErrorNotification — animated toast-style error banner.
 *
 * @param {object} props
 * @param {string} props.message   — Text to display
 * @param {"error"|"warning"|"info"} [props.variant="error"]
 * @param {() => void} [props.onDismiss] — Called when user closes or auto-dismiss fires
 * @param {number} [props.autoDismissMs] — Auto-dismiss after N ms (0 = never)
 */
export default function ErrorNotification({
  message,
  variant = "error",
  onDismiss,
  autoDismissMs = 0,
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);

  if (!visible || !message) return null;

  const icons = {
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M10 6v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="14" r="1" fill="currentColor" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L1 18h18L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M10 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="6" r="1" fill="currentColor" />
      </svg>
    ),
  };

  return (
    <div className={`error-notification error-notification--${variant}`} role="alert">
      <span className="error-notification__icon">{icons[variant]}</span>
      <span className="error-notification__message">{message}</span>
      <button
        className="error-notification__close"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        aria-label="Cerrar notificación"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
