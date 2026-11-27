import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Download, LogOut, Shield, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { ReactLenis } from "lenis/react";
import { AlertTakeover } from "./components/AlertTakeover";
import { Dock } from "./components/Dock";
import { Pill } from "./components/ui";
import { SignIn } from "./components/SignIn";
import { spring } from "./motion";
import { onForegroundAlert, requestMessagingToken } from "./services/firebase";
import { useApp } from "./services/store";
import { Home } from "./screens/Home";
import type { TabKey } from "./types";

const Vault = lazy(() => import("./screens/Vault").then((m) => ({ default: m.Vault })));
const AITutor = lazy(() => import("./screens/AITutor").then((m) => ({ default: m.AITutor })));
const BatchHub = lazy(() => import("./screens/BatchHub").then((m) => ({ default: m.BatchHub })));
const CRAdmin = lazy(() => import("./screens/CRAdmin").then((m) => ({ default: m.CRAdmin })));

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

function AppShell() {
  const { currentUser, db, isCR, signOut } = useApp();
  const reduce = !!useReducedMotion();
  const [tab, setTab] = useState<TabKey>("home");
  const [toast, setToast] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if (currentUser) void requestMessagingToken();
  }, [currentUser?.uid]);

  useEffect(() => onForegroundAlert((body) => {
    setToast(body);
    window.setTimeout(() => setToast(null), 5000);
  }), []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!isCR && tab === "admin") setTab("home");
  }, [isCR, tab]);

  if (!currentUser) return <SignIn />;

  const unread = db.alerts.filter((alert) => alert.isUrgent && alert.active !== false && !alert.readBy.includes(currentUser.uid)).length;

  const screens: Record<TabKey, React.ReactNode> = {
    home: <Home />,
    vault: <Vault />,
    ai: <AITutor />,
    batch: <BatchHub />,
    admin: <CRAdmin />,
  };

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <ReactLenis root options={{ lerp: reduce ? 1 : 0.1, smoothWheel: !reduce }}>
      <div className="app-shell">
        <header className="app-header">
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><Sparkles size={14} /></div>
                <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-zinc-400">MCA Batch Hub</span>
              </div>
              <h1 className="truncate text-[1.35rem] font-extrabold tracking-tight text-white">
                {tab === "home" ? `Hey, ${currentUser.name.split(" ")[0]}` : tab === "vault" ? "Notes Vault" : tab === "ai" ? "AI Tutor" : tab === "batch" ? "Batch Hub" : "CR Admin"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Pill tone="accent">Roll <span className="mono">{currentUser.rollNo}</span></Pill>
                {isCR && <Pill tone="safe"><Shield size={10} /> CR</Pill>}
                <Pill><span className="mono">{db.users.length}</span> / 24 joined</Pill>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400">
                <Bell size={16} />
                {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[0.55rem] font-bold text-white">{unread}</span>}
              </div>
              <button onClick={() => void install()} className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:text-white" aria-label="Install app">
                <Download size={16} />
              </button>
              <button onClick={signOut} className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:text-white" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={tab}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : spring}
          >
            <Suspense fallback={<div className="px-4 py-12 text-center text-xs text-zinc-500">Loading workspace…</div>}>
              {screens[tab]}
            </Suspense>
          </motion.main>
        </AnimatePresence>

        <Dock active={tab} onChange={setTab} isCR={isCR} />
        <AlertTakeover />

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed left-1/2 top-4 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-indigo-400/30 bg-zinc-900/95 px-4 py-3 text-xs text-zinc-200 shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-2"><Bell size={15} className="text-indigo-300" /> {toast}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ReactLenis>
  );
}

export default function App() {
  return <AppShell />;
}
