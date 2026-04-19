"use client";

import { useState, useEffect } from "react";
import { getOrganizations, getSuperAdminAnalytics, getAdminConfig, updateUserStatus } from "@/app/actions";
import { DollarSign, TrendingUp, Users, Activity, Trophy, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { OrgPerformanceChart } from "./Charts";

export default function SuperAdminOverview() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    const data = await getSuperAdminAnalytics();
    setAnalytics(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (orgId: string, currentStatus: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await updateUserStatus(orgId, !currentStatus);
      await fetchData();
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!analytics) return <div className="p-8 text-muted-foreground animate-pulse">Loading Platform Overview...</div>;

  const { globalMode, orgStats } = analytics;
  
  const filteredOrgs = orgStats?.filter((o: any) => {
    const isActive = o.isActive === true || o.isActive === 1;
    return isActive === !showArchived;
  }) || [];

  const chartData = filteredOrgs.slice(0, 10).map((o: any) => ({
    name: o.email.split('@')[0],
    botRevenue: Math.floor(o.botRevenue)
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="text-indigo-400" /> Platform Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Global performance metrics and organization health monitoring.</p>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-2xl border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <DollarSign size={18} />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Total Ecosystem Liquidity</span>
          </div>
          <h3 className="text-3xl font-black">${globalMode.totalPlatformFunds.toLocaleString()}</h3>
          <p className="text-[10px] text-indigo-300/60 mt-2 font-medium">Realized balances + Protocol reserve</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-2xl border-l-4 border-l-cyan-500 relative overflow-hidden">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-100">Simulated Monthly Yield</span>
          </div>
          <h3 className="text-3xl font-black text-cyan-400">${Math.floor(globalMode.totalNetworkBotProfit).toLocaleString()}</h3>
          <p className="text-[10px] text-cyan-300/60 mt-2 font-medium">Projected network performance</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-6 rounded-2xl border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <Users size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Network Nodes</span>
          </div>
          <h3 className="text-3xl font-black">{globalMode.totalActiveWorkforce}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-6 rounded-2xl border-l-4 border-l-pink-500">
          <div className="flex items-center gap-3 text-muted-foreground mb-3 font-bold uppercase tracking-widest text-[10px] text-pink-500">
             Top Performer
          </div>
          {orgStats[0] ? (
            <>
              <h3 className="text-lg font-bold truncate">{orgStats[0].email}</h3>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1 font-bold">
                <Trophy size={12} /> RANKED #1
              </p>
            </>
          ) : (
            <h3 className="text-xl font-bold text-muted-foreground">N/A</h3>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-1 bg-card border border-border rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-6">Revenue Distribution</h3>
          {chartData.length > 0 ? (
            <OrgPerformanceChart data={chartData} />
          ) : (
            <div className="text-center py-20 text-muted-foreground text-sm italic">Insufficient data for visualization.</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Performance Rankings Matrix</h3>
            <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
              <button onClick={() => setShowArchived(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!showArchived ? 'bg-indigo-500 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>Active</button>
              <button onClick={() => setShowArchived(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${showArchived ? 'bg-red-500 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>Archived</button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-lg">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Rank</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3 text-center">Nodes</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((o: any, idx: number) => {
                  const isActive = o.isActive === true || o.isActive === 1;
                  return (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/20 transition-all">
                      <td className="px-4 py-4 font-bold text-indigo-400">#{idx + 1}</td>
                      <td className="px-4 py-4 font-medium">{o.email}</td>
                      <td className="px-4 py-4 text-center">{o.totalEmployees}</td>
                      <td className="px-4 py-4 text-right font-mono text-cyan-400 font-bold">${Math.floor(o.botRevenue).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => handleToggleStatus(o.id, isActive)}
                          disabled={isProcessing}
                          className={`p-2 rounded-lg ${!isActive ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-red-400 hover:bg-red-400/10'}`}
                        >
                          {!isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
