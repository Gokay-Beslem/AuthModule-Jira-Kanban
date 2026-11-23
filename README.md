# AuthModule-Jira-Kanban

**Bilgisayar Mühendisliğinde Proje Yönetimi — Laboratuvar Uygulaması**  
**Konu:** Jira & GitHub Entegrasyonu ile Kanban Uygulaması (Authentication Modülü)

## Ekip Üyeleri
- **Şevket Gökay Beslem** (`2412721012`)
- **Muhammed Emin Polat** (`2412721062`)

## Jira & GitHub İş Akışı (`AUTH-1` – `AUTH-7`)
| Issue Key | Görev Tanımı | Öncelik | Branch |
| --- | --- | --- | --- |
| `AUTH-1` | Frontend: Kullanıcı kayıt ekranı tasarımı | High | `AUTH-1-kayit-ekrani` |
| `AUTH-2` | Frontend: Kullanıcı giriş ekranı tasarımı | High | `AUTH-2-giris-ekrani` |
| `AUTH-3` | Frontend: Şifre sıfırlama ekranı | Medium | `AUTH-3-sifre-sifirlama-ekrani` |
| `AUTH-4` | Backend: Kullanıcı kayıt (Register) API | High | `AUTH-4-kayit-api` |
| `AUTH-5` | Backend: Kullanıcı giriş (Login) API | High | `AUTH-5-giris-api` |
| `AUTH-6` | Backend: Şifre sıfırlama API | Medium | `AUTH-6-sifre-sifirlama-api` |
| `AUTH-7` | Modül Entegrasyon Testleri | High | `AUTH-7-entegrasyon-testleri` |

## Mimari ve Dizin Yapısı
- `frontend/`: React + Vite kimlik doğrulama arayüzü (Kayıt Ol, Giriş Yap, Oturum Doğrulama, Şifre Sıfırlama)
- `backend/`: Python Flask + SQLite REST API (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/health`)
- `tests/`: Uçtan uca Python backend entegrasyon testleri ve frontend form doğrulama testleri

## Kurulum ve Çalıştırma
### 1. Backend Kurulumu & Çalıştırma
```bash
pip install -r backend/requirements.txt
python -m backend.app
```
Backend varsayılan olarak `http://127.0.0.1:5000` adresinde çalışır ve `frontend/dist` mevcutsa React uygulamasını da sunar.

### 2. Frontend Kurulumu & Çalıştırma
```bash
cd frontend
npm install
npm run build
npm run dev
```

## Testleri Çalıştırma (`AUTH-7`)
```bash
python -m unittest discover -s tests -v
node --test tests/test_frontend_validation.mjs
```
