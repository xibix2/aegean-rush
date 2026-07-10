import * as React from "react";

type TicketLine = {
  label: string;
  quantity: number;
  priceCents: number;
};

export default function BookingConfirmed({
  activity,
  startISO,
  endISO,
  partySize,
  totalCents,
  clubName,
  logoUrl,
  bookingToken,
  brandPrimary,
  customerName,
  arrivalText,
  tickets,
}: {
  activity: string;
  startISO: string;
  endISO: string;
  partySize: number;
  totalCents: number;
  clubName: string;
  logoUrl?: string | null;
  bookingToken?: string;
  brandPrimary?: string | null;
  customerName?: string | null;
  arrivalText?: string | null;
  tickets?: TicketLine[];
}) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const color = brandPrimary || "#ec4899";
  const timeZone = "Europe/Athens";

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(start);

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const timeLabel = `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  const total = `EUR ${(totalCents / 100).toFixed(2)}`;
  const greeting = customerName?.trim()
    ? `Hi ${customerName.trim()},`
    : "Hi there,";
  const resolvedArrivalText =
    arrivalText ||
    "Please arrive 10-15 minutes before your activity start time for check-in and preparation.";

  const rowLabelStyle: React.CSSProperties = {
    margin: "0 0 4px",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: 700,
  };

  const rowValueStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 15,
    lineHeight: "22px",
    color: "#0f172a",
    fontWeight: 700,
  };

  return (
    <div
      style={{
        margin: 0,
        padding: "28px 12px",
        backgroundColor: "#eef8fb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 620,
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: 24,
          backgroundColor: "#ffffff",
          border: "1px solid #dbeafe",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
        }}
      >
        <div
          style={{
            padding: "24px 24px 22px",
            color: "#ffffff",
            background: `linear-gradient(135deg, ${color}, #06b6d4)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={clubName}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,0.55)",
                  backgroundColor: "rgba(255,255,255,0.16)",
                }}
              />
            ) : null}
            <div>
              <p
                style={{
                  margin: "0 0 5px",
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 800,
                  opacity: 0.9,
                }}
              >
                Booking confirmed
              </p>
              <h1 style={{ margin: 0, fontSize: 26, lineHeight: "31px" }}>
                You are booked
              </h1>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 16,
              lineHeight: "25px",
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            {greeting}
          </p>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 15,
              lineHeight: "24px",
              color: "#475569",
            }}
          >
            Thank you for booking with {clubName}. Your activity is confirmed
            and your spot is reserved.
          </p>

          <div
            style={{
              borderRadius: 18,
              border: "1px solid #dbeafe",
              backgroundColor: "#f8fafc",
              padding: 18,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <p style={rowLabelStyle}>Activity</p>
              <p style={{ ...rowValueStyle, fontSize: 18 }}>{activity}</p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div>
                <p style={rowLabelStyle}>Date</p>
                <p style={rowValueStyle}>{dateLabel}</p>
              </div>
              <div>
                <p style={rowLabelStyle}>Time</p>
                <p style={rowValueStyle}>{timeLabel}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                  Greek local time
                </p>
              </div>
              <div>
                <p style={rowLabelStyle}>Guests</p>
                <p style={rowValueStyle}>{partySize}</p>
              </div>
              <div>
                <p style={rowLabelStyle}>Total paid</p>
                <p style={{ ...rowValueStyle, color }}>{total}</p>
              </div>
            </div>

            {tickets && tickets.length > 0 ? (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <p style={rowLabelStyle}>Tickets</p>
                {tickets.map((ticket) => (
                  <p
                    key={ticket.label}
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      color: "#334155",
                    }}
                  >
                    {ticket.quantity} x {ticket.label} - EUR{" "}
                    {(ticket.priceCents / 100).toFixed(2)}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div
            style={{
              marginTop: 18,
              borderRadius: 18,
              border: "1px solid #bae6fd",
              backgroundColor: "#ecfeff",
              padding: 18,
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 14,
                color: "#0e7490",
                fontWeight: 800,
              }}
            >
              Arrival instructions
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: "24px",
                color: "#155e75",
              }}
            >
              {resolvedArrivalText}
            </p>
          </div>

          {bookingToken ? (
            <div
              style={{
                marginTop: 18,
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                padding: 16,
                textAlign: "center",
              }}
            >
              <p style={rowLabelStyle}>Booking reference</p>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  letterSpacing: "0.04em",
                  color: "#0f172a",
                  fontWeight: 800,
                  wordBreak: "break-all",
                }}
              >
                {bookingToken}
              </p>
            </div>
          ) : null}

          <p
            style={{
              margin: "20px 0 0",
              fontSize: 13,
              lineHeight: "21px",
              color: "#64748b",
            }}
          >
            Bring this email with you. If you have questions or need to change
            something, reply to this email and the team will help you.
          </p>
        </div>
      </div>
    </div>
  );
}
