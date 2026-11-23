import { useEffect, useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { fetchCurrentUser } from "./services/authApi";

const TOKEN_STORAGE_KEY = "auth_module_token";

export default function App() {
  const [activeTab, setActiveTab] = useState("login");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;
    fetchCurrentUser(token)
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken("");
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleLoginSuccess(newToken, loggedInUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setUser(null);
    setActiveTab("login");
  }

  return (
    <div className="auth-shell">
      <header className="auth-header">
        <span className="auth-badge">AUTH Module · Jira &amp; GitHub</span>
        <h1>Kimlik Doğrulama Sistemi</h1>
        <p>Kullanıcı Kayıt, Giriş ve Şifre Sıfırlama Modülü</p>
      </header>

      {!user && (
        <nav className="auth-tabs" aria-label="Kimlik Doğrulama Sekmeleri">
          <button
            type="button"
            className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Kayıt Ol
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "reset" ? "active" : ""}`}
            onClick={() => setActiveTab("reset")}
          >
            Şifre Sıfırla
          </button>
        </nav>
      )}

      <main className="auth-body">
        {user ? (
          <DashboardPage
            user={user}
            token={token}
            onLogout={handleLogout}
            onUserRefreshed={setUser}
          />
        ) : activeTab === "register" ? (
          <RegisterPage onNavigate={setActiveTab} />
        ) : activeTab === "reset" ? (
          <ResetPasswordPage onNavigate={setActiveTab} />
        ) : (
          <LoginPage onNavigate={setActiveTab} onLoginSuccess={handleLoginSuccess} />
        )}
      </main>
    </div>
  );
}
