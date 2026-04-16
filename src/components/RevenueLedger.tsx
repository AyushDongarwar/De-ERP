"use client";

import { useState, useEffect } from "react";
import { getSuperAdminAnalytics, getAdminConfig, getProtocolTransactions } from "@/app/actions";
import { Coins, Activity, Trophy, History, ArrowRightLeft, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function RevenueLedger() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [protocolHistory, setProtocolHistory] = useState<any[]>([]);

  const fetchData = async () => {
    const [data, adminConf, history] = await Promise.all([
      getSuperAdminAnalytics(),
      getAdminConfig(),
      getProtocolTransactions()
    ]);
    setAnalytics(data);
    setConfig(adminConf);
    setProtocolHistory(history);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!analytics || !config) return <div className="p-8 animate-pulse text-muted-foreground">Loading Revenue Hub...</div>;

  const { orgStats } = analytics;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="text-indigo-400" /> Revenue Ledger & Fees
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Audit platform earnings and organization fee contributions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-indigo-500/20 to-card border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <TrendingUp size={120} className="text-indigo-400" />
            </div>
            <div className="flex items-center gap-2 text-indigo-400 mb-4">
              <Activity size={18} />
              <span className="text-sm font-bold uppercase tracking-widest">Platform Commission</span>
            </div>
            <div className="text-6xl font-black font-mono tracking-tighter text-foreground">
              ${(analytics.globalMode.totalFeesCollected || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
              Consolidated revenue generated from dynamic conversion fees on organization protocol withdrawals.
            </p>
          </motion.div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl">
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-lg">
              <Trophy size={20} className="text-yellow-400" /> Fee Generation Leaders
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...orgStats].sort((a,b) => (b.currencyFeeRev || 0) - (a.currencyFeeRev || 0)).slice(0, 6).map((org, i) => (
                <div key={org.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50 group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-background text-muted-foreground'}`}>
                      #{i + 1}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[140px]">{org.email}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400">${(org.currencyFeeRev || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-3xl flex flex-col min-h-[400px]">
        <h3 className="font-semibold mb-6 flex items-center gap-2 text-lg">
          <History size={20} className="text-indigo-400" /> Recent Protocol Activity Ledger
        </h3>
        <div className="flex-1 overflow-auto">
          {protocolHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
              <ArrowRightLeft size={64} className="opacity-10 mb-4" />
              <p className="italic">No withdrawal activity has been recorded on the ledger yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-xl">
                <tr>
                  <th className="px-6 py-4 rounded-l-xl text-indigo-400">Organization</th>
                  <th className="px-6 py-4">Gross Amount</th>
                  <th className="px-6 py-4 text-emerald-400">Fee Contribution</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 rounded-r-xl text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {protocolHistory.map((tx: any) => {
                  const meta = JSON.parse(tx.metadata || "{}");
                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-5 font-medium">{tx.user?.email || "Unknown Organization"}</td>
                      <td className="px-6 py-5 font-mono text-muted-foreground">${tx.amount.toLocaleString()}</td>
                      <td className="px-6 py-5 font-mono font-bold text-emerald-400">
                        +${(meta.feePaid || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-muted-foreground text-xs font-medium">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-green-500/20">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
