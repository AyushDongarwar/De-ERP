"use client";

import { useState, useEffect } from "react";
import { getAdminConfig, updateBotConfig, getSuperAdminAnalytics } from "@/app/actions";
import { Bot, TrendingUp, Zap, Settings, RefreshCcw, Activity, ShieldCheck, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LivePulseChart } from "./Charts";

export default function BotManagement() {
  const [config, setConfig] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [newROI, setNewROI] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    const [conf, data] = await Promise.all([
      getAdminConfig(),
      getSuperAdminAnalytics()
    ]);
    setConfig(conf);
    setAnalytics(data);
    // Safety check with fallback to prevent toString() crash
    if (!newROI) setNewROI((conf?.botReturnPercentage ?? 8.5).toString());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateROI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateBotConfig(Number(newROI), config?.botActive ?? true);
    await fetchData();
    setIsUpdating(false);
  };

  const handleToggleBot = async () => {
    setIsUpdating(true);
    const newStatus = !(config?.botActive ?? true);
    await updateBotConfig(Number(newROI), newStatus);
    await fetchData();
    setIsUpdating(false);
  };

  if (!config || !analytics) return <div className="p-8 animate-pulse text-muted-foreground">Initializing Bot Matrix...</div>;

  const isBotActive = config?.botActive ?? true;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className={isBotActive ? "text-cyan-400" : "text-muted-foreground"} /> Bot Ecosystem Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Configure automated yield generation and monitor network-wide bot allocations.</p>
        </div>
        <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border ${
          isBotActive 
            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
            <Activity size={16} className={isBotActive ? "animate-pulse" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isBotActive ? "Neural Engine Active" : "Engine Terminated"}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Performance Pulse */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl relative overflow-hidden group">
          {!isBotActive && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <ShieldCheck size={48} className="text-red-400 mb-2 opacity-50" />
              <p className="text-sm font-bold text-red-400 uppercase tracking-tighter">Performance Tracking Paused</p>
            </div>
          )}
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={120} className="text-cyan-400" />
          </div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" /> Network Yield Pulse
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Simulated real-time tracking of the aggregated bot pool performance.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Pool Allocation</span>
              <p className="text-3xl font-black font-mono text-cyan-400">${analytics.globalMode.totalBotAllocation.toLocaleString()}</p>
            </div>
          </div>
          <LivePulseChart baseValue={analytics.globalMode.totalBotAllocation} />
        </motion.div>

        {/* Global Control Column */}
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border p-6 rounded-3xl border-t-4 border-t-cyan-500 shadow-xl">
                <div className="flex items-center gap-2 mb-6 text-cyan-400">
                    <Settings size={20} />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Yield Governance</h4>
                </div>
                
                <form onSubmit={handleUpdateROI} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Target ROI Percentage (%)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={newROI} 
                                onChange={e => setNewROI(e.target.value)} 
                                step="0.1" 
                                className="w-full bg-background border border-border rounded-xl px-4 py-4 text-2xl font-black font-mono focus:outline-none focus:border-cyan-500 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground/30">%</span>
                        </div>
                    </div>

                    <div className="bg-secondary/30 p-4 rounded-2xl border border-border/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Current Rate</span>
                            <span className="text-sm font-bold text-cyan-400">{config?.botReturnPercentage ?? 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Engine Status</span>
                            <span className={`text-sm font-bold ${isBotActive ? "text-emerald-400" : "text-red-400"}`}>
                                {isBotActive ? "Operational" : "Manual Override"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            type="submit" 
                            disabled={isUpdating} 
                            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white py-4 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(34,211,238,0.1)] flex items-center justify-center gap-2"
                        >
                            {isUpdating ? <RefreshCcw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                            {isUpdating ? "Synching Network..." : "Apply Global ROI"}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={handleToggleBot}
                            disabled={isUpdating} 
                            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                                isBotActive 
                                    ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20" 
                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                            }`}
                        >
                            {isBotActive ? "Immediate Stop Request" : "Resume Bot Operations"}
                        </button>
                    </div>
                </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-cyan-500/5 border border-cyan-500/20 p-6 rounded-3xl">
                <div className="flex items-center gap-2 mb-4 text-cyan-100">
                    <Zap size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest">Ecosystem Impact</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    "Adjusting the ROI rate directly influences the projected earnings of all organizations. The bot pool represents the aggregate capital diverted for automated network growth."
                </p>
            </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Metrics */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border p-6 rounded-3xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-indigo-400" /> Network Distribution Metrics
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><DollarSign size={16}/></div>
                    <span className="text-sm font-medium">Avg. Bot Cut per Node</span>
                </div>
                <span className="font-mono font-bold text-indigo-400 text-lg">$1,127</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><RefreshCcw size={16}/></div>
                    <span className="text-sm font-medium">Reinvestment Ratio</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-lg">94.2%</span>
            </div>
          </div>
        </motion.div>

        {/* Legend / Info */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-center">
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">The <strong>ROI Percentage</strong> set here is used to calculate the simulated returns that organizations see in their dashboards.</p>
                </div>
                <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <p className="text-sm text-muted-foreground"><strong>Bot Allocation</strong> is the aggregate of all funds diverted from employee salaries across the entire platform.</p>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
