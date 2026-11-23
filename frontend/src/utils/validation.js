const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Evaluate password strength on a 0-4 scale and return descriptive metadata.
 * @param {string} password
 * @returns {{ score: number, label: string, level: string }}
 */
export function evaluatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Zayıf şifre", level: "weak" };
  if (score <= 3) return { score, label: "Orta güçlükte şifre", level: "medium" };
  return { score, label: "Güçlü şifre", level: "strong" };
}

/**
 * Validate email syntax.
 * @param {string} email
 * @returns {string} Error message or empty string.
 */
export function validateEmail(email) {
  if (!email.trim()) return "E-posta adresi zorunludur.";
  if (!EMAIL_REGEX.test(email.trim())) return "Geçerli bir e-posta adresi giriniz.";
  return "";
}

/**
 * Validate password complexity (>= 8 chars, uppercase, lowercase, digit).
 * @param {string} password
 * @returns {string} Error message or empty string.
 */
export function validatePassword(password) {
  if (!password) return "Şifre zorunludur.";
  if (password.length < 8) return "Şifre en az 8 karakter olmalıdır.";
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.";
  }
  return "";
}

/**
 * Validate user registration form inputs.
 * @param {{ fullName: string, email: string, password: string, confirmPassword: string }} values
 * @returns {Record<string, string>} Field error map.
 */
export function validateRegisterForm(values) {
  const errors = {};
  const trimmedName = values.fullName.trim();

  if (!trimmedName) {
    errors.fullName = "Ad Soyad alanı zorunludur.";
  } else if (trimmedName.length < 3) {
    errors.fullName = "Ad Soyad en az 3 karakter olmalıdır.";
  }

  const emailErr = validateEmail(values.email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(values.password);
  if (passErr) errors.password = passErr;

  if (!values.confirmPassword) {
    errors.confirmPassword = "Şifre tekrarı zorunludur.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Şifreler eşleşmiyor.";
  }

  return errors;
}

/**
 * Validate login form inputs.
 * @param {{ email: string, password: string }} values
 * @returns {Record<string, string>} Field error map.
 */
export function validateLoginForm(values) {
  const errors = {};
  const emailErr = validateEmail(values.email);
  if (emailErr) errors.email = emailErr;

  if (!values.password) {
    errors.password = "Şifre alanı zorunludur.";
  }

  return errors;
}

/**
 * Validate password reset confirmation form inputs.
 * @param {{ token: string, newPassword: string, confirmPassword: string }} values
 * @returns {Record<string, string>} Field error map.
 */
export function validateResetPasswordForm(values) {
  const errors = {};
  if (!values.token.trim()) {
    errors.token = "Sıfırlama kodu (token) zorunludur.";
  }

  const passErr = validatePassword(values.newPassword);
  if (passErr) errors.newPassword = passErr;

  if (!values.confirmPassword) {
    errors.confirmPassword = "Şifre tekrarı zorunludur.";
  } else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = "Şifreler eşleşmiyor.";
  }

  return errors;
}
