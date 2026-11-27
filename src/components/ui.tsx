import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { getEntranceVariants, tapPhysics } from "../motion";

export function Section({ title, subtitle, action, children, className = "" }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-4 pb-5 ${className}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[0.98rem] font-extrabold tracking-tight text-zinc-100">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[0.72rem] leading-snug text-zinc-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass-card p-4 ${className}`}>{children}</div>;
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = !!useReducedMotion();
  const variants = getEntranceVariants(reduce);
  return (
    <motion.div
      className={className}
      variants={variants.item}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ ...(variants.item.show as object), delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = !!useReducedMotion();
  const variants = getEntranceVariants(reduce);
  return (
    <motion.div
      className={className}
      variants={variants.container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = !!useReducedMotion();
  const variants = getEntranceVariants(reduce);
  return <motion.div className={className} variants={variants.item}>{children}</motion.div>;
}

export function Pill({ children, tone = "default", className = "" }: {
  children: ReactNode;
  tone?: "default" | "safe" | "warn" | "danger" | "accent";
  className?: string;
}) {
  const tones = {
    default: "border-white/10 bg-white/5 text-zinc-300",
    safe: "status-safe",
    warn: "status-warn",
    danger: "status-danger",
    accent: "border-indigo-400/30 bg-indigo-500/10 text-indigo-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-bold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Button({ children, onClick, variant = "primary", className = "", disabled = false, type = "button" }: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const reduce = !!useReducedMotion();
  const base = variant === "primary" ? "primary-button" : variant === "danger" ? "ghost-button !text-rose-300 !border-rose-400/25" : "ghost-button";
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={reduce || disabled ? undefined : tapPhysics}
      className={`px-3.5 py-2 text-[0.76rem] transition-opacity disabled:opacity-40 ${base} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center">
      <div className="mb-2 text-zinc-600">{icon}</div>
      <p className="text-sm font-bold text-zinc-300">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{text}</p>
    </div>
  );
}

export function ProgressBar({ value, tone = "accent", height = "h-2" }: {
  value: number;
  tone?: "accent" | "safe" | "warn" | "danger";
  height?: string;
}) {
  const reduce = !!useReducedMotion();
  const colors = {
    accent: "from-indigo-500 to-violet-500",
    safe: "from-emerald-500 to-teal-400",
    warn: "from-amber-500 to-orange-400",
    danger: "from-rose-500 to-pink-400",
  };
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/5 ${height}`}>
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${colors[tone]}`}
        initial={{ width: reduce ? `${Math.min(100, Math.max(0, value))}%` : 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
