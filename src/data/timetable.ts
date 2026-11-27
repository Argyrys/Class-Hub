import type { Timetable, TimetableSlot, Weekday } from "../types";

export type { Timetable, TimetableSlot, Weekday };

export interface CollegeTime {
  dayName: Weekday;
  dayIndex: number;
  minutes: number;
  hour: number;
  minute: number;
  dateKey: string;
}

export interface CurrentSlot extends TimetableSlot {
  slotId: string;
  dayName: Weekday;
}

export const COLLEGE_TIME_ZONE = "Asia/Kolkata";
export const COLLEGE_NAME = "Rungta International Skills University, Bhilai (CG)";
export const PROGRAMME = "MCA-AIML-DS-I-B";
export const CLASS_INCHARGE = "Ms. Anjana Panda";
export const AI_AND_ARCHITECTURE_FACULTY = "Ms. Shraddha Advait";

export const DAY_ORDER: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function slot(
  id: string,
  start: number,
  end: number,
  subject?: string,
  faculty?: string,
  room = "SB 14"
): TimetableSlot {
  const format = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return {
    id,
    start,
    end,
    label: `${format(start)} - ${format(end)}`,
    subject,
    faculty,
    room: subject ? room : undefined,
  };
}

export const TIMETABLE: Record<Weekday, TimetableSlot[]> = {
  Monday: [
    slot("m1", 540, 600, "Advanced Database Design and Management", "Ms. Shruti Godamkar"),
    slot("m2", 600, 660, "Computational Maths -I", "Ms. Neta Gupta"),
    slot("m3", 660, 720, "Python Programming for Problem Solving", "Mr. Shushant Kumar"),
    slot("m4", 720, 780, "Communication Proficiency -I", "Vidhyut & Aditya"),
    { ...slot("m-break", 780, 840), label: "13:00 - 14:00", subject: "Lunch / Break", isBreak: true },
    slot("m5", 840, 900, "Advanced Computer Systems and Architecture", AI_AND_ARCHITECTURE_FACULTY),
    slot("m6", 900, 960, "Modern Operating System Design", "Ms. Renu Swarnkar"),
  ],
  Tuesday: [
    slot("t1", 540, 600, "Python Programming for Problem Solving", "Mr. Shushant Kumar"),
    slot("t2", 600, 660, "Python Programming for Problem Solving", "Mr. Shushant Kumar"),
    slot("t3", 660, 720, "Career Development Center Course -I", "Mr. Nem Singh"),
    slot("t4", 720, 780, "Modern Operating System Design", "Ms. Renu Swarnkar"),
    { ...slot("t-break", 780, 840), label: "13:00 - 14:00", subject: "Lunch / Break", isBreak: true },
    slot("t5", 840, 900, "Advanced Database Design and Management", "Ms. Shruti Godamkar"),
    slot("t6", 900, 960, "Communication Proficiency -I", "Vidhyut & Aditya"),
  ],
  Wednesday: [
    slot("w1", 540, 600, "Advanced Computer Systems and Architecture", AI_AND_ARCHITECTURE_FACULTY),
    slot("w2", 600, 660, "Modern Operating System Design", "Ms. Renu Swarnkar"),
    { ...slot("w3", 660, 720, "Breather"), isBreak: true },
    slot("w4", 720, 780, "Career Development Center Course -I", "Mr. Nem Singh"),
    { ...slot("w-break", 780, 840), label: "13:00 - 14:00", subject: "Lunch / Break", isBreak: true },
    slot("w5", 840, 900),
    slot("w6", 900, 960),
  ],
  Thursday: [
    slot("h1", 540, 600, "Computational Maths -I", "Ms. Neta Gupta"),
    slot("h2", 600, 660, "Python Programming for Problem Solving", "Mr. Shushant Kumar"),
    slot("h3", 660, 720, "Python Programming for Problem Solving", "Mr. Shushant Kumar"),
    slot("h4", 720, 780, "New Age IT Skills: AI for Everyone", AI_AND_ARCHITECTURE_FACULTY),
    { ...slot("h-break", 780, 840), label: "13:00 - 14:00", subject: "Lunch / Break", isBreak: true },
    slot("h5", 840, 900, "Advanced Database Design and Management", "Ms. Shruti Godamkar"),
    slot("h6", 900, 960, "Modern Operating System Design", "Ms. Renu Swarnkar"),
  ],
  Friday: [
    slot("f1", 540, 600, "Advanced Computer Systems and Architecture", AI_AND_ARCHITECTURE_FACULTY),
    slot("f2", 600, 660, "New Age IT Skills: AI for Everyone", AI_AND_ARCHITECTURE_FACULTY),
    slot("f3", 660, 720, "Career Development Center Course -I", "Mr. Nem Singh"),
    slot("f4", 720, 780, "Computational Maths -I", "Ms. Neta Gupta"),
    { ...slot("f-break", 780, 840), label: "13:00 - 14:00", subject: "Lunch / Break", isBreak: true },
    slot("f5", 840, 900, "Advanced Database Design and Management", "Ms. Shruti Godamkar"),
    slot("f6", 900, 960, "Modern Operating System Design", "Ms. Renu Swarnkar"),
  ],
  Saturday: [
    slot("s1", 540, 600, "Communication Proficiency -I", "Vidhyut & Aditya"),
    slot("s2", 600, 660, "Advanced Database Design and Management", "Ms. Shruti Godamkar"),
    slot("s3", 660, 720),
    slot("s4", 720, 780),
    slot("s5", 840, 900),
    slot("s6", 900, 960),
  ],
  Sunday: [],
};

