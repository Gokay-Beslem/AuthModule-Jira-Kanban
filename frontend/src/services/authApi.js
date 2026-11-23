const API_BASE = "/api/auth";

/**
 * Execute a JSON request against the authentication API and throw normalized errors.
 * @param {string} path
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || "Sunucu isteği başarısız oldu.");
  }
  return data;
}

/**
 * Register a new user account.
 * @param {{ fullName: string, email: string, password: string }} payload
 */
export function registerUser({ fullName, email, password }) {
  return requestJson("/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}
