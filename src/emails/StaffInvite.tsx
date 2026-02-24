// src/emails/StaffInvite.tsx
import * as React from "react";

export default function StaffInviteEmail(props: {
  clubName: string;
  inviteUrl: string;
  roleLabel: string;
}) {
  const { clubName, inviteUrl, roleLabel } = props;

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        backgroundColor: "#050711",
        color: "#f9fafb",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background:
            "radial-gradient(circle at top, rgba(124, 58, 237, 0.18), transparent 55%) #050711",
          borderRadius: 18,
          padding: "28px 24px 24px",
          border: "1px solid rgba(148, 163, 184, 0.24)",
        }}
      >
        <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>
          You’re invited to join <span style={{ color: "#a855f7" }}>{clubName}</span>
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>
          You’ve been invited to access the{" "}
          <strong>{clubName}</strong> dashboard as{" "}
          <strong>{roleLabel}</strong>.
        </p>

        <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
          Click the button below to accept the invite and create your login.
        </p>

        <p style={{ textAlign: "center", margin: "0 0 20px" }}>
          <a
            href={inviteUrl}
            style={{
              display: "inline-block",
              padding: "9px 20px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              color: "#050711",
              background:
                "linear-gradient(90deg, #22c55e, #4ade80, #22c55e)",
            }}
          >
            Accept invite
          </a>
        </p>

        <p
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            margin: "0",
            color: "#9ca3af",
          }}
        >
          If the button doesn’t work, copy and paste this link into your browser:
          <br />
          <span style={{ wordBreak: "break-all" }}>{inviteUrl}</span>
        </p>
      </div>

      <p
        style={{
          marginTop: 18,
          fontSize: 11,
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        If you weren’t expecting this email, you can safely ignore it.
      </p>
    </div>
  );
}
