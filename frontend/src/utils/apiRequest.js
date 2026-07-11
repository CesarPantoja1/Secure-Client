/**
 * Centralized API request utility.
 * Handles CSRF tokens, JSON serialization, and error normalization.
 */

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  constructor(status, detail, retryAfter = null) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.retryAfter = retryAfter;
  }
}

/**
 * @param {string} path - API path, e.g. "/api/login"
 * @param {object} options
 * @param {string} options.method - HTTP method
 * @param {object} [options.body] - Request body (will be JSON-stringified)
 * @returns {Promise<object>} Parsed JSON response
 * @throws {ApiError} On non-2xx responses
 */
export async function apiRequest(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };

  const csrf = getCookie("scm_csrf_token");
  if (csrf) {
    headers["X-CSRF-Token"] = csrf;
  }

  const res = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let detail = "Error inesperado del servidor";
    let retryAfter = null;

    if (res.status === 429) {
      retryAfter = res.headers.get("Retry-After");
      detail = retryAfter
        ? `Demasiados intentos. Intenta de nuevo en ${retryAfter} segundos.`
        : "Demasiados intentos. Intenta de nuevo más tarde.";
    } else {
      try {
        const err = await res.json();
        detail = err.detail || detail;
      } catch {
        /* response body wasn't JSON */
      }
    }

    throw new ApiError(res.status, detail, retryAfter);
  }

  // Some endpoints may return 204 No Content
  if (res.status === 204) return null;
  return res.json();
}
