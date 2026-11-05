// Account changes that PocketBase's generic auth-record update cannot do for the owner.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 400 response in PocketBase's standard shape: { message, data: { field: { code, message } } }. */
function invalid(field, code, message) {
  return { status: 400, body: { status: 400, message, data: { [field]: { code, message } } } };
}

/**
 * Change the signed-in staff member's login email after re-checking the current password.
 * PocketBase only lets superusers (or the e-mail confirmation flow) change `email`, so the
 * update is done here with app-level privileges once the password is verified.
 * Returns { status, body } so validation errors keep the standard PocketBase error shape.
 */
function changeEmail(app, staffId, body) {
  require(__hooks + "/lib/validation.js").keys(body, ["email", "password"]);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return invalid("email", "invalid_email", "Email không hợp lệ.");
  }
  if (!password || password.length > 1024) {
    return invalid("password", "required", "Nhập mật khẩu hiện tại.");
  }
  const record = app.findRecordById("staff", staffId);
  if (!record.validatePassword(password)) {
    return invalid("password", "invalid_password", "Mật khẩu hiện tại không đúng.");
  }
  if (record.email() === email) return { status: 200, body: { email } };

  let taken = false;
  try {
    taken = app.findAuthRecordByEmail("staff", email).id !== record.id;
  } catch (_) {
    taken = false; // not found → available
  }
  if (taken) {
    return invalid("email", "email_taken", "Email này đã được dùng cho tài khoản khác.");
  }
  record.setEmail(email);
  app.save(record);
  return { status: 200, body: { email } };
}

module.exports = { changeEmail };
