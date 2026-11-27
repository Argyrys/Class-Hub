import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Kept self-contained so Vercel bundles the serverless function without a
// shared source file outside api/. The Firebase Cloud Function uses the same
// values from functions/prompt.ts.
const GROQ_MODEL = "openai/gpt-oss-20b";
const SYSTEM_PROMPT =
  "You are a concise, accurate study assistant for an MCA batch. Always answer in Markdown with headings and short bullets. Keep answers exam-focused, practical and respectful.";

type AIMode = "five-mark" | "real-world" | "viva" | "hod-report";

interface AIRequest {
  mode?: AIMode;
  subject?: string;
  question?: string;
  category?: string;
  date?: string;
  consensus?: string;
}

function promptFor(request: AIRequest) {
  const subject = request.subject?.trim() || "General";
  const question = request.question?.trim() || subject;
  const base = `Subject: ${subject}. Answer in Markdown.`;

  if (request.mode === "five-mark") {
    return `${base} Generate concise 5-mark exam notes for: ${question}. Include a definition, 4-5 key points, one small example and a one-line conclusion.`;
  }
  if (request.mode === "real-world") {
    return `${base} Explain ${question} with one clear real-world example, then add a short pseudocode or code snippet where useful. Finish with the exam angle.`;
  }
  if (request.mode === "viva") {
    return `${base} Generate 5 expected viva questions and short answers for: ${question}. Number them Q1-Q5.`;
  }
  return `${base} Draft a formal, respectful representation letter to the Head of Department (MCA) from the MCA batch. Do not name any individual student. Issue: ${question}. Category: ${request.category || "Academic"}. Date: ${request.date || "current session"}. Student support: ${request.consensus || "a majority of students"}.`;
}

const MODES = new Set<AIMode>(["five-mark", "real-world", "viva", "hod-report"]);

interface AuthResult {
  uid?: string;
  error?: string;
  status?: number;
}

async function verifyAuth(req: VercelRequest): Promise<AuthResult> {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  // Demo mode: no Firebase Admin credentials configured.
  if (!serviceAccount) return {};

  try {
    if (!getApps().length) {
      initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
    }
  } catch {
    return { error: "Server auth is misconfigured", status: 500 };
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { error: "Missing auth token", status: 401 };

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return { error: "Invalid auth token", status: 401 };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Graceful fallback: the client uses its built-in templates.
    res.status(200).json({ available: false });
    return;
  }

  const auth = await verifyAuth(req);
  if (auth.error) {
    res.status(auth.status || 401).json({ error: auth.error });
    return;
  }

  const body = (req.body || {}) as AIRequest;
  const mode = body.mode && MODES.has(body.mode) ? body.mode : "five-mark";
  const request: AIRequest = {
    mode,
    subject: String(body.subject || "General").slice(0, 200),
    question: String(body.question || "").slice(0, 2000),
    category: String(body.category || "").slice(0, 200),
    date: String(body.date || "").slice(0, 100),
    consensus: String(body.consensus || "").slice(0, 100),
  };

  // In secured mode, HOD reports remain CR-only.
  if (mode === "hod-report" && auth.uid) {
    const caller = await getFirestore().doc(`users/${auth.uid}`).get();
    if (caller.data()?.role !== "cr") {
      res.status(403).json({ error: "CR role required" });
      return;
    }
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: promptFor(request) },
      ],
      temperature: 0.4,
      max_completion_tokens: 1800,
    }),
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    res.status(429).json({
      error: retryAfter
        ? `Groq rate limit reached. Retry in ${retryAfter}s.`
        : "Groq rate limit reached. Please retry shortly.",
    });
    return;
  }

  if (!response.ok) {
    res.status(502).json({ error: `Groq request failed (${response.status})` });
    return;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  if (!text) {
    res.status(502).json({ error: "Groq returned an empty answer" });
    return;
  }

  res.status(200).json({ text });
}
