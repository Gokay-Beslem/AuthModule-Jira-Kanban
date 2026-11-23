import { useState } from "react";
import FormField from "../components/FormField";
import { loginUser } from "../services/authApi";
import { validateLoginForm } from "../utils/validation";

/**
 * User login view with validation and session callback (AUTH-2).
 */
export default function LoginPage({ onNavigate, onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [errorBanner, setErrorBanner] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field) {
    return (event) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorBanner("");

    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(form);
      onLoginSuccess(result.token, result.user);
    } catch (err) {
      setErrorBanner(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Hesabınıza Giriş Yapın</h2>
      <p className="page-subtitle">Devam etmek için kayıtlı e-posta ve şifrenizi giriniz.</p>

      {errorBanner && <div className="alert alert-error">{errorBanner}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="login-email"
          label="E-posta Adresi"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="ornek@ogrenci.edu.tr"
          error={errors.email}
          autoComplete="email"
        />

        <FormField
          id="login-password"
          label="Şifre"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="Şifrenizi giriniz"
          error={errors.password}
          autoComplete="current-password"
          allowToggle
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <div className="auth-footer-links">
        Henüz hesabınız yok mu?{" "}
        <button type="button" className="link-btn" onClick={() => onNavigate("register")}>
          Kayıt Ol
        </button>
      </div>
    </div>
  );
}
