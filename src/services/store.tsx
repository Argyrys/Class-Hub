import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CR_DEMO_UID, CR_EMAIL, seedDB } from "../data/seed";
import { cloneTimetable } from "../data/timetable";
import type {
  Alert,
  DBShape,
  Grievance,
  HODReport,
  Poll,
  Project,
  ProjectStatus,
  Resource,
  Teammate,
  Timetable,
  TimetableSlot,
  User,
  Weekday,
} from "../types";
import { makeId } from "../utils";

const STORAGE_KEY = "mca-batch-hub-v1";

const SUBJECT_MIGRATION: Record<string, string> = {
  DBMS: "Advanced Database Design and Management",
  "Operating Systems": "Modern Operating System Design",
  "Data Structures": "Python Programming for Problem Solving",
  Java: "Python Programming for Problem Solving",
  "Computer Networks": "Advanced Computer Systems and Architecture",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function migrateSubject(value: string): string {
  return SUBJECT_MIGRATION[value] || value;
}

function loadDB(): DBShape {
  if (typeof window === "undefined") return seedDB();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDB();
    const parsed = JSON.parse(raw) as Partial<DBShape> & { aiUsage?: unknown };
    delete parsed.aiUsage; // legacy quota counter is no longer used
    const db: DBShape = { ...seedDB(), ...parsed };
    if (!db.timetable || typeof db.timetable !== "object") db.timetable = cloneTimetable();
    db.lectures = db.lectures.map((lecture) => ({ ...lecture, subject: migrateSubject(lecture.subject) }));
    db.resources = db.resources.map((resource) => ({ ...resource, subject: migrateSubject(resource.subject) }));
    return db;
  } catch {
    return seedDB();
  }
}

interface AddResourceInput {
  type: "link" | "code";
  title: string;
  subject: string;
  category: string;
  unit: string;
  url?: string;
  code?: string;
  language?: string;
  expectedOutput?: string;
  source?: "manual" | "ai";
}

interface StoreValue {
  db: DBShape;
  users: User[];
  alerts: Alert[];
  currentUser: User | null;
  isCR: boolean;
  signIn: (email: string, name: string, rollNo: string) => void;
  signOut: () => void;
  updateTimetable: (day: Weekday, slots: TimetableSlot[]) => void;
  resetTimetable: () => void;
  submitLecture: (subject: string, absentRolls: string[], cancelled: boolean, meta?: { dayKey?: string; slotId?: string }) => void;
  overrideAttendance: (rollNo: string, attended: number, total: number) => void;
  broadcastAlert: (title: string, message: string) => void;
  markAlertRead: (alertId: string, uid: string) => void;
  setAlertActive: (alertId: string, active: boolean) => void;
  keepOnlyAlert: (alertId: string) => void;
  removeAllActiveAlerts: () => void;
  deleteAlert: (alertId: string) => void;
  addResource: (input: AddResourceInput) => void;
  createPoll: (question: string, options: string[]) => void;
  votePoll: (pollId: string, optionId: string) => void;
  submitGrievance: (category: string, description: string) => void;
  upvoteGrievance: (grievanceId: string) => void;
  saveReport: (grievanceId: string, report: HODReport) => void;
  addProject: (title: string, type: "Minor" | "Major", stack: string[]) => void;
  toggleProjectStatus: (projectId: string) => void;
  requestJoin: (projectId: string) => void;
  addTeammate: (skills: string[], note: string) => void;
}

