import { useState } from "react";
import FormField from "../components/FormField";
import { registerUser } from "../services/authApi";
import { evaluatePasswordStrength, validateRegisterForm } from "../utils/validation";

/**
 * User registration view with client-side validation and password strength indicator (AUTH-1).
 */
export default function RegisterPage({ onNavigate }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const strength = evaluatePasswordStrength(form.password);

  function handleChange(field) {
    return (event) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(form);
      setStatus({
        type: "success",
        message: result.message || "Kayıt işlemi başarıyla tamamlandı. Giriş yapabilirsiniz.",
      });
      setForm({ fullName: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Yeni Hesap Oluştur</h2>
      <p className="page-subtitle">Kimlik doğrulama modülüne katılmak için bilgilerinizi doldurun.</p>

      {status.message && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="register-fullname"
          label="Ad Soyad"
          value={form.fullName}
          onChange={handleChange("fullName")}
          placeholder="Örn: Şevket Gökay Beslem"
          error={errors.fullName}
          autoComplete="name"
        />

        <FormField
          id="register-email"
          label="E-posta Adresi"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="ornek@ogrenci.edu.tr"
          error={errors.email}
          autoComplete="email"
        />

        <FormField
          id="register-password"
          label="Şifre"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="En az 8 karakter, büyük/küçük harf ve rakam"
          error={errors.password}
          autoComplete="new-password"
          allowToggle
        />

        {form.password && (
          <div className="strength-meter">
            <div className="strength-bars">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={`strength-bar ${index <= strength.score ? strength.level : ""}`}
                />
              ))}
            </div>
            <span className="strength-label">{strength.label}</span>
          </div>
        )}

        <FormField
          id="register-confirm-password"
          label="Şifre Tekrarı"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          placeholder="Şifrenizi tekrar giriniz"
          error={errors.confirmPassword}
          autoComplete="new-password"
          allowToggle
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>
      </form>

      {onNavigate && (
        <div className="auth-footer-links">
          Zaten hesabınız var mı?{" "}
          <button type="button" className="link-btn" onClick={() => onNavigate("login")}>
            Giriş Yap
          </button>
        </div>
      )}
    </div>
  );
}
