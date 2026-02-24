// src/emails/ResetPasswordEmail.tsx
import * as React from "react";

export default function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", lineHeight: 1.5 }}>
      <h2>Password reset</h2>
      <p>Click the link below to set a new password (valid for 30 minutes):</p>
      <p>
        <a href={resetUrl}>{resetUrl}</a>
      </p>
      <p>If you didn’t request this, you can ignore this email.</p>
    </div>
  );
}