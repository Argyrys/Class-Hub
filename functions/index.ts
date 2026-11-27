import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { GROQ_MODEL, SYSTEM_PROMPT, promptFor, type AIRequest } from "./prompt";

initializeApp();

const db = getFirestore();
const groqKey = defineSecret("GROQ_API_KEY");

export const aiTutor = onRequest(
  { secrets: [groqKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "Missing auth token" });
      return;
    }

    let uid: string;
    try {
      uid = (await getAuth().verifyIdToken(token)).uid;
    } catch {
      res.status(401).json({ error: "Invalid auth token" });
      return;
    }

    const request = (req.body || {}) as AIRequest;

    // HOD reports are a CR-only action.
    if (request.mode === "hod-report") {
      const caller = await db.collection("users").doc(uid).get();
      if (caller.data()?.role !== "cr") {
        res.status(403).json({ error: "CR role required" });
        return;
      }
    }

    // No app-level daily quota: Groq's own generous rate limits apply.
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey.value()}`,
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
      const details = await response.text().catch(() => "");
      console.error("Groq request failed", response.status, details.slice(0, 500));
      res.status(502).json({ error: "Groq request failed" });
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

    res.json({ text });
  }
);
