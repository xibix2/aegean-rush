// src/lib/reports/generateStatsPdf.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Creates a clean, professional analytics PDF report with charts.
 */
export async function generateStatsPDF({
  clubName,
  brandColor = "#6d28d9",
  rangeLabel,
  totals,
  byDay,
  byActivity,
}: {
  clubName: string;
  brandColor?: string;
  rangeLabel: string;
  totals: {
    revenue: number;
    refunds: number;
    seats: number;
    paidBookings: number;
    bookings: number;
    utilization: number;
    conversion: number;
  };
  byDay: { date: string; revenueCents: number; seats: number }[];
  byActivity: { name: string; revenueCents: number }[];
}) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  const marginX = 40;
  let y = height - 40;

  // ---------- helpers ----------
  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "");
    const int = parseInt(clean, 16) || 0;
    return {
      r: ((int >> 16) & 255) / 255,
      g: ((int >> 8) & 255) / 255,
      b: (int & 255) / 255,
    };
  };
  const accent = hexToRgb(brandColor);

  const text = (txt: string, size: number, x: number, yy: number, opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}) => {
    page.drawText(txt, {
      x,
      y: yy,
      size,
      font: opts.bold ? bold : font,
      color: opts.color ?? rgb(0.15, 0.15, 0.2),
    });
  };

  const drawSummaryCard = (opts: {
    x: number;
    yTop: number;
    w: number;
    h: number;
    label: string;
    value: string;
  }) => {
    const { x, yTop, w, h, label, value } = opts;
    const yBottom = yTop - h;

    // card background
    page.drawRectangle({
      x,
      y: yBottom,
      width: w,
      height: h,
      color: rgb(0.97, 0.98, 1),
      borderColor: rgb(0.85, 0.87, 0.95),
      borderWidth: 0.7,
    });

    text(label, 9, x + 8, yTop - 14, {
      color: rgb(0.45, 0.47, 0.6),
    });
    text(value, 12, x + 8, yTop - 30, {
      bold: true,
      color: rgb(0.1, 0.12, 0.25),
    });
  };

  // ---------- Header ----------
  // top accent line
  page.drawRectangle({
    x: 0,
    y: height - 8,
    width,
    height: 4,
    color: rgb(accent.r, accent.g, accent.b),
  });

  text(`${clubName} — Analytics Report`, 20, marginX, y, {
    bold: true,
    color: rgb(accent.r, accent.g, accent.b),
  });
  y -= 22;
  text(rangeLabel, 10, marginX, y, { color: rgb(0.35, 0.36, 0.45) });
  y -= 26;

  // ---------- Summary grid ----------
  text("Summary", 12, marginX, y, {
    bold: true,
    color: rgb(accent.r, accent.g, accent.b),
  });
  y -= 8;

  const colGap = 14;
  const cardW = (width - marginX * 2 - colGap) / 2;
  const cardH = 52;

  let rowTop = y - 6;

  const summaryRows: Array<[string, string]> = [
    ["Revenue", `€${totals.revenue.toFixed(2)}`],
    ["Refunds", `€${totals.refunds.toFixed(2)}`],
    ["Net revenue", `€${(totals.revenue - totals.refunds).toFixed(2)}`],
    ["Paid bookings", `${totals.paidBookings}`],
    ["All bookings", `${totals.bookings}`],
    ["Seats sold", `${totals.seats}`],
    ["Utilization", `${(totals.utilization * 100).toFixed(1)}%`],
    ["Conversion", `${(totals.conversion * 100).toFixed(1)}%`],
  ];

  for (let i = 0; i < summaryRows.length; i += 2) {
    const [l1, v1] = summaryRows[i];
    const [l2, v2] = summaryRows[i + 1];

    drawSummaryCard({
      x: marginX,
      yTop: rowTop,
      w: cardW,
      h: cardH,
      label: l1,
      value: v1,
    });
    drawSummaryCard({
      x: marginX + cardW + colGap,
      yTop: rowTop,
      w: cardW,
      h: cardH,
      label: l2,
      value: v2,
    });

    rowTop -= cardH + 10;
  }

  // set y under summary grid
  y = rowTop - 14;

  // ---------- Revenue by day chart ----------
  text("Revenue by day", 11, marginX, y, {
    bold: true,
    color: rgb(accent.r, accent.g, accent.b),
  });
  y -= 8;

  const chartHeight = 150;
  const chartWidth = width - marginX * 2;
  const chartBottom = y - chartHeight;
  const chartLeft = marginX;

  // chart frame
  page.drawRectangle({
    x: chartLeft,
    y: chartBottom,
    width: chartWidth,
    height: chartHeight,
    borderWidth: 0.7,
    borderColor: rgb(0.86, 0.88, 0.96),
    color: rgb(0.985, 0.987, 1),
  });

  if (!byDay.length || byDay.every((d) => d.revenueCents === 0)) {
    text("No revenue data in this period.", 10, chartLeft + 12, chartBottom + chartHeight / 2, {
      color: rgb(0.55, 0.57, 0.7),
    });
  } else {
    const maxRevenue = Math.max(...byDay.map((d) => d.revenueCents / 100), 1);
    const stepX =
      byDay.length === 1 ? 0 : chartWidth / (byDay.length - 1);

    // horizontal grid lines (4 levels)
    const gridLevels = 4;
    for (let i = 1; i <= gridLevels; i++) {
      const yy = chartBottom + (chartHeight * i) / (gridLevels + 1);
      page.drawLine({
        start: { x: chartLeft + 4, y: yy },
        end: { x: chartLeft + chartWidth - 4, y: yy },
        thickness: 0.4,
        color: rgb(0.9, 0.9, 0.96),
      });
    }

    // polyline for revenue
    let prevX: number | null = null;
    let prevY: number | null = null;

    byDay.forEach((d, idx) => {
      const value = d.revenueCents / 100;
      const ratio = value / maxRevenue;
      const px = chartLeft + idx * stepX;
      const py = chartBottom + ratio * (chartHeight - 18) + 6;

      // join with previous point
      if (prevX != null && prevY != null) {
        page.drawLine({
          start: { x: prevX, y: prevY },
          end: { x: px, y: py },
          thickness: 1.5,
          color: rgb(accent.r, accent.g, accent.b),
        });
      }
      prevX = px;
      prevY = py;

      // dot
      page.drawCircle({
        x: px,
        y: py,
        size: 2.2,
        color: rgb(1, 1, 1),
        borderColor: rgb(accent.r, accent.g, accent.b),
        borderWidth: 1,
      });
    });

    // simple x-axis labels (for at most ~10 ticks, evenly spread)
    const maxLabels = 10;
    const stepLabel = Math.max(1, Math.floor(byDay.length / maxLabels));

    byDay.forEach((d, idx) => {
      if (idx % stepLabel !== 0) return;
      const px = chartLeft + idx * stepX;
      const label = d.date.slice(5); // MM-DD
      text(label, 8, px - 10, chartBottom - 10, {
        color: rgb(0.5, 0.52, 0.65),
      });
    });
  }

  // move y below chart
  y = chartBottom - 32;

  // ---------- Top activities chart ----------
  text("Top activities", 11, marginX, y, {
    bold: true,
    color: rgb(accent.r, accent.g, accent.b),
  });
  y -= 10;

  const barChartHeight = 140;
  const barChartBottom = y - barChartHeight;

  // outer frame
  page.drawRectangle({
    x: marginX,
    y: barChartBottom,
    width: chartWidth,
    height: barChartHeight,
    borderWidth: 0.7,
    borderColor: rgb(0.86, 0.88, 0.96),
    color: rgb(0.985, 0.987, 1),
  });

  if (!byActivity.length) {
    text("No activity data.", 10, marginX + 12, barChartBottom + barChartHeight / 2, {
      color: rgb(0.55, 0.57, 0.7),
    });
  } else {
    const top = byActivity
      .slice()
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 6);

    const maxRev = Math.max(...top.map((a) => a.revenueCents / 100), 1);
    const usableWidth = chartWidth - 140; // leave room for labels and values
    const rowGap = barChartHeight / (top.length + 1);

    top.forEach((a, idx) => {
      const centerY = barChartBottom + rowGap * (idx + 1);

      const value = a.revenueCents / 100;
      const ratio = value / maxRev;
      const barWidth = usableWidth * ratio;

      const labelX = marginX + 12;
      const barX = marginX + 120;

      // activity name
      text(a.name, 9, labelX, centerY + 2, {
        color: rgb(0.3, 0.32, 0.45),
      });

      // bar
      page.drawRectangle({
        x: barX,
        y: centerY - 5,
        width: barWidth,
        height: 10,
        color: rgb(accent.r, accent.g, accent.b),
      });

      // value label
      text(`€${value.toFixed(2)}`, 9, barX + barWidth + 6, centerY + 2, {
        color: rgb(0.25, 0.27, 0.38),
      });
    });
  }

  // ---------- Footer ----------
  const generatedAt = new Date();
  const footer = `Generated on ${generatedAt.toISOString().slice(0, 10)} – Tennis Booking Analytics`;
  text(footer, 7.5, marginX, 24, {
    color: rgb(0.55, 0.57, 0.7),
  });

  return pdf.save();
}
