export class ApiError extends Error {
  constructor(message, status, code, details, errorId) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.errorId = errorId;
  }
}

export function getCsrfToken() {
  const name = 'scm_csrf_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', headers = {}, ...rest } = options;
  
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const methodUpper = method.toUpperCase();
  if (methodUpper === 'POST' || methodUpper === 'PUT' || methodUpper === 'DELETE') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      requestHeaders['X-CSRF-Token'] = csrfToken;
    }
  }

  let response;
  try {
    response = await fetch(path, {
      method: methodUpper,
      headers: requestHeaders,
      credentials: 'same-origin',
      ...rest,
    });
  } catch {
    // Network error (sin conexión)
    throw new ApiError('Error de conexión. Verifica tu red.', 0, 'NETWORK_ERROR', null, null);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(response.statusText || 'Error de servidor', response.status, 'SERVER_ERROR', null, null);
    }
    data = { success: true };
  }

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message || response.statusText || 'Error en la petición',
      response.status,
      data.code || 'API_ERROR',
      data.details || null,
      data.errorId || null
    );
  }

  return data;
}