const AppContext = createContext<StoreValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DBShape>(loadDB);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* storage unavailable */
    }
  }, [db]);

  const update = useCallback((recipe: (draft: DBShape) => void) => {
    setDb((prev) => {
      const draft = clone(prev);
      recipe(draft);
      return draft;
    });
  }, []);

  const currentUser = useMemo(
    () => db.users.find((user) => user.uid === db.sessionUid) || null,
    [db.users, db.sessionUid]
  );
  const isCR = currentUser?.role === "cr";

  const signIn = useCallback((email: string, name: string, rollNo: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) throw new Error("Enter a valid email address.");
    const existing = db.users.find((user) => user.email.toLowerCase() === normalized);
    if (existing) {
      update((draft) => { draft.sessionUid = existing.uid; });
      return;
    }
    if (!name.trim()) throw new Error("Enter your name.");
    if (!/^\d{2}$/.test(rollNo)) throw new Error("Pick a roll number from 01 to 24.");
    if (db.users.some((user) => user.rollNo === rollNo)) throw new Error("That roll number is already taken.");
    const user: User = {
      uid: makeId("user"),
      name: name.trim(),
      rollNo,
      email: normalized,
      role: normalized === CR_EMAIL ? "cr" : "student",
    };
    update((draft) => {
      draft.users.push(user);
      draft.sessionUid = user.uid;
    });
  }, [db.users, update]);

  const signOut = useCallback(() => {
    update((draft) => { draft.sessionUid = null; });
  }, [update]);

  const updateTimetable = useCallback((day: Weekday, slots: TimetableSlot[]) => {
    if (!isCR) return;
    update((draft) => {
      draft.timetable = {
        ...draft.timetable,
        [day]: slots.map((slot) => ({ ...slot })),
      };
    });
  }, [isCR, update]);

  const resetTimetable = useCallback(() => {
    if (!isCR) return;
    update((draft) => { draft.timetable = cloneTimetable(); });
  }, [isCR, update]);

  const submitLecture = useCallback((subject: string, absentRolls: string[], cancelled: boolean, meta?: { dayKey?: string; slotId?: string }) => {
    const uid = db.sessionUid || CR_DEMO_UID;
    update((draft) => {
      draft.lectures.unshift({
        id: makeId("lec"),
        subject,
        date: Date.now(),
        absentRolls: cancelled ? [] : [...absentRolls],
        cancelled,
        createdBy: uid,
        dayKey: meta?.dayKey,
        slotId: meta?.slotId,
      });
      if (!cancelled) {
        draft.attendance.forEach((entry) => {
          entry.total += 1;
          if (!absentRolls.includes(entry.rollNo)) entry.attended += 1;
        });
      }
    });
  }, [db.sessionUid, update]);

  const overrideAttendance = useCallback((rollNo: string, attended: number, total: number) => {
    update((draft) => {
      const entry = draft.attendance.find((item) => item.rollNo === rollNo);
      if (!entry) return;
      entry.total = Math.max(1, Math.min(500, total));
      entry.attended = Math.max(0, Math.min(entry.total, attended));
    });
  }, [update]);

  const broadcastAlert = useCallback((title: string, message: string) => {
    const uid = db.sessionUid || CR_DEMO_UID;
    const alert: Alert = {
      id: makeId("alert"),
      title: title.trim() || "Urgent batch alert",
      message: message.trim(),
      isUrgent: true,
      createdAt: Date.now(),
      createdBy: uid,
      readBy: [uid],
      active: true,
    };
    update((draft) => { draft.alerts.unshift(alert); });
  }, [db.sessionUid, update]);

  const markAlertRead = useCallback((alertId: string, uid: string) => {
    update((draft) => {
      const alert = draft.alerts.find((item) => item.id === alertId);
      if (alert && !alert.readBy.includes(uid)) alert.readBy.push(uid);
    });
  }, [update]);

  const setAlertActive = useCallback((alertId: string, active: boolean) => {
    if (!isCR) return;
    const uid = db.sessionUid || CR_DEMO_UID;
    update((draft) => {
      const alert = draft.alerts.find((item) => item.id === alertId);
      if (!alert) return;
      alert.active = active;
      alert.removedAt = active ? undefined : Date.now();
      alert.removedBy = active ? undefined : uid;
    });
  }, [isCR, db.sessionUid, update]);

  const keepOnlyAlert = useCallback((alertId: string) => {
    if (!isCR) return;
    const uid = db.sessionUid || CR_DEMO_UID;
    update((draft) => {
      const at = Date.now();
      draft.alerts.forEach((alert) => {
        if (alert.id === alertId) {
          alert.active = true;
          alert.removedAt = undefined;
          alert.removedBy = undefined;
        } else {
          alert.active = false;
          alert.removedAt = at;
          alert.removedBy = uid;
        }
      });
    });
  }, [isCR, db.sessionUid, update]);

  const removeAllActiveAlerts = useCallback(() => {
    if (!isCR) return;
    const uid = db.sessionUid || CR_DEMO_UID;
    update((draft) => {
      const at = Date.now();
      draft.alerts.forEach((alert) => {
        if (alert.active !== false) {
          alert.active = false;
          alert.removedAt = at;
          alert.removedBy = uid;
        }
      });
    });
  }, [isCR, db.sessionUid, update]);

  const deleteAlert = useCallback((alertId: string) => {
    if (!isCR) return;
    update((draft) => { draft.alerts = draft.alerts.filter((alert) => alert.id !== alertId); });
  }, [isCR, update]);

  const addResource = useCallback((input: AddResourceInput) => {
    if (!currentUser) return;
    const resource: Resource = {
      id: makeId("res"),
      type: input.type,
      title: input.title.trim(),
      subject: input.subject,
      category: input.category,
      unit: input.unit,
      uploaderName: currentUser.name,
      uploaderUid: currentUser.uid,
      createdAt: Date.now(),
      url: input.url?.trim(),
      code: input.code,
      language: input.language || "text",
      expectedOutput: input.expectedOutput?.trim(),
      source: input.source || "manual",
    };
    update((draft) => { draft.resources.unshift(resource); });
  }, [currentUser, update]);

  const createPoll = useCallback((question: string, options: string[]) => {
    const uid = db.sessionUid || CR_DEMO_UID;
    const poll: Poll = {
      id: makeId("poll"),
      question: question.trim(),
      options: options.filter(Boolean).map((label, index) => ({ id: `opt-${index}-${makeId("o")}`, label: label.trim() })),
      votes: {},
      votedUserIds: [],
      createdAt: Date.now(),
      createdBy: uid,
    };
    poll.options.forEach((option) => { poll.votes[option.id] = 0; });
    update((draft) => { draft.polls.unshift(poll); });
  }, [db.sessionUid, update]);

  const votePoll = useCallback((pollId: string, optionId: string) => {
    if (!currentUser) return;
    update((draft) => {
      const poll = draft.polls.find((item) => item.id === pollId);
      if (!poll || poll.votedUserIds.includes(currentUser.uid)) return;
      poll.votes[optionId] = (poll.votes[optionId] || 0) + 1;
      poll.votedUserIds.push(currentUser.uid);
    });
  }, [currentUser, update]);

  const submitGrievance = useCallback((category: string, description: string) => {
    if (!currentUser) return;
    const grievance: Grievance = {
      id: makeId("grievance"),
      category,
      description: description.trim(),
      date: Date.now(),
      authorUid: currentUser.uid,
      upvotedBy: [],
      reports: [],
    };
    update((draft) => { draft.grievances.unshift(grievance); });
  }, [currentUser, update]);

  const upvoteGrievance = useCallback((grievanceId: string) => {
    if (!currentUser) return;
    update((draft) => {
      const grievance = draft.grievances.find((item) => item.id === grievanceId);
      if (grievance && !grievance.upvotedBy.includes(currentUser.uid)) grievance.upvotedBy.push(currentUser.uid);
    });
  }, [currentUser, update]);

  const saveReport = useCallback((grievanceId: string, report: HODReport) => {
    update((draft) => {
      const grievance = draft.grievances.find((item) => item.id === grievanceId);
      if (grievance) grievance.reports.unshift(report);
    });
  }, [update]);

  const addProject = useCallback((title: string, type: "Minor" | "Major", stack: string[]) => {
    if (!currentUser) return;
    const project: Project = {
      id: makeId("proj"),
      title: title.trim(),
      type,
      members: [`${currentUser.name} (${currentUser.rollNo})`],
      stack,
      status: "Proposed",
      ownerUid: currentUser.uid,
      requests: [],
    };
    update((draft) => { draft.projects.unshift(project); });
  }, [currentUser, update]);

  const toggleProjectStatus = useCallback((projectId: string) => {
    update((draft) => {
      const project = draft.projects.find((item) => item.id === projectId);
      if (!project) return;
      project.status = (project.status === "Proposed" ? "Faculty Approved" : "Proposed") as ProjectStatus;
    });
  }, [update]);

  const requestJoin = useCallback((projectId: string) => {
    if (!currentUser) return;
    const label = `${currentUser.name} (${currentUser.rollNo})`;
    update((draft) => {
      const project = draft.projects.find((item) => item.id === projectId);
      if (project && !project.requests.includes(label)) project.requests.push(label);
    });
  }, [currentUser, update]);

  const addTeammate = useCallback((skills: string[], note: string) => {
    if (!currentUser) return;
    const entry: Teammate = {
      id: makeId("mate"),
      uid: currentUser.uid,
      name: currentUser.name,
      rollNo: currentUser.rollNo,
      skills,
      note: note.trim(),
      createdAt: Date.now(),
    };
    update((draft) => {
      draft.teammates = draft.teammates.filter((item) => item.uid !== currentUser.uid);
      draft.teammates.unshift(entry);
    });
  }, [currentUser, update]);

  const value: StoreValue = {
    db,
    users: db.users,
    alerts: db.alerts,
    currentUser,
    isCR,
    signIn,
    signOut,
    updateTimetable,
    resetTimetable,
    submitLecture,
    overrideAttendance,
    broadcastAlert,
    markAlertRead,
    setAlertActive,
    keepOnlyAlert,
    removeAllActiveAlerts,
    deleteAlert,
    addResource,
    createPoll,
    votePoll,
    submitGrievance,
    upvoteGrievance,
    saveReport,
    addProject,
    toggleProjectStatus,
    requestJoin,
    addTeammate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}

