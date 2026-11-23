import { useState } from "react";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("register");

  return (
    <div className="auth-shell">
      <header className="auth-header">
        <span className="auth-badge">AUTH Module · Jira &amp; GitHub</span>
        <h1>Kimlik Doğrulama Sistemi</h1>
        <p>Kullanıcı Kayıt, Giriş ve Şifre Sıfırlama Modülü</p>
      </header>

      <nav className="auth-tabs" aria-label="Kimlik Doğrulama Sekmeleri">
        <button
          type="button"
          className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          Kayıt Ol
        </button>
        <button type="button" className="auth-tab" disabled title="AUTH-2 ile eklenecek">
          Giriş Yap
        </button>
        <button type="button" className="auth-tab" disabled title="AUTH-3 ile eklenecek">
          Şifre Sıfırla
        </button>
      </nav>

      <main className="auth-body">
        <RegisterPage onNavigate={null} />
      </main>
    </div>
  );
}
