export type Role = "cr" | "student";

export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface TimetableSlot {
  id: string;
  start: number;
  end: number;
  label: string;
  subject?: string;
  faculty?: string;
  room?: string;
  isBreak?: boolean;
}

export type Timetable = Record<Weekday, TimetableSlot[]>;

export interface User {
  uid: string;
  name: string;
  rollNo: string;
  email: string;
  role: Role;
}

export interface Attendance {
  rollNo: string;
  attended: number;
  total: number;
}

export interface LectureLog {
  id: string;
  subject: string;
  date: number;
  absentRolls: string[];
  cancelled: boolean;
  createdBy: string;
  dayKey?: string;
  slotId?: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  isUrgent: boolean;
  createdAt: number;
  createdBy: string;
  readBy: string[];
  active?: boolean;
  removedAt?: number;
  removedBy?: string;
}

export type ResourceType = "link" | "code";

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  subject: string;
  category: string;
  unit: string;
  uploaderName: string;
  uploaderUid: string;
  createdAt: number;
  url?: string;
  code?: string;
  language?: string;
  expectedOutput?: string;
  source?: "manual" | "ai";
}

export interface PollOption {
  id: string;
  label: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  votes: Record<string, number>;
  votedUserIds: string[];
  createdAt: number;
  createdBy: string;
}

export interface HODReport {
  text: string;
  generatedBy: string;
  generatedAt: number;
  consensus: string;
}

export interface Grievance {
  id: string;
  category: string;
  description: string;
  date: number;
  authorUid: string;
  upvotedBy: string[];
  reports: HODReport[];
}

export type ProjectStatus = "Proposed" | "Faculty Approved";

export interface Project {
  id: string;
  title: string;
  type: "Minor" | "Major";
  members: string[];
  stack: string[];
  status: ProjectStatus;
  ownerUid: string;
  requests: string[];
}

export interface Teammate {
  id: string;
  uid: string;
  name: string;
  rollNo: string;
  skills: string[];
  note: string;
  createdAt: number;
}

export interface DBShape {
  users: User[];
  timetable: Timetable;
  attendance: Attendance[];
  lectures: LectureLog[];
  alerts: Alert[];
  resources: Resource[];
  polls: Poll[];
  grievances: Grievance[];
  projects: Project[];
  teammates: Teammate[];
  sessionUid: string | null;
}

export type TabKey = "home" | "vault" | "ai" | "batch" | "admin";
export type AIMode = "five-mark" | "real-world" | "viva" | "hod-report";

export const BATCH_SIZE = 24;
export const ATTENDANCE_TARGET = 0.75;
export const ROLLS = Array.from({ length: BATCH_SIZE }, (_, i) => String(i + 1).padStart(2, "0"));

export const SUBJECTS = [
  "Advanced Database Design and Management",
  "Advanced Computer Systems and Architecture",
  "Modern Operating System Design",
  "Python Programming for Problem Solving",
  "Computational Maths -I",
  "New Age IT Skills: AI for Everyone",
  "Career Development Center Course -I",
  "Communication Proficiency -I",
];

export const CATEGORIES = ["Lecture Notes", "Lab Code", "PYQs", "Assignments"];
export const UNITS = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"];
