export const GROQ_MODEL = "openai/gpt-oss-20b";

export const SYSTEM_PROMPT =
  "You are a concise, accurate study assistant for an MCA batch. Always answer in Markdown with headings and short bullets. Keep answers exam-focused, practical and respectful.";

export type AIMode = "five-mark" | "real-world" | "viva" | "hod-report";

export interface AIRequest {
  mode?: AIMode;
  subject?: string;
  question?: string;
  category?: string;
  date?: string;
  consensus?: string;
}

export function promptFor(request: AIRequest) {
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
