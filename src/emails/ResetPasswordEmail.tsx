// src/emails/ResetPasswordEmail.tsx
import * as React from "react";

export default function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: "#020617",
        padding: "24px 16px",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          backgroundColor: "#0b1220",
          borderRadius: 16,
          padding: 20,
          border: "1px solid rgba(148,163,184,0.4)",
          boxShadow: "0 18px 45px rgba(15,23,42,0.7)",
        }}
      >
        {/* Title */}
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: 18,
            fontWeight: 600,
            color: "#f9fafb",
          }}
        >
          Reset your password
        </h2>

        {/* Description */}
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 14,
            color: "#d1d5db",
          }}
        >
          We received a request to reset your password. Click the button below to
          set a new one. This link will expire in 30 minutes.
        </p>

        {/* Button */}
        <div style={{ marginBottom: 16 }}>
          <a
            href={resetUrl}
            style={{
              display: "inline-block",
              padding: "10px 16px",
              borderRadius: 10,
              background:
                "linear-gradient(135deg, #22c55e, #38bdf8)",
              color: "#020617",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Reset password
          </a>
        </div>

        {/* Fallback link */}
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            wordBreak: "break-all",
            marginBottom: 16,
          }}
        >
          If the button doesn’t work, copy and paste this link into your browser:
          <br />
          <a href={resetUrl} style={{ color: "#38bdf8" }}>
            {resetUrl}
          </a>
        </p>

        {/* Footer */}
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            margin: 0,
          }}
        >
          If you didn’t request a password reset, you can safely ignore this
          email.
        </p>
      </div>
    </div>
  );
}