"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { Play, Pause, DollarSign, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function PayrollStreamPage() {
  const { user, accumulatedPayroll, addPayroll } = useStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const hourlyRate = 25.50;
  const perSecondRate = hourlyRate / 3600;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(() => {
        addPayroll(perSecondRate);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStreaming, addPayroll, perSecondRate]);

  if (user?.role !== 'EMPLOYEE') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Only employees can access the payroll streaming system.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Real-Time Payroll Stream</h1>
        <p className="text-muted-foreground text-sm mt-1">Watch your earnings accumulate per second.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-2 bg-card border border-border p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
              <Activity size={14} className={isStreaming ? "text-green-400 animate-pulse" : ""} />
              {isStreaming ? "Stream Active" : "Stream Paused"}
            </span>
          </div>

          <h2 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono">
            ${accumulatedPayroll.toFixed(4)}
          </h2>
          
          <p className="text-muted-foreground mt-4 font-medium flex items-center justify-center gap-2">
            <DollarSign size={16} /> Earnings via smart contract simulation
          </p>

          <div className="mt-8">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className="flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-xl font-semibold hover:bg-foreground/90 transition-all active:scale-95"
            >
              {isStreaming ? (
                <><Pause size={18} /> Pause Stream</>
              ) : (
                <><Play size={18} /> Start Working</>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hourly Rate</h3>
            <p className="text-3xl font-bold">${hourlyRate.toFixed(2)}<span className="text-base text-muted-foreground font-normal">/hr</span></p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Per Second</h3>
            <p className="text-2xl font-bold font-mono text-indigo-400">${perSecondRate.toFixed(4)}<span className="text-base text-muted-foreground font-normal">/s</span></p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</h3>
            <p className="text-sm">
              Your funds are streamed directly to your internal non-custodial wallet balance upon generation.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
