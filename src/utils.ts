import type { Attendance, DBShape } from "./types";

export function makeId(prefix = "id") {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

export function formatDate(value: number) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

export function formatTime(value: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(value);
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  el.remove();
}

export function attendanceMath(attended: number, total: number) {
  const percentage = total > 0 ? (attended / total) * 100 : 0;
  const safeBunks = Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
  const neededClasses = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
  const tone = percentage >= 80 ? "safe" : percentage >= 75 ? "warn" : "danger";
  const message = percentage >= 75
    ? `You can safely bunk ${safeBunks} more classes.`
    : `Attend the next ${neededClasses} classes straight to reach 75%.`;
  return { percentage, safeBunks, neededClasses, tone, message };
}

export function attendanceFor(db: DBShape, rollNo: string): Attendance {
  return db.attendance.find((item) => item.rollNo === rollNo) || { rollNo, attended: 0, total: 0 };
}
