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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
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
  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "Online messaging is being configured. Please email zhyronnebatican@gmail.com directly.",
      },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO_EMAIL ?? "zhyronnebatican@gmail.com"],
      reply_to: email,
      subject: `Portfolio inquiry: ${projectType} — ${name}`,
      html: `
        <h2>New portfolio inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Project type:</strong> ${escapeHtml(projectType)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "The email service could not deliver your message. Please email me directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ message: "Message sent successfully." });
}
