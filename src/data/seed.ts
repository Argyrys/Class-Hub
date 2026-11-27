import type { DBShape } from "../types";
import { ROLLS } from "../types";
import { cloneTimetable } from "./timetable";

export const CR_EMAIL = (import.meta.env.VITE_CR_EMAIL || "cr@batch.test").toLowerCase();
export const CR_DEMO_UID = "cr-demo-uid";

function syntheticVoters(count: number, prefix = "demo-voter") {
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`);
}

export function seedDB(): DBShape {
  const now = Date.now();
  const attendance = ROLLS.map((rollNo, i) => ({
    rollNo,
    attended: [34, 31, 37, 29, 33, 36, 28, 35, 32, 30, 38, 27, 34, 31, 36, 29, 33, 35, 28, 32, 37, 30, 34, 31][i],
    total: 40,
  }));

  return {
    users: [
      { uid: CR_DEMO_UID, name: "Class Representative", rollNo: "01", email: CR_EMAIL, role: "cr" },
      { uid: "demo-student-02", name: "Aarav Sharma", rollNo: "02", email: "aarav@batch.test", role: "student" },
      { uid: "demo-student-03", name: "Diya Verma", rollNo: "03", email: "diya@batch.test", role: "student" },
      { uid: "demo-student-04", name: "Kabir Mehta", rollNo: "04", email: "kabir@batch.test", role: "student" },
    ],
    timetable: cloneTimetable(),
    attendance,
    lectures: [
      { id: "lec-seed-1", subject: "Advanced Database Design and Management", date: now - 86400000 * 2, absentRolls: ["05", "11", "19"], cancelled: false, createdBy: CR_DEMO_UID },
      { id: "lec-seed-2", subject: "Modern Operating System Design", date: now - 86400000, absentRolls: ["02", "08"], cancelled: false, createdBy: CR_DEMO_UID },
    ],
    alerts: [
      {
        id: "alert-seed-1",
        title: "Lecture update",
        message: "9:00 AM lecture cancelled. Lab shifted to 4:00 PM in C-204.",
        isUrgent: true,
        createdAt: now - 3600000,
        createdBy: CR_DEMO_UID,
        readBy: [],
      },
    ],
    resources: [
      {
        id: "res-seed-1",
        type: "link",
        title: "DBMS Normalization — Complete Notes",
        subject: "Advanced Database Design and Management",
        category: "Lecture Notes",
        unit: "Unit 3",
        uploaderName: "Aarav Sharma",
        uploaderUid: "demo-student-02",
        createdAt: now - 86400000 * 3,
        url: "https://drive.google.com/",
        source: "manual",
      },
      {
        id: "res-seed-2",
        type: "code",
        title: "BFS Traversal — Java",
        subject: "Python Programming for Problem Solving",
        category: "Lab Code",
        unit: "Unit 4",
        uploaderName: "Diya Verma",
        uploaderUid: "demo-student-03",
        createdAt: now - 86400000 * 2,
        language: "java",
        code: `import java.util.*;\n\npublic class BFS {\n  static void bfs(int start, List<List<Integer>> graph) {\n    boolean[] visited = new boolean[graph.size()];\n    Queue<Integer> q = new LinkedList<>();\n    q.add(start);\n    visited[start] = true;\n    while (!q.isEmpty()) {\n      int node = q.poll();\n      System.out.print(node + " ");\n      for (int next : graph.get(node)) {\n        if (!visited[next]) {\n          visited[next] = true;\n          q.add(next);\n        }\n      }\n    }\n  }\n}`,
        expectedOutput: "Traversal order depends on the adjacency list. For a path 0→1→2 the output is: 0 1 2",
        source: "manual",
      },
      {
        id: "res-seed-3",
        type: "link",
        title: "OS Scheduler PYQ Set",
        subject: "Modern Operating System Design",
        category: "PYQs",
        unit: "Unit 2",
        uploaderName: "Kabir Mehta",
        uploaderUid: "demo-student-04",
        createdAt: now - 86400000,
        url: "https://drive.google.com/",
        source: "manual",
      },
    ],
    polls: [
      {
        id: "poll-seed-1",
        question: "Reschedule Saturday extra class to Monday?",
        options: [
          { id: "p1a", label: "Yes, Monday" },
          { id: "p1b", label: "No, keep Saturday" },
        ],
        votes: { p1a: 11, p1b: 7 },
        votedUserIds: syntheticVoters(18),
        createdAt: now - 86400000 * 2,
        createdBy: CR_DEMO_UID,
      },
    ],
    grievances: [
      {
        id: "grievance-seed-1",
        category: "Infrastructure",
        description: "The C-204 lab projector has been faulty for two weeks, affecting practical demonstrations. Requesting immediate repair or a temporary projector.",
        date: now - 86400000 * 3,
        authorUid: "demo-student-04",
        upvotedBy: syntheticVoters(16),
        reports: [],
      },
      {
        id: "grievance-seed-2",
        category: "Academic",
        description: "Requesting a revision session before the DBMS unit test.",
        date: now - 86400000,
        authorUid: "demo-student-02",
        upvotedBy: syntheticVoters(7),
        reports: [],
      },
    ],
    projects: [
      {
        id: "proj-seed-1",
        title: "Campus Notes Exchange",
        type: "Minor",
        members: ["Aarav Sharma (02)", "Diya Verma (03)"],
        stack: ["React", "Firebase"],
        status: "Faculty Approved",
        ownerUid: "demo-student-02",
        requests: [],
      },
      {
        id: "proj-seed-2",
        title: "Attendance Insights Dashboard",
        type: "Major",
        members: ["Kabir Mehta (04)"],
        stack: ["Python", "Streamlit", "ML"],
        status: "Proposed",
        ownerUid: "demo-student-04",
        requests: [],
      },
    ],
    teammates: [
      {
        id: "mate-seed-1",
        uid: "demo-student-03",
        name: "Diya Verma",
        rollNo: "03",
        skills: ["UI/UX", "React"],
        note: "Open to joining a frontend-heavy minor project.",
        createdAt: now - 86400000,
      },
    ],
    sessionUid: null,
  };
}
