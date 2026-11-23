import { useState } from "react";
import FormField from "../components/FormField";
import { confirmPasswordReset, requestPasswordReset } from "../services/authApi";
import {
  evaluatePasswordStrength,
  validateEmail,
  validateResetPasswordForm,
} from "../utils/validation";

/**
 * Two-step password reset workflow view (AUTH-3):
 * 1) Request reset token via email
 * 2) Confirm token and set a new password
 */
export default function ResetPasswordPage({ onNavigate }) {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [issuedToken, setIssuedToken] = useState("");
  const [resetForm, setResetForm] = useState({
    token: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetErrors, setResetErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const strength = evaluatePasswordStrength(resetForm.newPassword);

  async function handleRequestSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset(email);
      setStatus({
        type: "success",
        message: data.message || "Şifre sıfırlama bağlantısı/kodu oluşturuldu.",
      });
      if (data.reset_token) {
        setIssuedToken(data.reset_token);
        setResetForm((prev) => ({ ...prev, token: data.reset_token }));
      }
      setStep("confirm");
    } catch (requestErr) {
      setStatus({ type: "error", message: requestErr.message });
    } finally {
      setLoading(false);
    }
  }

  function handleResetFieldChange(field) {
    return (event) => {
      const value = event.target.value;
      setResetForm((prev) => ({ ...prev, [field]: value }));
      setResetErrors((prev) => ({ ...prev, [field]: "" }));
    };
  }

  async function handleConfirmSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const validationErrors = validateResetPasswordForm(resetForm);
    if (Object.keys(validationErrors).length > 0) {
      setResetErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await confirmPasswordReset(resetForm);
      setStatus({
        type: "success",
        message: data.message || "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
      });
      setIssuedToken("");
      setResetForm({ token: "", newPassword: "", confirmPassword: "" });
    } catch (confirmErr) {
      setStatus({ type: "error", message: confirmErr.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Şifre Sıfırlama</h2>
      <p className="page-subtitle">
        {step === "request"
          ? "E-posta adresinizi girerek tek kullanımlık sıfırlama kodu oluşturun."
          : "Sıfırlama kodunu ve yeni şifrenizi girerek işlemi tamamlayın."}
      </p>

      {status.message && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
          {status.message}
          {issuedToken && (
            <div className="token-box" data-testid="demo-reset-token">
              Demo Sıfırlama Kodu: <strong>{issuedToken}</strong>
            </div>
          )}
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleRequestSubmit} noValidate>
          <FormField
            id="reset-email"
            label="Kayıtlı E-posta Adresi"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            placeholder="ornek@ogrenci.edu.tr"
            error={emailError}
            autoComplete="email"
          />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Kod Oluşturuluyor..." : "Sıfırlama Kodu Gönder"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setStatus({ type: "", message: "" });
              setStep("confirm");
            }}
          >
            Zaten Sıfırlama Kodum Var
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmSubmit} noValidate>
          <FormField
            id="reset-token"
            label="Sıfırlama Kodu (Token)"
            value={resetForm.token}
            onChange={handleResetFieldChange("token")}
            placeholder="Sıfırlama token değerini giriniz"
            error={resetErrors.token}
          />

          <FormField
            id="reset-new-password"
            label="Yeni Şifre"
            type="password"
            value={resetForm.newPassword}
            onChange={handleResetFieldChange("newPassword")}
            placeholder="En az 8 karakter, büyük/küçük harf ve rakam"
            error={resetErrors.newPassword}
            autoComplete="new-password"
            allowToggle
          />

          {resetForm.newPassword && (
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
            id="reset-confirm-password"
            label="Yeni Şifre Tekrarı"
            type="password"
            value={resetForm.confirmPassword}
            onChange={handleResetFieldChange("confirmPassword")}
            placeholder="Yeni şifrenizi tekrar giriniz"
            error={resetErrors.confirmPassword}
            autoComplete="new-password"
            allowToggle
          />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setStatus({ type: "", message: "" });
              setStep("request");
            }}
          >
            Yeni Sıfırlama Kodu İste
          </button>
        </form>
      )}

      <div className="auth-footer-links">
        <button type="button" className="link-btn" onClick={() => onNavigate("login")}>
          Giriş Ekranına Dön
        </button>
      </div>
    </div>
  );
}
