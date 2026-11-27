import { CalendarX2, Check, ClipboardCheck, Clock3, RefreshCw, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { AttendanceRing } from "../components/AttendanceRing";
import { Button, Card, Empty, Field, Pill, Reveal, Section, Stagger, StaggerItem } from "../components/ui";
import {
  TIMETABLE,
  formatMinutes,
  getCollegeTime,
  getCurrentBreakSlot,
  getCurrentClassSlot,
  getNextClassSlot,
  getTodayClasses,
} from "../data/timetable";
import { useApp } from "../services/store";
import { attendanceFor, attendanceMath, formatDate } from "../utils";

export function Home() {
  const { db, currentUser, overrideAttendance } = useApp();
  const attendance = attendanceFor(db, currentUser?.rollNo || "");
  const math = attendanceMath(attendance.attended, attendance.total);
  const [attended, setAttended] = useState(String(attendance.attended));
  const [total, setTotal] = useState(String(attendance.total));
  const [saved, setSaved] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setAttended(String(attendance.attended));
    setTotal(String(attendance.total));
  }, [attendance.attended, attendance.total]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const collegeTime = getCollegeTime(now);
  const currentClass = getCurrentClassSlot(now, db.timetable);
  const currentBreak = getCurrentBreakSlot(now, db.timetable);
  const nextClass = getNextClassSlot(now, db.timetable);
  const todayClasses = getTodayClasses(now, db.timetable);
  const timetableEdited = JSON.stringify(db.timetable) !== JSON.stringify(TIMETABLE);

  const tonePill = math.tone === "safe" ? "safe" : math.tone === "warn" ? "warn" : "danger";
  const StatusIcon = math.tone === "safe" ? TrendingUp : math.tone === "warn" ? Target : TrendingDown;

  function saveOverride() {
    const nextTotal = Math.max(1, Math.min(500, Number(total) || 1));
    const nextAttended = Math.max(0, Math.min(nextTotal, Number(attended) || 0));
    overrideAttendance(attendance.rollNo, nextAttended, nextTotal);
    setAttended(String(nextAttended));
    setTotal(String(nextTotal));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div>
      <Section
        title="Today's timetable"
        subtitle={`${collegeTime.dayName} · ${formatMinutes(collegeTime.minutes)} college time · IST${timetableEdited ? " · CR updated" : ""}`}
      >
        <Reveal>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  currentClass
                    ? "border-indigo-400/30 bg-indigo-500/15 text-indigo-300"
                    : currentBreak
                      ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
                      : "border-white/10 bg-white/5 text-zinc-500"
                }`}>
                  <Clock3 size={19} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pill tone={currentClass ? "accent" : currentBreak ? "warn" : "default"}>
                      {currentClass ? "Now" : currentBreak ? "Break" : "Free"}
                    </Pill>
                    <span className="mono text-[0.65rem] text-zinc-500">
                      {currentClass ? currentClass.label : currentBreak ? currentBreak.label : "No class"}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-sm font-bold leading-snug text-zinc-100">
                    {currentClass?.subject || currentBreak?.subject || "No scheduled class right now"}
                  </p>
                  {currentClass?.faculty && (
                    <p className="mt-1 text-[0.68rem] text-zinc-500">{currentClass.faculty} · {currentClass.room}</p>
                  )}
                </div>
              </div>
              {currentClass && db.lectures.some((lecture) => lecture.dayKey === collegeTime.dateKey && lecture.slotId === currentClass.slotId) && (
                <Pill tone="safe"><Check size={10} /> Marked</Pill>
              )}
            </div>

            {nextClass && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Next class</p>
                <p className="mt-1 text-xs font-bold text-zinc-300">{nextClass.subject}</p>
                <p className="mono mt-0.5 text-[0.65rem] text-zinc-500">
                  {nextClass.dayName} · {nextClass.label} · {nextClass.faculty}
                </p>
              </div>
            )}
          </Card>
        </Reveal>

        {todayClasses.length === 0 ? (
          <div className="mt-3">
            <Empty icon={<CalendarX2 size={26} />} title="No classes today" text="Enjoy the free day." />
          </div>
        ) : (
          <Stagger className="mt-3 space-y-2">
            {todayClasses.map((entry) => {
              const isNow = currentClass?.id === entry.id;
              const submitted = db.lectures.some((lecture) => lecture.dayKey === collegeTime.dateKey && lecture.slotId === `${collegeTime.dayName}-${entry.id}`);
              return (
                <StaggerItem key={entry.id}>
                  <div className={`glass-card flex items-center gap-3 p-3.5 ${isNow ? "!border-indigo-400/35 !shadow-[0_0_24px_rgba(99,102,241,0.12)]" : ""}`}>
                    <div className={`mono w-[4.4rem] shrink-0 text-[0.62rem] font-bold leading-tight ${isNow ? "text-indigo-300" : "text-zinc-500"}`}>
                      <span className="block">{entry.label.split(" - ")[0]}</span>
                      <span className="block">{entry.label.split(" - ")[1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-zinc-200">{entry.subject}</p>
                      <p className="mt-0.5 truncate text-[0.65rem] text-zinc-500">
                        {entry.faculty || "No faculty"}{entry.room ? ` · ${entry.room}` : ""}
                      </p>
                    </div>
                    {submitted && <Pill tone="safe"><Check size={10} /> Done</Pill>}
                    {isNow && <Pill tone="accent">Live</Pill>}
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </Section>

      <Section title="Your attendance pulse" subtitle="Default-present tracking · Target 75%">
        <Reveal>
          <Card className="!p-5">
            <div className="flex items-center gap-4">
              <AttendanceRing percentage={math.percentage} tone={math.tone as "safe" | "warn" | "danger"} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={tonePill as "safe" | "warn" | "danger"}>
                    <StatusIcon size={11} /> {math.tone === "safe" ? "Safe" : math.tone === "warn" ? "Borderline" : "Needs attention"}
                  </Pill>
                  <span className="text-[0.65rem] text-zinc-500">Roll <span className="mono text-zinc-300">{attendance.rollNo}</span></span>
                </div>
                <p className="mt-3 text-sm font-bold leading-relaxed text-zinc-100">{math.message}</p>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-zinc-500">
                  {math.tone === "safe"
                    ? "Calculated with floor((attended − 0.75 × total) ÷ 0.75)."
                    : "Calculated with ceil((0.75 × total − attended) ÷ 0.25)."}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Attended", value: attendance.attended, icon: ClipboardCheck, color: "text-emerald-300" },
                { label: "Conducted", value: attendance.total, icon: Sparkles, color: "text-indigo-300" },
                { label: "Safe bunks", value: math.safeBunks, icon: CalendarX2, color: "text-amber-300" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <item.icon size={15} className={`mx-auto mb-1.5 ${item.color}`} />
                  <div className="mono text-lg font-bold text-zinc-100"><AnimatedNumber value={item.value} /></div>
                  <div className="text-[0.6rem] uppercase tracking-wider text-zinc-500">{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </Section>

      <Section title="Sync with college portal" subtitle="Manually correct your numbers anytime">
        <Reveal>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.8rem] font-bold text-zinc-200">Manual override</p>
                <p className="mt-0.5 text-[0.68rem] text-zinc-500">Only your own attendance can be edited.</p>
              </div>
              <Pill tone="accent"><RefreshCw size={11} /> Local</Pill>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Field label="Attended classes">
                <input
                  className="glass-input mono text-center text-sm font-bold"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={500}
                  value={attended}
                  onChange={(event) => setAttended(event.target.value.replace(/[^0-9]/g, ""))}
                  aria-label="Attended classes"
                />
              </Field>
              <Field label="Total conducted">
                <input
                  className="glass-input mono text-center text-sm font-bold"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  value={total}
                  onChange={(event) => setTotal(event.target.value.replace(/[^0-9]/g, ""))}
                  aria-label="Total conducted"
                />
              </Field>
            </div>
            <p className="mt-2 text-[0.65rem] leading-relaxed text-zinc-600">
              Type the exact counts from your college portal and save. Attended is capped at total conducted.
            </p>
            <Button onClick={saveOverride} className="mt-4 w-full">{saved ? "Synced ✓" : "Save attendance"}</Button>
          </Card>
        </Reveal>
      </Section>

      <Section title="Recent lectures" subtitle="Default present · CR marks only absentees">
        <Stagger className="space-y-2.5">
          {db.lectures.slice(0, 5).map((lecture) => (
            <StaggerItem key={lecture.id}>
              <div className="glass-card flex items-center gap-3 p-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${lecture.cancelled ? "border-rose-400/25 bg-rose-500/10 text-rose-300" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"}`}>
                  {lecture.cancelled ? <CalendarX2 size={17} /> : <ClipboardCheck size={17} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-zinc-200">{lecture.subject}</p>
                  <p className="text-[0.65rem] text-zinc-500">{formatDate(lecture.date)} · {lecture.cancelled ? "Cancelled" : `${lecture.absentRolls.length} absent`}</p>
                </div>
                {!lecture.cancelled && (
                  <div className="mono text-[0.62rem] text-zinc-600">{lecture.absentRolls.join(", ") || "All"}</div>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </div>
  );
}
