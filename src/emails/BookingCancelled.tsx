import * as React from "react";

export default function BookingCancelledEmail(props: {
  clubName: string;
  activity: string;
  dateLabel: string;
  reason?: string;
  logoUrl?: string;
  brandPrimary?: string;
}) {
  const {
    clubName,
    activity,
    dateLabel,
    reason,
    logoUrl,
    brandPrimary = "#ec4899",
  } = props;

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        backgroundColor: "#050711",
        color: "#f9fafb",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background:
            "radial-gradient(circle at top, rgba(236, 72, 153, 0.14), transparent 55%) #0b1020",
          borderRadius: 18,
          padding: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        {logoUrl ? (
          <div style={{ marginBottom: 18 }}>
            <img
              src={logoUrl}
              alt={clubName}
              style={{
                maxHeight: 44,
                maxWidth: 180,
                objectFit: "contain",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.28)",
            color: "#fecaca",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Booking cancelled
        </div>

        <h1
          style={{
            fontSize: 28,
            lineHeight: 1.15,
            margin: "0 0 12px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Your booking has been cancelled
        </h1>

        <p
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.82)",
            margin: "0 0 16px",
          }}
        >
          We wanted to let you know that your booking with{" "}
          <strong style={{ color: "#fff" }}>{clubName}</strong> for{" "}
          <strong style={{ color: "#fff" }}>{activity}</strong> on{" "}
          <strong style={{ color: "#fff" }}>{dateLabel}</strong> has been cancelled.
        </p>

        {reason ? (
          <div
            style={{
              marginTop: 18,
              marginBottom: 18,
              padding: 16,
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: "rgba(255,255,255,0.55)",
                marginBottom: 8,
              }}
            >
              Reason
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.88)",
                whiteSpace: "pre-wrap",
              }}
            >
              {reason}
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 14,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Please contact {clubName} if you need help rebooking or have any questions.
        </div>

        <div
          style={{
            marginTop: 20,
            height: 3,
            width: 120,
            borderRadius: 999,
            background: `linear-gradient(90deg, transparent, ${brandPrimary}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}