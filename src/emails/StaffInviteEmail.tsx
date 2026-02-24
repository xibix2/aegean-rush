// src/emails/StaffInviteEmail.tsx
import * as React from "react";

export default function StaffInviteEmail(props: {
  clubName: string;
  roleLabel: string;
  inviteLink: string;
  expiresAtISO: string;
  token: string;
}) {
  const { clubName, roleLabel, inviteLink, expiresAtISO, token } = props;
  const expires = new Date(expiresAtISO);

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", lineHeight: 1.5 }}>
      <h2>You've been invited to {clubName}</h2>
      <p>
        You’ve been invited to join the{" "}
        <strong>{clubName}</strong> dashboard as{" "}
        <strong>{roleLabel}</strong>.
      </p>

      <p>
        To continue, click the button below. The full onboarding flow
        (password &amp; account setup) may still be in testing.
      </p>

      <p style={{ margin: "16px 0" }}>
        <a
          href={inviteLink}
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: "999px",
            background: "#16a34a",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Open invite
        </a>
      </p>

      <p>
        This invite link will expire on{" "}
        <strong>{expires.toLocaleString()}</strong>.
      </p>

      <p style={{ fontSize: 12, color: "#666", marginTop: 24 }}>
        For testing / support, your invite token is:
        <br />
        <code
          style={{
            padding: "4px 6px",
            borderRadius: 4,
            background: "#f3f4f6",
            display: "inline-block",
            marginTop: 4,
          }}
        >
          {token}
        </code>
      </p>
    </div>
  );
}