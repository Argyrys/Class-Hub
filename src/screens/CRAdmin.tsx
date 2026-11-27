import { motion, useReducedMotion } from "framer-motion";
import { CalendarX2, Check, Clock3, PencilLine, Radio, RotateCcw, Save, Shield, Trash2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, Field, Pill, Reveal, Section, Stagger, StaggerItem } from "../components/ui";
import { tapPhysics } from "../motion";
import {
  DAY_ORDER,
  TIMETABLE,
  cloneTimetable,
  formatMinutes,
  getCollegeTime,
  getCurrentBreakSlot,
  getCurrentClassSlot,
  slotIsSubmitted,
  type TimetableSlot,
  type Weekday,
} from "../data/timetable";
import { useApp } from "../services/store";
import { ROLLS, SUBJECTS, BATCH_SIZE } from "../types";
import { attendanceFor, attendanceMath, formatTime } from "../utils";

export function CRAdmin() {
  const {
    db,
    currentUser,
    isCR,
    submitLecture,
    broadcastAlert,
    updateTimetable,
    resetTimetable,
    setAlertActive,
    keepOnlyAlert,
    removeAllActiveAlerts,
    deleteAlert,
  } = useApp();
  const reduce = !!useReducedMotion();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [absent, setAbsent] = useState<string[]>([]);
  const [title, setTitle] = useState("Urgent alert");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [editDay, setEditDay] = useState<Weekday>(() => {
    const day = getCollegeTime().dayName;
    return day === "Sunday" ? "Monday" : day;
  });
  const [draftSlots, setDraftSlots] = useState<TimetableSlot[]>([]);
  const [timetableSaved, setTimetableSaved] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const slots = db.timetable[editDay] || TIMETABLE[editDay] || [];
    setDraftSlots(slots.map((slot) => ({ ...slot })));
  }, [editDay, db.timetable]);

  const collegeTime = getCollegeTime(now);
  const currentClass = getCurrentClassSlot(now, db.timetable);
  const currentBreak = getCurrentBreakSlot(now, db.timetable);
  const alreadySubmitted = slotIsSubmitted(db.lectures, now, db.timetable);

  useEffect(() => {
    if (currentClass?.subject) setSubject(currentClass.subject);
  }, [currentClass?.subject, currentClass?.slotId]);

  if (!isCR) {
    return (
      <Section title="CR Admin">
        <Card className="text-center">
          <Shield size={28} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-sm font-bold text-zinc-300">CR access only</p>
          <p className="mt-1 text-xs text-zinc-500">Sign in with the CR account to use admin tools.</p>
        </Card>
      </Section>
    );
  }

  const safeCount = db.attendance.filter((entry) => attendanceMath(entry.attended, entry.total).tone === "safe").length;
  const dangerCount = db.attendance.filter((entry) => attendanceMath(entry.attended, entry.total).tone === "danger").length;
  const myAttendance = attendanceFor(db, currentUser?.rollNo || "01");

  function toggleRoll(rollNo: string) {
    setAbsent((prev) => prev.includes(rollNo) ? prev.filter((item) => item !== rollNo) : [...prev, rollNo]);
  }

  function submit(cancelled: boolean) {
    submitLecture(subject, absent, cancelled, {
      dayKey: collegeTime.dateKey,
      slotId: currentClass?.slotId,
    });
    setAbsent([]);
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 1800);
  }

  function updateSlot(index: number, patch: Partial<TimetableSlot>) {
    setDraftSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function saveTimetable() {
    updateTimetable(editDay, draftSlots.map((slot) => ({
      ...slot,
      subject: slot.subject?.trim() || undefined,
      faculty: slot.faculty?.trim() || undefined,
      room: slot.room?.trim() || undefined,
    })));
    setTimetableSaved(true);
    window.setTimeout(() => setTimetableSaved(false), 1600);
  }

  function resetDay() {
    const original = (TIMETABLE[editDay] || []).map((slot) => ({ ...slot }));
    setDraftSlots(original);
    updateTimetable(editDay, original);
  }

  function resetAll() {
    resetTimetable();
    setDraftSlots((cloneTimetable()[editDay] || []).map((slot) => ({ ...slot })));
  }

  function sendAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    broadcastAlert(title, message);
    setMessage("");
    setSent(true);
    window.setTimeout(() => setSent(false), 1800);
  }

  return (
    <div>
      <Section title="CR command center" subtitle="Roll call, broadcasts and batch controls">
        <Stagger className="grid grid-cols-3 gap-2">
          {[
            { label: "Students", value: BATCH_SIZE, icon: Users, tone: "text-indigo-300" },
            { label: "Safe", value: safeCount, icon: Check, tone: "text-emerald-300" },
            { label: "At risk", value: dangerCount, icon: Shield, tone: "text-rose-300" },
          ].map((item) => (
            <StaggerItem key={item.label}>
              <Card className="!p-3 text-center">
                <item.icon size={16} className={`mx-auto mb-1.5 ${item.tone}`} />
                <div className="mono text-lg font-bold text-zinc-100">{item.value}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-zinc-500">{item.label}</div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section title="10-second roll call" subtitle="Timetable-aware · Everyone starts Present — tap only absentees">
        <Reveal>
          <Card>
            <div className="mb-4 rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.07] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2.5">
                  <Clock3 size={16} className="mt-0.5 shrink-0 text-indigo-300" />
                  <div className="min-w-0">
                    <p className="break-words text-xs font-bold text-zinc-200">
                      {currentClass?.subject || currentBreak?.subject || "Outside timetable"}
                    </p>
                    <p className="mono mt-1 text-[0.63rem] text-zinc-500">
                      {collegeTime.dayName} · {formatMinutes(collegeTime.minutes)} · {currentClass?.label || currentBreak?.label || "No live slot"}
                    </p>
                  </div>
                </div>
                <Pill tone={currentClass ? "accent" : currentBreak ? "warn" : "default"}>
                  {currentClass ? "Live slot" : currentBreak ? "Break" : "Manual"}
                </Pill>
              </div>
              {currentClass?.faculty && (
                <p className="mt-2 pl-6 text-[0.65rem] text-zinc-500">{currentClass.faculty} · {currentClass.room}</p>
              )}
              {alreadySubmitted && (
                <p className="mt-2 pl-6 text-[0.65rem] font-bold text-emerald-300">This timetable slot is already marked.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1.5 block text-[0.66rem] font-bold uppercase tracking-wider text-zinc-500">Subject</span>
                <select className="glass-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <div className="flex items-end justify-end gap-1.5 pb-1">
                <Pill tone="safe"><Check size={10} /> {BATCH_SIZE - absent.length} present</Pill>
                <Pill tone="danger"><X size={10} /> {absent.length} absent</Pill>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {ROLLS.map((rollNo) => {
                const isAbsent = absent.includes(rollNo);
                return (
                  <motion.button
                    key={rollNo}
                    whileTap={reduce ? undefined : tapPhysics}
                    onClick={() => toggleRoll(rollNo)}
                    className={`mono rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                      isAbsent
                        ? "border-rose-400/35 bg-rose-500/15 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.16)]"
                        : "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {rollNo}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => submit(false)} disabled={alreadySubmitted || submitted} className="flex items-center justify-center gap-1.5">
                <Check size={14} /> {alreadySubmitted ? "Already marked" : submitted ? "Submitted" : "Submit Attendance"}
              </Button>
              <Button variant="ghost" onClick={() => submit(true)} disabled={alreadySubmitted || submitted} className="flex items-center justify-center gap-1.5 !text-rose-300 !border-rose-400/25">
                <CalendarX2 size={14} /> Class Cancelled
              </Button>
            </div>
            <p className="mt-3 text-center text-[0.65rem] leading-relaxed text-zinc-600">
              Submitting adds +1 to <span className="mono">totalConducted</span> for all {BATCH_SIZE} and +1 to <span className="mono">attended</span> for green rolls. Cancelled classes add nothing.
            </p>
          </Card>
        </Reveal>
      </Section>

      <Section title="Edit timetable" subtitle="Fix a substituted class, faculty or room for any day">
        <Reveal>
          <Card>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
                <PencilLine size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-200">Live for the whole batch</p>
                <p className="text-[0.65rem] text-zinc-500">Home, roll call and AI Tutor follow these edits.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {DAY_ORDER.slice(0, 6).map((day) => (
                <button
                  key={day}
                  onClick={() => setEditDay(day)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[0.65rem] font-bold transition-colors ${
                    editDay === day
                      ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-200"
                      : "border-white/10 bg-white/5 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            <datalist id="tt-subjects">
              {[...SUBJECTS, "Lunch / Break", "Breather"].map((item) => <option key={item} value={item} />)}
            </datalist>
            <datalist id="tt-faculty">
              {Array.from(new Set(
                Object.values(db.timetable)
                  .flat()
                  .map((slot) => slot.faculty)
                  .filter((value): value is string => !!value)
              )).map((name) => <option key={name} value={name} />)}
            </datalist>

            <div className="mt-3 space-y-2">
              {draftSlots.map((entry, index) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono text-[0.65rem] font-bold text-indigo-300">{entry.label}</span>
                    <label className="flex items-center gap-1.5 text-[0.62rem] text-zinc-500">
                      <input
                        type="checkbox"
                        checked={!!entry.isBreak}
                        onChange={(event) => updateSlot(index, { isBreak: event.target.checked })}
                      />
                      Break / free
                    </label>
                  </div>
                  <div className="mt-2">
                    <Field label="Subject">
                      <input
                        className="glass-input"
                        list="tt-subjects"
                        value={entry.subject || ""}
                        placeholder="No class"
                        onChange={(event) => updateSlot(index, { subject: event.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Field label="Faculty">
                      <input
                        className="glass-input"
                        list="tt-faculty"
                        value={entry.faculty || ""}
                        placeholder="—"
                        onChange={(event) => updateSlot(index, { faculty: event.target.value })}
                      />
                    </Field>
                    <Field label="Room">
                      <input
                        className="glass-input"
                        value={entry.room || ""}
                        placeholder="SB 14"
                        onChange={(event) => updateSlot(index, { room: event.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={saveTimetable} className="flex items-center justify-center gap-1.5">
                {timetableSaved ? <Check size={14} /> : <Save size={14} />}
                {timetableSaved ? "Saved" : "Save timetable"}
              </Button>
              <Button variant="ghost" onClick={resetDay} className="flex items-center justify-center gap-1.5">
                <RotateCcw size={14} /> Reset day
              </Button>
            </div>
            <button
              onClick={resetAll}
              className="mx-auto mt-3 block text-[0.65rem] text-zinc-600 underline underline-offset-2 hover:text-zinc-400"
            >
              Restore original timetable
            </button>
          </Card>
        </Reveal>
      </Section>

      <Section title="Urgent broadcast" subtitle="Full-screen takeover + lock-screen push when configured">
        <Reveal>
          <Card>
            <form onSubmit={sendAlert} className="space-y-3">
              <Field label="Alert title">
                <input className="glass-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Message">
                <textarea className="glass-input min-h-20 resize-y text-xs" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="9:00 AM lecture cancelled. Lab shifted to 4:00 PM." />
              </Field>
              <div className="flex items-center gap-2">
                <Pill tone="danger"><Radio size={10} /> isUrgent: true</Pill>
                <Pill>Read-by tracked</Pill>
              </div>
              <Button type="submit" className="w-full">{sent ? "Alert sent ✓" : "Broadcast urgent alert"}</Button>
            </form>
          </Card>
        </Reveal>
      </Section>

      <Section title="Broadcast manager" subtitle="Choose which broadcasts stay visible to the batch">
        <Reveal>
          <Card>
            {db.alerts.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-500">No broadcasts yet.</p>
            ) : (
              <div className="space-y-2">
                {db.alerts.map((alert) => {
                  const isActive = alert.active !== false;
                  return (
                    <div
                      key={alert.id}
                      className={`rounded-2xl border p-3 ${isActive ? "border-amber-400/25 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.02] opacity-70"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-xs font-bold text-zinc-200">{alert.title}</p>
                            <Pill tone={isActive ? "warn" : "default"}>{isActive ? "Live" : "Removed"}</Pill>
                          </div>
                          <p className="mt-1 text-[0.68rem] leading-relaxed text-zinc-400">{alert.message}</p>
                          <p className="mono mt-1.5 text-[0.6rem] text-zinc-600">
                            {formatTime(alert.createdAt)} · {alert.readBy.length}/{BATCH_SIZE} read
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => keepOnlyAlert(alert.id)}
                          className="rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2 py-1.5 text-[0.62rem] font-bold text-indigo-200"
                        >
                          Keep only this
                        </button>
                        <button
                          onClick={() => setAlertActive(alert.id, !isActive)}
                          className={`rounded-lg border px-2 py-1.5 text-[0.62rem] font-bold ${
                            isActive
                              ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                              : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                          }`}
                        >
                          {isActive ? "Remove" : "Restore"}
                        </button>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          aria-label={`Delete broadcast ${alert.title}`}
                          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-500 hover:text-rose-300"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {db.alerts.some((alert) => alert.active !== false) && (
              <Button
                variant="ghost"
                onClick={removeAllActiveAlerts}
                className="mt-3 w-full !text-rose-300 !border-rose-400/25"
              >
                <Trash2 size={14} /> Remove all live broadcasts
              </Button>
            )}
            <p className="mt-3 text-center text-[0.65rem] leading-relaxed text-zinc-600">
              Removed broadcasts stop appearing for everyone. Restore brings one back; delete removes it permanently.
            </p>
          </Card>
        </Reveal>
      </Section>

      <Section title="Your own attendance" subtitle="CR account is also a batch member">
        <Reveal>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-200">Your record</p>
              <p className="mt-1 text-[0.68rem] text-zinc-500">{attendanceMath(myAttendance.attended, myAttendance.total).message}</p>
            </div>
            <span className="mono text-lg font-bold text-indigo-300">{myAttendance.attended}/{myAttendance.total}</span>
          </Card>
        </Reveal>
      </Section>
    </div>
  );
}
