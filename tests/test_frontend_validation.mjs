import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluatePasswordStrength,
  validateEmail,
  validateLoginForm,
  validatePassword,
  validateRegisterForm,
  validateResetPasswordForm,
} from "../frontend/src/utils/validation.js";

test("validateEmail accepts valid emails and rejects invalid ones", () => {
  assert.equal(validateEmail(""), "E-posta adresi zorunludur.");
  assert.equal(validateEmail("gecersiz-eposta"), "Geçerli bir e-posta adresi giriniz.");
  assert.equal(validateEmail("gokay@ogrenci.edu.tr"), "");
});

test("evaluatePasswordStrength and validatePassword check complexity", () => {
  assert.equal(evaluatePasswordStrength("abc").level, "weak");
  assert.equal(evaluatePasswordStrength("Abcdef12").level, "strong");
  assert.notEqual(validatePassword("kisa"), "");
  assert.equal(validatePassword("GucluSifre1"), "");
});

test("validateRegisterForm validates fullName, email, password, and confirmPassword", () => {
  const invalid = validateRegisterForm({
    fullName: "A",
    email: "bad",
    password: "weak",
    confirmPassword: "other",
  });
  assert.ok(invalid.fullName);
  assert.ok(invalid.email);
  assert.ok(invalid.password);
  assert.ok(invalid.confirmPassword);

  const valid = validateRegisterForm({
    fullName: "Şevket Gökay Beslem",
    email: "gokay@ogrenci.edu.tr",
    password: "Password123",
    confirmPassword: "Password123",
  });
  assert.deepEqual(valid, {});
});

test("validateLoginForm and validateResetPasswordForm validate inputs cleanly", () => {
  assert.deepEqual(
    validateLoginForm({ email: "emin@ogrenci.edu.tr", password: "Password123" }),
    {}
  );
  assert.ok(validateResetPasswordForm({ token: "", newPassword: "123", confirmPassword: "456" }).token);
  assert.deepEqual(
    validateResetPasswordForm({
      token: "sample-token",
      newPassword: "NewPassword123",
      confirmPassword: "NewPassword123",
    }),
    {}
  );
});
