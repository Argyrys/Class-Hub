import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Download, FileText, Lock, MessageSquareWarning, Plus, Send, ShieldCheck, ThumbsUp, Users, Vote } from "lucide-react";
import { jsPDF } from "jspdf";
import { useState } from "react";
import { Button, Card, Empty, Field, Pill, ProgressBar, Reveal, Section, Stagger, StaggerItem } from "../components/ui";
import { spring, tapPhysics } from "../motion";
import { askAI } from "../services/ai";
import { useApp } from "../services/store";
import { BATCH_SIZE } from "../types";
import { copyText, formatDate } from "../utils";

type HubTab = "polls" | "grievances" | "projects";

function downloadPDF(text: string, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const lines = doc.splitTextToSize(text, 500) as string[];
  let y = 64;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  lines.forEach((line) => {
    if (y > 770) {
      doc.addPage();
      y = 64;
    }
    doc.text(line, 56, y);
    y += 16;
  });
  doc.save(filename);
}

function Polls() {
  const { db, currentUser, isCR, createPoll, votePoll } = useApp();
  const reduce = !!useReducedMotion();
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("Yes");
  const [optionB, setOptionB] = useState("No");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    createPoll(question, [optionA, optionB]);
    setQuestion(""); setShowForm(false);
  }

  return (
    <>
      <Section
        title="Anonymous batch polls"
        subtitle="One vote per student · choices never shown"
        action={isCR ? <Button onClick={() => setShowForm((v) => !v)} className="!px-3 !py-1.5"><Plus size={14} /></Button> : undefined}
      >
        {isCR && showForm && (
          <Reveal>
            <Card className="mb-3">
              <form onSubmit={submit} className="space-y-3">
                <Field label="Question"><input className="glass-input" required value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Mass bunk after 2 PM lab?" /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Option A"><input className="glass-input" required value={optionA} onChange={(e) => setOptionA(e.target.value)} /></Field>
                  <Field label="Option B"><input className="glass-input" required value={optionB} onChange={(e) => setOptionB(e.target.value)} /></Field>
                </div>
                <Button type="submit" className="w-full">Create poll</Button>
              </form>
            </Card>
          </Reveal>
        )}

        <Stagger className="space-y-3">
          {db.polls.map((poll) => {
            const totalVotes = poll.votedUserIds.length;
            const hasVoted = !!currentUser && poll.votedUserIds.includes(currentUser.uid);
            return (
              <StaggerItem key={poll.id}>
                <Card>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300"><Vote size={15} /></div>
                      <div>
                        <h3 className="text-sm font-bold leading-snug text-zinc-100">{poll.question}</h3>
                        <p className="mt-1 text-[0.65rem] text-zinc-500">{formatDate(poll.createdAt)} · anonymous</p>
                      </div>
                    </div>
                    <Pill tone="accent">{totalVotes}/{BATCH_SIZE} voted</Pill>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {poll.options.map((option) => {
                      const count = poll.votes[option.id] || 0;
                      const percent = totalVotes ? (count / totalVotes) * 100 : 0;
                      return (
                        <motion.button
                          key={option.id}
                          whileTap={reduce || hasVoted ? undefined : tapPhysics}
                          disabled={hasVoted}
                          onClick={() => votePoll(poll.id, option.id)}
                          className="w-full text-left disabled:cursor-default"
                        >
                          <div className="mb-1 flex items-center justify-between text-[0.7rem]">
                            <span className="font-semibold text-zinc-300">{option.label}</span>
                            <span className="mono text-zinc-500">{Math.round(percent)}%</span>
                          </div>
                          <ProgressBar value={percent} />
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[0.65rem] text-zinc-600">{hasVoted ? "Your vote is recorded anonymously." : "Tap an option to vote. You cannot vote twice."}</p>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>
    </>
  );
}

function Grievances() {
  const { db, currentUser, isCR, submitGrievance, upvoteGrievance, saveReport } = useApp();
  const reduce = !!useReducedMotion();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Academic");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, string>>({});
  const [reportError, setReportError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) return;
    submitGrievance(category, description);
    setDescription(""); setShowForm(false);
  }

  async function generate(grievanceId: string, description: string, grievanceCategory: string, date: number, support: number) {
    setGenerating(grievanceId);
    setReportError("");
    try {
      const consensus = `${support} / ${BATCH_SIZE} students`;
      const text = await askAI({
        mode: "hod-report",
        subject: "General",
        question: description,
        category: grievanceCategory,
        date: formatDate(date),
        consensus,
      });
      const report = { text, generatedBy: currentUser?.uid || "cr", generatedAt: Date.now(), consensus };
      saveReport(grievanceId, report);
      setReports((prev) => ({ ...prev, [grievanceId]: text }));
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Could not draft the report. Please try again.");
    } finally {
      setGenerating(null);
    }
  }

  return (
    <Section
      title="Grievance box"
      subtitle="Anonymous issues · majority unlocks HOD report"
      action={<Button onClick={() => setShowForm((v) => !v)} className="!px-3 !py-1.5">{showForm ? <span className="text-lg leading-none">×</span> : <Plus size={14} />}</Button>}
    >
      {reportError && <p className="mb-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{reportError}</p>}
      {showForm && (
        <Reveal>
          <Card className="mb-3">
            <form onSubmit={submit} className="space-y-3">
              <Field label="Category">
                <select className="glass-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>Academic</option><option>Infrastructure</option><option>Timetable</option><option>Other</option>
                </select>
              </Field>
              <Field label="Issue (your identity stays hidden)">
                <textarea className="glass-input min-h-24 resize-y text-xs" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue respectfully and clearly" />
              </Field>
              <Button type="submit" className="w-full"><Send size={14} /> Submit anonymously</Button>
            </form>
          </Card>
        </Reveal>
      )}

      <Stagger className="space-y-3">
        {db.grievances.map((grievance) => {
          const support = grievance.upvotedBy.length;
          const majority = support >= 13;
          const percent = (support / BATCH_SIZE) * 100;
          const hasUpvoted = !!currentUser && grievance.upvotedBy.includes(currentUser.uid);
          const report = reports[grievance.id] || grievance.reports[0]?.text || "";
          return (
            <StaggerItem key={grievance.id}>
              <Card className={majority ? "!border-emerald-400/30 !shadow-[0_0_32px_rgba(16,185,129,0.12)]" : ""}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${majority ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-zinc-400"}`}>
                      {majority ? <ShieldCheck size={15} /> : <MessageSquareWarning size={15} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pill>{grievance.category}</Pill>
                        {majority && <Pill tone="safe"><ShieldCheck size={10} /> Majority Reached</Pill>}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-300">{grievance.description}</p>
                      <p className="mt-1.5 text-[0.62rem] text-zinc-600">{formatDate(grievance.date)} · anonymous</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[0.68rem]">
                    <span className="text-zinc-400">{support} / {BATCH_SIZE} students support</span>
                    <span className="mono text-zinc-500">{Math.round(percent)}%</span>
                  </div>
                  <ProgressBar value={percent} tone={majority ? "safe" : "accent"} />
                </div>

                <motion.button
                  whileTap={reduce || hasUpvoted ? undefined : tapPhysics}
                  disabled={hasUpvoted}
                  onClick={() => upvoteGrievance(grievance.id)}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-[0.7rem] font-bold ${hasUpvoted ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-zinc-300"}`}
                >
                  <ThumbsUp size={13} /> {hasUpvoted ? "Supported" : "I support this"}
                </motion.button>

                {majority && isCR && (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <Button onClick={() => void generate(grievance.id, grievance.description, grievance.category, grievance.date, support)} disabled={!!generating} className="w-full">
                      <FileText size={14} /> {generating === grievance.id ? "Drafting..." : "Auto-Generate HOD Report"}
                    </Button>
                  </div>
                )}

                {report && (
                  <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mt-3 border-t border-white/10 pt-3">
                    <Pill tone="safe"><FileText size={10} /> Official draft</Pill>
                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-[0.66rem] leading-relaxed text-zinc-400">{report}</pre>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button variant="ghost" onClick={() => void copyText(report).then(() => setCopiedId(grievance.id))} className="flex items-center justify-center gap-1.5">
                        <Copy size={13} /> {copiedId === grievance.id ? "Copied" : "Copy Letter"}
                      </Button>
                      <Button onClick={() => downloadPDF(report, `HOD-Report-${grievance.category}.pdf`)} className="flex items-center justify-center gap-1.5">
                        <Download size={13} /> Download PDF
                      </Button>
                    </div>
                  </motion.div>
                )}
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}

function Projects() {
  const { db, currentUser, isCR, addProject, toggleProjectStatus, requestJoin, addTeammate } = useApp();
  const reduce = !!useReducedMotion();
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showMateForm, setShowMateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Minor" | "Major">("Minor");
  const [stack, setStack] = useState("");
  const [skills, setSkills] = useState("");
  const [note, setNote] = useState("");

  function submitProject(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addProject(title, type, stack.split(",").map((s) => s.trim()).filter(Boolean));
    setTitle(""); setStack(""); setShowGroupForm(false);
  }

  function submitTeammate(e: React.FormEvent) {
    e.preventDefault();
    if (!skills.trim()) return;
    addTeammate(skills.split(",").map((s) => s.trim()).filter(Boolean), note);
    setSkills(""); setNote(""); setShowMateForm(false);
  }

  return (
    <>
      <Section
        title="Locked project teams"
        subtitle="No duplicate topics · approval status is live"
        action={<Button onClick={() => setShowGroupForm((v) => !v)} className="!px-3 !py-1.5"><Plus size={14} /></Button>}
      >
        {showGroupForm && (
          <Reveal>
            <Card className="mb-3">
              <form onSubmit={submitProject} className="space-y-3">
                <Field label="Project title"><input className="glass-input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Smart Attendance System" /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Type">
                    <select className="glass-input" value={type} onChange={(e) => setType(e.target.value as "Minor" | "Major")}><option>Minor</option><option>Major</option></select>
                  </Field>
                  <Field label="Tech stack"><input className="glass-input" value={stack} onChange={(e) => setStack(e.target.value)} placeholder="React, Firebase" /></Field>
                </div>
                <Button type="submit" className="w-full">Lock topic</Button>
              </form>
            </Card>
          </Reveal>
        )}

        {db.projects.length === 0 ? (
          <Empty icon={<Users size={26} />} title="No teams yet" text="Lock the first project topic." />
        ) : (
          <Stagger className="space-y-3">
            {db.projects.map((project) => {
              const requested = !!currentUser && project.requests.some((r) => r.includes(currentUser.rollNo));
              return (
                <StaggerItem key={project.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Pill tone="accent">{project.type}</Pill>
                          <Pill tone={project.status === "Faculty Approved" ? "safe" : "warn"}>
                            {project.status === "Faculty Approved" ? <Check size={10} /> : <Lock size={10} />} {project.status}
                          </Pill>
                        </div>
                        <h3 className="mt-2 text-sm font-bold text-zinc-100">{project.title}</h3>
                      </div>
                      {isCR && (
                        <button onClick={() => toggleProjectStatus(project.id)} className="rounded-lg border border-white/10 px-2 py-1 text-[0.6rem] font-bold text-zinc-400 hover:text-white">
                          Toggle
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-[0.7rem] text-zinc-400"><span className="text-zinc-600">Members:</span> {project.members.join(", ")}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {project.stack.map((item) => <span key={item} className="mono rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.6rem] text-zinc-400">{item}</span>)}
                    </div>
                    <motion.button
                      whileTap={reduce || requested ? undefined : tapPhysics}
                      disabled={requested}
                      onClick={() => requestJoin(project.id)}
                      className={`mt-3 w-full rounded-xl border py-2 text-[0.7rem] font-bold ${requested ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-indigo-400/25 bg-indigo-500/10 text-indigo-300"}`}
                    >
                      {requested ? `Requested · ${project.requests.length} pending` : "Request to Join"}
                    </motion.button>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </Section>

      <Section
        title="Looking for teammates"
        subtitle="Solo students can list skills and find a group"
        action={<Button onClick={() => setShowMateForm((v) => !v)} className="!px-3 !py-1.5">{showMateForm ? <span className="text-lg leading-none">×</span> : <Plus size={14} />}</Button>}
      >
        {showMateForm && (
          <Reveal>
            <Card className="mb-3">
              <form onSubmit={submitTeammate} className="space-y-3">
                <Field label="Your skills (comma separated)"><input className="glass-input" required value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python/ML, UI/UX" /></Field>
                <Field label="Short note"><textarea className="glass-input min-h-16 resize-y text-xs" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Looking for a backend partner" /></Field>
                <Button type="submit" className="w-full">Post availability</Button>
              </form>
            </Card>
          </Reveal>
        )}
        <Stagger className="space-y-2.5">
          {db.teammates.map((mate) => (
            <StaggerItem key={mate.id}>
              <Card className="!p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-[0.65rem] font-bold text-indigo-300 mono">{mate.rollNo}</div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{mate.name}</p>
                      <p className="text-[0.62rem] text-zinc-500">{mate.note || "Open to project work"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="!px-2.5 !py-1.5 !text-[0.65rem]" onClick={() => setShowGroupForm(true)}>Connect</Button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {mate.skills.map((skill) => <Pill key={skill} tone="accent">{skill}</Pill>)}
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </>
  );
}

export function BatchHub() {
  const [tab, setTab] = useState<HubTab>("polls");
  const reduce = !!useReducedMotion();
  const tabs: { key: HubTab; label: string; icon: typeof Vote }[] = [
    { key: "polls", label: "Polls", icon: Vote },
    { key: "grievances", label: "Grievances", icon: MessageSquareWarning },
    { key: "projects", label: "Projects", icon: Users },
  ];

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-[#09090b]/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[0.68rem] font-bold ${tab === key ? "text-white" : "text-zinc-500"}`}
            >
              {tab === key && (
                <motion.span layoutId="hubTabIndicator" transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/25" />
              )}
              <Icon size={13} className="relative z-10" /><span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : spring}
        >
          {tab === "polls" && <Polls />}
          {tab === "grievances" && <Grievances />}
          {tab === "projects" && <Projects />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
