import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock3, Copy, FilePlus2, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, Card, Field, Reveal, Section } from "../components/ui";
import { spring, tapPhysics } from "../motion";
import { getCurrentClassSlot } from "../data/timetable";
import { askAI } from "../services/ai";
import { useApp } from "../services/store";
import { SUBJECTS, UNITS, type AIMode } from "../types";
import { copyText } from "../utils";

const CHIPS: { label: string; mode: AIMode; icon: string }[] = [
  { label: "Generate 5-Mark Exam Notes", mode: "five-mark", icon: "📝" },
  { label: "Explain with Real-World Example", mode: "real-world", icon: "🌍" },
  { label: "5 Expected Viva Q&As", mode: "viva", icon: "🎤" },
];

export function AITutor() {
  const { addResource, currentUser, db } = useApp();
  const reduce = !!useReducedMotion();
  const [subject, setSubject] = useState(() => getCurrentClassSlot(new Date(), db.timetable)?.subject || SUBJECTS[0]);
  const [unit, setUnit] = useState(UNITS[0]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [lastMode, setLastMode] = useState<AIMode>("five-mark");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function run(mode: AIMode) {
    if (loading) return;
    setLoading(true);
    setError("");
    setLastMode(mode);
    try {
      const text = await askAI({ mode, subject, question: question.trim() || subject });
      setAnswer(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAnswer() {
    await copyText(answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function saveToVault() {
    if (!answer || !currentUser) return;
    const title = lastMode === "viva" ? `${subject} — Expected Viva Q&As` : lastMode === "real-world" ? `${subject} — Real-World Explanation` : `${subject} — 5 Mark Exam Notes`;
    addResource({
      type: "link",
      title,
      subject,
      category: "Lecture Notes",
      unit,
      url: "https://drive.google.com/",
      source: "ai",
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div>
      <Section title="AI study partner" subtitle="Groq · GPT OSS 20B · no app-level daily cap">
        <Reveal>
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)]">
                <WandSparkles size={19} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100">Ask anything from the syllabus</p>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-zinc-500">
                  Live answers use Groq through the secured Cloud Function. The local demo falls back to instant templates.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Field label="Subject">
                <select className="glass-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select className="glass-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4 space-y-2">
              {CHIPS.map((chip) => (
                <motion.button
                  key={chip.mode}
                  whileTap={reduce ? undefined : tapPhysics}
                  onClick={() => {
                    if (chip.mode === "five-mark") setQuestion(`Generate 5-mark notes for ${subject}`);
                    if (chip.mode === "real-world") setQuestion(`Explain a ${subject} concept with a real-world example`);
                    if (chip.mode === "viva") setQuestion(`Give 5 expected viva questions for ${subject}`);
                    void run(chip.mode);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-xs font-semibold text-zinc-300 hover:border-indigo-400/30 hover:bg-indigo-500/10"
                >
                  <span>{chip.icon}</span> {chip.label}
                </motion.button>
              ))}
            </div>

            <div className="mt-4">
              <Field label="Custom question (optional)">
                <textarea className="glass-input min-h-20 resize-y text-xs" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a specific topic, e.g. deadlock avoidance in OS" />
              </Field>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button onClick={() => void run("five-mark")} disabled={loading} className="flex w-full items-center justify-center gap-2 py-2.5">
                {loading ? <Clock3 size={15} className="animate-spin" /> : <Sparkles size={15} />} {loading ? "Thinking..." : "Generate answer"}
              </Button>
            </div>
            {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
          </Card>
        </Reveal>
      </Section>

      <AnimatePresence mode="wait">
        {answer && (
          <motion.div
            key={answer.slice(0, 40)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : spring}
          >
            <Section title="AI answer" subtitle="Generated notes can be published to the shared vault">
              <Card>
                <div className="md-body text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="ghost" onClick={() => void copyAnswer()} className="flex items-center justify-center gap-1.5">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button onClick={saveToVault} className="flex items-center justify-center gap-1.5">
                    {saved ? <Check size={14} /> : <FilePlus2 size={14} />} {saved ? "Saved" : "Save to Vault"}
                  </Button>
                </div>
              </Card>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
