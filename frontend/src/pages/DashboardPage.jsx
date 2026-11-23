import { useState } from "react";
import { fetchCurrentUser } from "../services/authApi";

/**
 * Authenticated user session summary and logout view (AUTH-2).
 */
export default function DashboardPage({ user, token, onLogout, onUserRefreshed }) {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [checking, setChecking] = useState(false);

  async function handleVerifySession() {
    setStatus({ type: "", message: "" });
    setChecking(true);
    try {
      const data = await fetchCurrentUser(token);
      onUserRefreshed(data.user);
      setStatus({ type: "success", message: "Oturum token doğrulaması başarılı." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Hoş Geldiniz, {user.full_name}</h2>
      <p className="page-subtitle">Oturumunuz aktif. Kimlik doğrulama bilgileri aşağıdadır.</p>

      {status.message && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
          {status.message}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-row">
          <span className="profile-key">Kullanıcı ID</span>
          <span className="profile-val">#{user.id}</span>
        </div>
        <div className="profile-row">
          <span className="profile-key">Ad Soyad</span>
          <span className="profile-val">{user.full_name}</span>
        </div>
        <div className="profile-row">
          <span className="profile-key">E-posta</span>
          <span className="profile-val">{user.email}</span>
        </div>
        <div className="profile-row">
          <span className="profile-key">Kayıt Zamanı</span>
          <span className="profile-val">{user.created_at}</span>
        </div>
      </div>

      <button type="button" className="btn-primary" onClick={handleVerifySession} disabled={checking}>
        {checking ? "Doğrulanıyor..." : "Oturumu Doğrula (/api/auth/me)"}
      </button>
      <button type="button" className="btn-secondary" onClick={onLogout}>
        Çıkış Yap
      </button>
    </div>
  );
}
