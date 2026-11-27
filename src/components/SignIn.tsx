import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { useApp } from "../services/store";
import { ROLLS } from "../types";
import { tapPhysics } from "../motion";
import { Button, Field, Pill } from "./ui";

export function SignIn() {
  const { users, signIn } = useApp();
  const reduce = !!useReducedMotion();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [error, setError] = useState("");

  const usedRolls = new Set(users.map((u) => u.rollNo));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      signIn(email, name, rollNo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    }
  }

  function demo(kind: "cr" | "student") {
    const demoEmail = kind === "cr" ? "cr@batch.test" : `student${Date.now() % 100000}@batch.test`;
    const free = ROLLS.find((roll) => !usedRolls.has(roll)) || "";
    signIn(demoEmail, kind === "cr" ? "Class Representative" : "Demo Student", kind === "cr" ? "01" : free);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.45 }}
        className="glass-card w-full max-w-md p-6"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_10px_35px_rgba(99,102,241,0.4)]">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">MCA Batch Hub</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Your batch, attendance, notes and AI tutor — in one pocket-sized workspace.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Pill tone="accent">Mock-first demo</Pill>
            <Pill><Shield size={11} /> 24 seats</Pill>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Google email">
            <input className="glass-input" type="email" required placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Your name">
            <input className="glass-input" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Pick your roll number">
            <div className="grid grid-cols-6 gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-2.5">
              {ROLLS.map((roll) => {
                const taken = usedRolls.has(roll);
                const selected = rollNo === roll;
                return (
                  <motion.button
                    key={roll}
                    type="button"
                    disabled={taken}
                    whileTap={reduce || taken ? undefined : tapPhysics}
                    onClick={() => setRollNo(roll)}
                    className={`mono rounded-lg border py-1.5 text-[0.68rem] font-bold transition-colors ${
                      selected ? "border-indigo-400 bg-indigo-500/25 text-white" : taken ? "border-white/5 bg-white/[0.02] text-zinc-700 line-through" : "border-white/10 bg-white/5 text-zinc-300 hover:border-indigo-400/40"
                    }`}
                  >
                    {roll}
                  </motion.button>
                );
              })}
            </div>
          </Field>
          {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
          <Button type="submit" className="flex w-full items-center justify-center gap-2 py-3">
            Continue <ArrowRight size={16} />
          </Button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-[0.65rem] text-zinc-600 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
          or try a demo
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => demo("cr")} className="flex items-center justify-center gap-1.5">
            <Shield size={14} /> CR demo
          </Button>
          <Button variant="ghost" onClick={() => demo("student")} className="flex items-center justify-center gap-1.5">
            <Check size={14} /> Student demo
          </Button>
        </div>
        <p className="mt-5 text-center text-[0.65rem] leading-relaxed text-zinc-600">
          Accounts are created locally. Use <span className="mono text-zinc-500">cr@batch.test</span> for the CR role.
        </p>
      </motion.div>
    </div>
  );
}
