// src/lib/money-client.ts
export function formatMoneyCentsClient(
  cents: number,
  opts: { currency?: string } = {}
): string {
  const symbol = opts.currency ?? "€";
  const amount = (cents / 100).toFixed(2);

  // Keep your layout consistent with the table (amount then symbol)
  // e.g. "30.00€"
  return `${amount}${symbol}`;
}