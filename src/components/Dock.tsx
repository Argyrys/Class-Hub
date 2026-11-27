import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Home, Shield, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TabKey } from "../types";
import { spring, tapPhysics } from "../motion";

interface DockProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  isCR: boolean;
}

export function Dock({ active, onChange, isCR }: DockProps) {
  const reduce = !!useReducedMotion();
  const items: { key: TabKey; label: string; icon: LucideIcon }[] = [
    { key: "home", label: "Home", icon: Home },
    { key: "vault", label: "Vault", icon: BookOpen },
    { key: "ai", label: "AI Tutor", icon: Sparkles },
    { key: "batch", label: "Batch", icon: Users },
    ...(isCR ? [{ key: "admin" as TabKey, label: "CR", icon: Shield }] : []),
  ];

  return (
    <nav className="dock" aria-label="Main navigation">
      <div className="flex items-center justify-around gap-0.5">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <motion.button
              key={key}
              onClick={() => onChange(key)}
              whileTap={reduce ? undefined : tapPhysics}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.58rem] font-bold transition-colors ${
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeTabIndicator"
                  transition={reduce ? { duration: 0 } : spring}
                  className="absolute inset-0 rounded-xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/25 to-violet-500/15 shadow-[0_0_18px_rgba(99,102,241,0.25)]"
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} className="relative z-10" />
              <span className="relative z-10 truncate">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
