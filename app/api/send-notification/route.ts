import { NextResponse } from "next/server";
import { Resend } from "resend";
import Twilio from "twilio";

import { sendNotificationSchema } from "@/lib/validations/schemas";

function authorize(request: Request) {
  const header = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  return Boolean(secret && header === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = sendNotificationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const results: Record<string, string> = {};

  if (parsed.data.toEmail && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Smart Waste <ops@notifications.local>",
      to: parsed.data.toEmail,
      subject: parsed.data.subject ?? "Operations notice",
      text: parsed.data.bodyText,
    });
    results.email = "queued";
  }

  const twilioConfigured =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER;

  if (parsed.data.toPhoneE164 && twilioConfigured) {
    const messenger = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

    await messenger.messages.create({
      body: parsed.data.bodyText,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: parsed.data.toPhoneE164,
    });
    results.sms = "queued";
  }

  return NextResponse.json({
    dispatched: Object.keys(results).length > 0,
    channels: results,
  });
}
