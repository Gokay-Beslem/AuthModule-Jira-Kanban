"""End-to-end integration tests for the Authentication Module (AUTH-7)."""

import os
import tempfile
import time
import unittest

from backend.app import FRONTEND_DIST_DIR, create_app


class TestAuthModuleIntegration(unittest.TestCase):
    """Integration suite covering Register, Login, Token Auth, and Password Reset."""

    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        self.app = create_app(
            {
                "TESTING": True,
                "DB_PATH": self.db_path,
                "SECRET_KEY": "integration-test-secret",
                "TOKEN_TTL_SECONDS": 60,
                "RESET_TOKEN_TTL_SECONDS": 60,
            }
        )
        self.client = self.app.test_client()

    def tearDown(self):
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def _register_sample_user(
        self,
        full_name="Şevket Gökay Beslem",
        email="gokay@ogrenci.edu.tr",
        password="Password123",
    ):
        return self.client.post(
            "/api/auth/register",
            json={
                "full_name": full_name,
                "email": email,
                "password": password,
            },
        )

    def test_health_check_and_cors_headers(self):
        """Health endpoint should return 200 OK and CORS headers should be active."""
        response = self.client.get("/api/health", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")
        self.assertIn(
            response.headers.get("Access-Control-Allow-Origin"),
            ("*", "http://localhost:5173"),
        )

        if FRONTEND_DIST_DIR.exists():
            index_response = self.client.get("/")
            self.assertEqual(index_response.status_code, 200)
            self.assertIn(b"Kimlik", index_response.data)
            index_response.close()

    def test_register_validation_and_duplicate_conflict(self):
        """Registration should enforce field validations and reject duplicate emails."""
        bad_name = self.client.post(
            "/api/auth/register",
            json={"full_name": "Ab", "email": "a@b.com", "password": "Password123"},
        )
        self.assertEqual(bad_name.status_code, 400)

        bad_email = self.client.post(
            "/api/auth/register",
            json={"full_name": "Ali Veli", "email": "invalid-email", "password": "Password123"},
        )
        self.assertEqual(bad_email.status_code, 400)

        weak_pass = self.client.post(
            "/api/auth/register",
            json={"full_name": "Ali Veli", "email": "ali@example.com", "password": "short"},
        )
        self.assertEqual(weak_pass.status_code, 400)

        created = self._register_sample_user()
        self.assertEqual(created.status_code, 201)
        data = created.get_json()
        self.assertEqual(data["user"]["email"], "gokay@ogrenci.edu.tr")
        self.assertNotIn("password_hash", data["user"])

        duplicate = self._register_sample_user(email="GOKAY@ogrenci.edu.tr")
        self.assertEqual(duplicate.status_code, 409)

    def test_login_and_protected_me_endpoint(self):
        """Login should issue a Bearer token accepted by /api/auth/me and reject bad creds."""
        self._register_sample_user()

        wrong_pass = self.client.post(
            "/api/auth/login",
            json={"email": "gokay@ogrenci.edu.tr", "password": "WrongPassword1"},
        )
        self.assertEqual(wrong_pass.status_code, 401)

        unknown_user = self.client.post(
            "/api/auth/login",
            json={"email": "unknown@ogrenci.edu.tr", "password": "Password123"},
        )
        self.assertEqual(unknown_user.status_code, 401)

        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "gokay@ogrenci.edu.tr", "password": "Password123"},
        )
        self.assertEqual(login_res.status_code, 200)
        token = login_res.get_json()["token"]
        self.assertTrue(token)

        me_res = self.client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()["user"]["full_name"], "Şevket Gökay Beslem")

        missing_auth = self.client.get("/api/auth/me")
        self.assertEqual(missing_auth.status_code, 401)

        tampered_auth = self.client.get(
            "/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"}
        )
        self.assertEqual(tampered_auth.status_code, 401)

    def test_expired_access_token_rejected(self):
        """Expired access tokens must be rejected by /api/auth/me."""
        short_app = create_app(
            {
                "TESTING": True,
                "DB_PATH": self.db_path,
                "SECRET_KEY": "integration-test-secret",
                "TOKEN_TTL_SECONDS": -1,
            }
        )
        short_client = short_app.test_client()
        short_client.post(
            "/api/auth/register",
            json={
                "full_name": "Muhammed Emin Polat",
                "email": "emin@ogrenci.edu.tr",
                "password": "Password123",
            },
        )
        login_res = short_client.post(
            "/api/auth/login",
            json={"email": "emin@ogrenci.edu.tr", "password": "Password123"},
        )
        token = login_res.get_json()["token"]
        me_res = short_client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(me_res.status_code, 401)

    def test_password_reset_full_lifecycle(self):
        """Password reset should invalidate old credentials, prevent reuse, and enforce expiry."""
        self._register_sample_user()

        unknown_forgot = self.client.post(
            "/api/auth/forgot-password", json={"email": "nonexistent@ogrenci.edu.tr"}
        )
        self.assertEqual(unknown_forgot.status_code, 404)

        forgot_res = self.client.post(
            "/api/auth/forgot-password", json={"email": "gokay@ogrenci.edu.tr"}
        )
        self.assertEqual(forgot_res.status_code, 200)
        reset_token = forgot_res.get_json()["reset_token"]
        self.assertTrue(reset_token)

        weak_reset = self.client.post(
            "/api/auth/reset-password",
            json={"token": reset_token, "new_password": "weak"},
        )
        self.assertEqual(weak_reset.status_code, 400)

        reset_res = self.client.post(
            "/api/auth/reset-password",
            json={"token": reset_token, "new_password": "NewStrongPassword9"},
        )
        self.assertEqual(reset_res.status_code, 200)

        reuse_res = self.client.post(
            "/api/auth/reset-password",
            json={"token": reset_token, "new_password": "AnotherPassword9"},
        )
        self.assertEqual(reuse_res.status_code, 400)

        old_login = self.client.post(
            "/api/auth/login",
            json={"email": "gokay@ogrenci.edu.tr", "password": "Password123"},
        )
        self.assertEqual(old_login.status_code, 401)

        new_login = self.client.post(
            "/api/auth/login",
            json={"email": "gokay@ogrenci.edu.tr", "password": "NewStrongPassword9"},
        )
        self.assertEqual(new_login.status_code, 200)

    def test_expired_reset_token_rejected(self):
        """Expired password reset tokens should be rejected."""
        expired_app = create_app(
            {
                "TESTING": True,
                "DB_PATH": self.db_path,
                "SECRET_KEY": "integration-test-secret",
                "RESET_TOKEN_TTL_SECONDS": -5,
            }
        )
        c = expired_app.test_client()
        c.post(
            "/api/auth/register",
            json={
                "full_name": "Expiry Tester",
                "email": "expiry@ogrenci.edu.tr",
                "password": "Password123",
            },
        )
        fp = c.post("/api/auth/forgot-password", json={"email": "expiry@ogrenci.edu.tr"})
        tok = fp.get_json()["reset_token"]
        time.sleep(0.05)
        rp = c.post(
            "/api/auth/reset-password",
            json={"token": tok, "new_password": "UpdatedPassword1"},
        )
        self.assertEqual(rp.status_code, 400)


if __name__ == "__main__":
    unittest.main()
