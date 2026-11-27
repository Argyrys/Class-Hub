import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Check, Code2, Copy, Download, Filter, Link2, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button, Card, Empty, Field, Pill, Reveal, Section, Stagger, StaggerItem } from "../components/ui";
import { tapPhysics } from "../motion";
import { useApp } from "../services/store";
import { CATEGORIES, SUBJECTS, UNITS, type Resource } from "../types";
import { copyText, formatDate } from "../utils";

function ResourceCard({ resource }: { resource: Resource }) {
  const reduce = !!useReducedMotion();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await copyText(resource.code || "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <StaggerItem>
      <Card className="!p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <Pill tone={resource.type === "code" ? "accent" : "default"}>
                {resource.type === "code" ? <Code2 size={10} /> : <Link2 size={10} />}
                {resource.type === "code" ? "Code" : "Link / PDF"}
              </Pill>
              <Pill>{resource.subject}</Pill>
              {resource.source === "ai" && <Pill tone="safe">AI</Pill>}
            </div>
            <h3 className="text-sm font-bold leading-snug text-zinc-100">{resource.title}</h3>
            <p className="mt-1 text-[0.65rem] text-zinc-500">{resource.unit} · {resource.category}</p>
          </div>
          <span className="mono shrink-0 text-[0.6rem] text-zinc-600">{resource.uploaderName.split(" ")[0]}</span>
        </div>

        {resource.type === "code" ? (
          <div className="mt-3">
            <div className="code-block">
              <SyntaxHighlighter language={resource.language || "java"} style={oneDark} customStyle={{ margin: 0, background: "transparent", padding: "0.85rem" }}>
                {resource.code || ""}
              </SyntaxHighlighter>
            </div>
            {resource.expectedOutput && (
              <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[0.68rem] leading-relaxed text-zinc-400">
                <span className="font-bold text-zinc-300">Expected output: </span>{resource.expectedOutput}
              </p>
            )}
            <motion.button
              whileTap={reduce ? undefined : tapPhysics}
              onClick={copy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 py-2 text-xs font-bold text-indigo-300"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy Code"}
            </motion.button>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[0.65rem] text-zinc-600">Added {formatDate(resource.createdAt)}</span>
            <a
              href={resource.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2 text-[0.68rem] font-bold text-white"
            >
              <Download size={13} /> Open Drive / PDF
            </a>
          </div>
        )}
      </Card>
    </StaggerItem>
  );
}

export function Vault() {
  const { db, addResource } = useApp();
  const [subject, setSubject] = useState("All");
  const [category, setCategory] = useState("All");
  const [unit, setUnit] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"link" | "code">("link");
  const [title, setTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0]);
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("java");
  const [expectedOutput, setExpectedOutput] = useState("");

  const filtered = useMemo(() => db.resources.filter((item) =>
    (subject === "All" || item.subject === subject) &&
    (category === "All" || item.category === category) &&
    (unit === "All" || item.unit === unit)
  ), [db.resources, subject, category, unit]);

  function reset() {
    setTitle(""); setUrl(""); setCode(""); setExpectedOutput(""); setShowForm(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addResource({
      type,
      title,
      subject: selectedSubject,
      category: selectedCategory,
      unit: selectedUnit,
      url: type === "link" ? url : undefined,
      code: type === "code" ? code : undefined,
      language: type === "code" ? language : undefined,
      expectedOutput: type === "code" ? expectedOutput : undefined,
    });
    reset();
  }

  return (
    <div>
      <Section
        title="Notes & lab code vault"
        subtitle={`${db.resources.length} shared resources · filter by subject, category and unit`}
        action={<Button onClick={() => setShowForm((v) => !v)} className="!px-3 !py-1.5">{showForm ? <X size={14} /> : <Plus size={14} />}</Button>}
      >
        {showForm && (
          <Reveal>
            <Card className="mb-3">
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Type">
                    <select className="glass-input" value={type} onChange={(e) => setType(e.target.value as "link" | "code")}>
                      <option value="link">Link / PDF</option>
                      <option value="code">Code Snippet</option>
                    </select>
                  </Field>
                  <Field label="Subject">
                    <select className="glass-input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Title">
                  <input className="glass-input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Deadlock notes" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Category">
                    <select className="glass-input" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Unit">
                    <select className="glass-input" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </Field>
                </div>
                {type === "link" ? (
                  <Field label="Google Drive / PDF URL">
                    <input className="glass-input" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/..." />
                  </Field>
                ) : (
                  <>
                    <Field label="Language">
                      <input className="glass-input" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="java, python, c++" />
                    </Field>
                    <Field label="Code">
                      <textarea className="glass-input mono min-h-32 resize-y text-[0.7rem]" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your lab program" />
                    </Field>
                    <Field label="Expected output (optional)">
                      <textarea className="glass-input min-h-16 resize-y text-xs" value={expectedOutput} onChange={(e) => setExpectedOutput(e.target.value)} />
                    </Field>
                  </>
                )}
                <Button type="submit" className="w-full">Publish to vault</Button>
              </form>
            </Card>
          </Reveal>
        )}

        <Reveal>
          <Card className="!p-3">
            <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-wider text-zinc-500">
              <Filter size={13} /> Filters
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select className="glass-input !px-2 !text-xs" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option>All</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="glass-input !px-2 !text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className="glass-input !px-2 !text-xs" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option>All</option>{UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </Card>
        </Reveal>
      </Section>

      <Section title={`Showing ${filtered.length} resource${filtered.length === 1 ? "" : "s"}`}>
        {filtered.length === 0 ? (
          <Empty icon={<BookOpen size={26} />} title="No resources here yet" text="Try another filter or add the first note." />
        ) : (
          <Stagger className="space-y-3">
            {filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
          </Stagger>
        )}
      </Section>
    </div>
  );
}
