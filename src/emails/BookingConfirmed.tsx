import * as React from "react";

export default function BookingConfirmed({
  activity,
  startISO,
  endISO,
  partySize,
  totalCents,
  clubName,
  logoUrl,
  brandPrimary,
  manageBookingUrl,
}: {
  activity: string;
  startISO: string;
  endISO: string;
  partySize: number;
  totalCents: number;
  clubName: string;
  logoUrl?: string | null;
  brandPrimary?: string | null;
  manageBookingUrl: string;
}) {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const color = brandPrimary || "#22c55e";

  const formatterDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formatterTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const dateLabel = formatterDate.format(start);
  const timeLabel = sameDay
    ? `${formatterTime.format(start)} – ${formatterTime.format(end)}`
    : `${formatterTime.format(start)} – ${formatterTime.format(
        end
      )} (next day)`;

  const totalEuros = (totalCents || 0) / 100;

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#020617",
        maxWidth: 520,
        margin: "0 auto",
        padding: "0 16px 24px",
        backgroundColor: "#020617",
      }}
    >
      <div
        style={{
          backgroundColor: "#0b1220",
          borderRadius: 16,
          padding: 20,
          border: "1px solid rgba(148, 163, 184, 0.4)",
          boxShadow: "0 18px 45px rgba(15,23,42,0.7)",
        }}
      >
        <div
          style={{
            height: 4,
            borderRadius: 999,
            backgroundImage: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            marginBottom: 16,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#e5e7eb",
                marginBottom: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Booking confirmed
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#f9fafb",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Your activity is confirmed 🎉
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              {clubName}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 8,
            borderRadius: 14,
            background:
              "radial-gradient(circle at 0% 0%, rgba(34,197,94,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(56,189,248,0.18), transparent 55%)",
            border: "1px solid rgba(148,163,184,0.5)",
            padding: 14,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#9ca3af",
                marginBottom: 2,
              }}
            >
              Activity
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#f9fafb",
              }}
            >
              {activity}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr)",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#9ca3af",
                  marginBottom: 2,
                }}
              >
                When
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#e5e7eb",
                }}
              >
                {dateLabel}
                <span style={{ opacity: 0.75 }}> · </span>
                {timeLabel}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#9ca3af",
                  marginBottom: 2,
                }}
              >
                Details
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#e5e7eb",
                  marginBottom: 2,
                }}
              >
                Guests: <span style={{ fontWeight: 500 }}>{partySize}</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#e5e7eb",
                }}
              >
                Total:{" "}
                <span
                  style={{
                    fontWeight: 600,
                    color,
                  }}
                >
                  €{totalEuros.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#e5e7eb",
            lineHeight: 1.5,
          }}
        >
          <p style={{ margin: "0 0 8px" }}>
            Please arrive <span style={{ fontWeight: 500 }}>10 minutes early</span>{" "}
            so there’s enough time for check-in and any pre-activity preparation
            at <span style={{ fontWeight: 500 }}>{clubName}</span>.
          </p>
          <p style={{ margin: 0 }}>
            Bring this email with you in case your booking needs to be verified.
            Follow any instructions shared by the operator before arrival.
          </p>
        </div>

        <div style={{ marginTop: 18 }}>
          <a
            href={manageBookingUrl}
            style={{
              display: "inline-block",
              padding: "11px 16px",
              borderRadius: 12,
              background: color,
              color: "#ffffff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Manage booking
          </a>
        </div>

        <hr
          style={{
            marginTop: 20,
            marginBottom: 10,
            border: "none",
            borderTop: "1px solid rgba(55,65,81,0.9)",
          }}
        />

        <p
          style={{
            fontSize: 11,
            color: "#9ca3af",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          If you have any questions or need to make a change, simply reply to
          this email and <span style={{ fontWeight: 500 }}>{clubName}</span>{" "}
          will get back to you.
        </p>

        <p
          style={{
            fontSize: 10,
            color: "#6b7280",
            marginTop: 10,
          }}
        >
          Thank you for booking with {clubName}. We hope you have an amazing
          experience. 🌊
        </p>
      </div>
    </div>
  );
}