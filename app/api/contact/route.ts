import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 4;
const requestLog = new Map<string, number[]>();

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  projectType?: unknown;
  message?: unknown;
  company?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRateLimited(identifier: string) {
  const now = Date.now();
  const recentRequests = (requestLog.get(identifier) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (requestLog.size > 250) {
    for (const [key, timestamps] of requestLog) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)) {
        requestLog.delete(key);
      }
    }
  }

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) return true;
  requestLog.set(identifier, [...recentRequests, now]);
  return false;
}

export async function POST(request: NextRequest) {
  const identifier =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { message: "Too many messages were submitted. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ message: "The submitted form was not valid." }, { status: 400 });
  }

  const name = cleanString(payload.name);
  const email = cleanString(payload.email);
  const projectType = cleanString(payload.projectType);
  const message = cleanString(payload.message);
  const company = cleanString(payload.company);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (company) return NextResponse.json({ message: "Message received." });
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ message: "Please enter a valid name." }, { status: 400 });
  }
  if (email.length > 160 || !emailPattern.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }
  if (!projectType || projectType.length > 80) {
    return NextResponse.json({ message: "Please select a project type." }, { status: 400 });
  }
  if (message.length < 20 || message.length > 3000) {
    return NextResponse.json(
      { message: "Please include between 20 and 3,000 characters in your message." },
      { status: 400 },
    );
  }

  // Delivered by the Google Apps Script in scripts/contact-form.gs, which logs the inquiry
  // to a Google Sheet and emails it. The shared secret keeps others from posting to it.
  const scriptUrl = process.env.CONTACT_SCRIPT_URL;
  const scriptSecret = process.env.CONTACT_SCRIPT_SECRET;
  if (!scriptUrl || !scriptSecret) {
    return NextResponse.json(
      {
        message:
          "Online messaging is being configured. Please email zhyronnebatican@gmail.com directly.",
      },
      { status: 503 },
    );
  }

  let delivered = false;
  try {
    // Apps Script answers a POST with a redirect to the result, which fetch follows.
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: scriptSecret, name, email, projectType, message }),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    delivered = response.ok && result?.ok === true;
  } catch {
    delivered = false;
  }

  if (!delivered) {
    return NextResponse.json(
      { message: "The message service could not deliver your message. Please email me directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ message: "Message sent successfully." });
}
