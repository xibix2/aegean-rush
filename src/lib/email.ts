import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

// Default FROM – used when a club has not set a custom sender
export const FROM =
  process.env.FROM_EMAIL ?? "Tennis Booking <onboarding@resend.dev>";