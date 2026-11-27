import type { AIMode } from "../types";
import { callAITutor, getAIIdToken } from "./firebase";

interface AIRequest {
  mode: AIMode;
  subject: string;
  question: string;
  category?: string;
  date?: string;
  consensus?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fiveMarkNotes(subject: string) {
  return `## ${subject} — 5 Mark Exam Notes\n\n### 1. Core Definition\nDefine the key term in one sentence, then add one line on why it matters in ${subject}.\n\n### 2. Key Characteristics\n- Explain the main property with a short example.\n- Contrast it with the closest related concept.\n- Mention one exam-friendly keyword.\n\n### 3. Process / Steps\n1. Identify the input and required output.\n2. Apply the standard algorithm or rule.\n3. Verify with a small example.\n\n### 4. Advantages & Limitations\n**Advantages:** simple, predictable, easy to implement.\n**Limitations:** may not scale efficiently for large inputs.\n\n### 5. One-Line Conclusion\nA short summary-style takeaway: connect the concept to a real MCA exam question.`;
}

function realWorld(subject: string) {
  return `## ${subject} — Real-World Example\n\nThink of a **library issue counter**.\n\n- A student requests a book.\n- The system checks availability.\n- If available, the book is issued; otherwise the request waits.\n\nIn ${subject}, this maps to a request → validation → state change → response flow.\n\n\`\`\`text\nrequest -> validate -> process -> respond\n\`\`\`\n\n**Exam angle:** always describe the state before, the transition, and the final state.`;
}

function viva(subject: string) {
  return `## ${subject} — 5 Expected Viva Q&As\n\n**Q1. Define the core concept.**\nA: Give a precise one-sentence definition and one example.\n\n**Q2. Where is it used in practice?**\nA: Mention one real application such as databases, scheduling, or networking.\n\n**Q3. What is the main advantage?**\nA: Explain the efficiency or simplicity it adds.\n\n**Q4. What is a common mistake?**\nA: Confusing it with a related concept; state the difference.\n\n**Q5. How would you implement it?**\nA: Describe the algorithm steps and expected output.`;
}

function hodReport({ category, date, consensus, question }: AIRequest) {
  const safeCategory = category || "Academic / Infrastructure";
  const safeDate = date || "the current academic session";
  const safeConsensus = consensus || "a majority of students";
  return `To\nThe Head of Department (MCA)\n[College Name]\n\nSubject: Representation regarding ${safeCategory}\n\nRespected Sir/Madam,\n\nOn behalf of the MCA batch, we respectfully submit this representation regarding the issue stated below. The matter was discussed collectively and ${safeConsensus} have expressed support for bringing it to your kind attention.\n\n**Issue:** ${question || "A shared academic or infrastructure concern."}\n\n**Category:** ${safeCategory}\n\n**Date of submission:** ${safeDate}\n\nWe request your kind intervention to review the matter and take suitable action at the earliest convenience. This representation is submitted in a constructive spirit and does not name any individual student.\n\nThank you for your time and consideration.\n\nYours sincerely,\nOn behalf of the MCA Batch\n(Class Representative)`;
}

export async function askAI(request: AIRequest): Promise<string> {
  // Same path in local dev (Vite middleware), Vercel (serverless function),
  // and Firebase Hosting (Cloud Function). Firebase ID token is sent when available.
  const idToken = await getAIIdToken();
  const data = await callAITutor(request, idToken).catch(() => null) as
    | { text?: string; error?: string; available?: boolean }
    | null;
  if (data?.text?.trim()) return data.text.trim();
  if (data?.error && data.available !== false) throw new Error(data.error);

  // Mock-first fallback keeps the prototype usable with no credentials.
  await delay(750);
  if (request.mode === "real-world") return realWorld(request.subject);
  if (request.mode === "viva") return viva(request.subject);
  if (request.mode === "hod-report") return hodReport(request);
  return fiveMarkNotes(request.subject);
}
