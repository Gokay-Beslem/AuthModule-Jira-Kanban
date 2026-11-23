import { useState } from "react";

/**
 * Reusable accessible form input with optional password visibility toggle and error state.
 */
export default function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  allowToggle = false,
}) {
  const [visible, setVisible] = useState(false);
  const inputType = allowToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-wrapper">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`form-input${allowToggle ? " has-toggle" : ""}${error ? " error" : ""}`}
        />
        {allowToggle && (
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setVisible((prev) => !prev)}
          >
            {visible ? "Gizle" : "Göster"}
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