export const TIMETABLE_SUBJECTS = [
  "Advanced Database Design and Management",
  "Advanced Computer Systems and Architecture",
  "Modern Operating System Design",
  "Python Programming for Problem Solving",
  "Computational Maths -I",
  "New Age IT Skills: AI for Everyone",
  "Career Development Center Course -I",
  "Communication Proficiency -I",
];

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: COLLEGE_TIME_ZONE,
  weekday: "long",
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: COLLEGE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: COLLEGE_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

export function getCollegeTime(now: Date = new Date()): CollegeTime {
  const dayName = weekdayFormatter.format(now) as Weekday;
  const parts = timeFormatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return {
    dayName,
    dayIndex: DAY_ORDER.indexOf(dayName),
    hour,
    minute,
    minutes: hour * 60 + minute,
    dateKey: dateKeyFormatter.format(now),
  };
}

export function cloneTimetable(source: Timetable = TIMETABLE): Timetable {
  return JSON.parse(JSON.stringify(source)) as Timetable;
}

export function getDaySchedule(dayName: Weekday, timetable: Timetable = TIMETABLE): TimetableSlot[] {
  return timetable[dayName] || [];
}

export function getCurrentClassSlot(
  now: Date = new Date(),
  timetable: Timetable = TIMETABLE
): CurrentSlot | null {
  const time = getCollegeTime(now);
  const current = getDaySchedule(time.dayName, timetable).find(
    (entry) => !entry.isBreak && !!entry.subject && time.minutes >= entry.start && time.minutes < entry.end
  );
  if (!current) return null;
  return { ...current, dayName: time.dayName, slotId: `${time.dayName}-${current.id}` };
}

export function getCurrentBreakSlot(
  now: Date = new Date(),
  timetable: Timetable = TIMETABLE
): CurrentSlot | null {
  const time = getCollegeTime(now);
  const current = getDaySchedule(time.dayName, timetable).find(
    (entry) => !!entry.isBreak && time.minutes >= entry.start && time.minutes < entry.end
  );
  if (!current) return null;
  return { ...current, dayName: time.dayName, slotId: `${time.dayName}-${current.id}` };
}

export function getTodayClasses(now: Date = new Date(), timetable: Timetable = TIMETABLE): TimetableSlot[] {
  const time = getCollegeTime(now);
  return getDaySchedule(time.dayName, timetable).filter((entry) => entry.isBreak || !!entry.subject);
}

export function getNextClassSlot(
  now: Date = new Date(),
  timetable: Timetable = TIMETABLE
): CurrentSlot | null {
  const time = getCollegeTime(now);
  const today = getDaySchedule(time.dayName, timetable);
  const later = today.find((entry) => !entry.isBreak && !!entry.subject && entry.start > time.minutes);
  if (later) return { ...later, dayName: time.dayName, slotId: `${time.dayName}-${later.id}` };

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = DAY_ORDER[(time.dayIndex + offset) % DAY_ORDER.length];
    const next = getDaySchedule(nextDay, timetable).find((entry) => !entry.isBreak && !!entry.subject);
    if (next) return { ...next, dayName: nextDay, slotId: `${nextDay}-${next.id}` };
  }
  return null;
}

export function slotIsSubmitted(
  lectures: Array<{ dayKey?: string; slotId?: string }>,
  now: Date = new Date(),
  timetable: Timetable = TIMETABLE
): boolean {
  const time = getCollegeTime(now);
  const current = getCurrentClassSlot(now, timetable);
  if (!current) return false;
  return lectures.some((lecture) => lecture.dayKey === time.dateKey && lecture.slotId === current.slotId);
}

export function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
