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

/**
 * Authenticate an existing user and return a signed token + user profile.
 * @param {{ email: string, password: string }} payload
 */
export function loginUser({ email, password }) {
  return requestJson("/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}

/**
 * Fetch the authenticated user's profile using a Bearer token.
 * @param {string} token
 */
export function fetchCurrentUser(token) {
  return requestJson("/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Request a password reset token for a registered email address.
 * @param {string} email
 */
export function requestPasswordReset(email) {
  return requestJson("/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });
}

/**
 * Confirm password reset with token and new password.
 * @param {{ token: string, newPassword: string }} payload
 */
export function confirmPasswordReset({ token, newPassword }) {
  return requestJson("/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: token.trim(),
      new_password: newPassword,
    }),
  });
}
