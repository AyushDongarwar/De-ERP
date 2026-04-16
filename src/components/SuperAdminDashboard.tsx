import { useState, useEffect } from "react";
import { getOrganizations, createOrganization, getSuperAdminAnalytics, getAdminConfig, updateProtocolSettings, updateUserStatus, getProtocolTransactions } from "@/app/actions";
import { Plus, Building2, Mail, DollarSign, TrendingUp, Users, Activity, Trophy, Settings, Coins, Eye, EyeOff, LayoutDashboard, ArrowRightLeft, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OrgPerformanceChart } from "./Charts";

export default function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, exchange
  const [protocolHistory, setProtocolHistory] = useState<any[]>([]);

  const handleToggleStatus = async (orgId: string, currentStatus: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      // Toggle to the opposite of currentStatus
      await updateUserStatus(orgId, !currentStatus);
      await fetchAll();
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [mintAmount, setMintAmount] = useState<string>("");
  const [feePct, setFeePct] = useState<string>("");
  const [isUpdatingProtocol, setIsUpdatingProtocol] = useState(false);

  const fetchAll = async () => {
    const [fetchedOrgs, data, adminConf, history] = await Promise.all([
      getOrganizations(),
      getSuperAdminAnalytics(),
      getAdminConfig(),
      getProtocolTransactions()
    ]);
    setOrgs(fetchedOrgs);
    setAnalytics(data);
    setConfig(adminConf);
    setProtocolHistory(history);
    if (!feePct) setFeePct(adminConf.conversionFee.toString());
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const res = await createOrganization(email, password);
    if (res.error) {
      setError(res.error);
    } else {
      setEmail("");
      setPassword("");
      setError("");
      fetchAll();
    }
  };

  const handleUpdateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProtocol(true);
    await updateProtocolSettings(Number(mintAmount) || 0, Number(feePct));
    setMintAmount("");
    await fetchAll();
    setIsUpdatingProtocol(false);
  };

  if (!analytics) return <div className="p-8 text-muted-foreground animate-pulse">Loading Platform Matrix...</div>;

  const { globalMode, orgStats } = analytics;
  
  // Filter for display based on archived toggle
  const filteredOrgs = orgStats?.filter((o: any) => {
    const isActive = o.isActive === true || o.isActive === 1;
    return isActive === !showArchived;
  }) || [];

  // Chart Data: Top 10 unfiltered for global view, or filtered? Let's use filtered for clarity
  const chartData = filteredOrgs.slice(0, 10).map((o: any) => ({
    name: o.email.split('@')[0],
    botRevenue: Math.floor(o.botRevenue)
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Analytics & Control</h1>
          <p className="text-muted-foreground text-sm mt-1">Cross-platform metrics, organization rankings, and deployment.</p>
        </div>

        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "overview" ? "bg-indigo-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab("exchange")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "exchange" ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ArrowRightLeft size={16} /> Exchange & Transfers
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* TOP TIER: Macros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Value */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <DollarSign size={18} />
                  </div>
                  <span className="text-sm font-medium">Platform Total Value</span>
                </div>
                <h3 className="text-2xl font-bold">${globalMode.totalPlatformFunds.toLocaleString()}</h3>
              </motion.div>

              {/* Global Bot Revenue */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp size={64} className="text-cyan-400" />
                </div>
                <div className="flex items-center gap-3 text-muted-foreground mb-3 relative z-10">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <TrendingUp size={18} />
                  </div>
                  <span className="text-sm font-medium">Network Bot Profit</span>
                </div>
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 relative z-10">
                  ${Math.floor(globalMode.totalNetworkBotProfit).toLocaleString()}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 relative z-10">Simulated monthly projection</p>
              </motion.div>

              {/* Global Workforce */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                    <Users size={18} />
                  </div>
                  <span className="text-sm font-medium">Cross-Org Workforce</span>
                </div>
                <h3 className="text-2xl font-bold">{globalMode.totalActiveWorkforce}</h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">Across {globalMode.totalOrganizations} Orgs</p>
              </motion.div>

              {/* System Health / Top Perf */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                    <Activity size={18} />
                  </div>
                  <span className="text-sm font-medium">Top Performer</span>
                </div>
                {orgStats[0] ? (
                  <>
                    <h3 className="text-xl font-bold truncate pr-4">{orgStats[0].email}</h3>
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <Trophy size={12} /> Ranked #1
                    </p>
                  </>
                ) : (
                  <h3 className="text-xl font-bold text-muted-foreground mt-2">N/A</h3>
                )}
              </motion.div>
            </div>

            {/* MIDDLE TIER: Charts & Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 overflow-hidden">
                <h3 className="text-lg font-semibold mb-6">Bot Revenue by Org</h3>
                {chartData.length > 0 ? (
                  <OrgPerformanceChart key={showArchived ? "archived" : "active"} data={chartData} />
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm">Not enough data.</div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Performance Rankings Matrix</h3>
                  <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                    <button 
                      onClick={() => setShowArchived(false)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${!showArchived ? 'bg-indigo-500 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Active
                    </button>
                    <button 
                      onClick={() => setShowArchived(true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${showArchived ? 'bg-red-500 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Archived
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-lg">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Rank</th>
                        <th className="px-4 py-3">Organization</th>
                        <th className="px-4 py-3 text-center">Nodes</th>
                        <th className="px-4 py-3 text-center">Tasks Done</th>
                        <th className="px-4 py-3 text-right">Bot Revenue</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrgs.map((o: any, idx: number) => {
                        const isActive = o.isActive === true || o.isActive === 1;
                        return (
                          <tr key={o.id} className={`border-b border-border/50 hover:bg-secondary/20 transition-all ${!isActive ? 'opacity-60 italic' : ''}`}>
                            <td className="px-4 py-3 font-bold text-indigo-400">#{idx + 1}</td>
                            <td className="px-4 py-3 font-medium">{o.email}</td>
                            <td className="px-4 py-3 text-center">{o.totalEmployees}</td>
                            <td className="px-4 py-3 text-center">{o.completedTasks} / {o.totalTasks}</td>
                            <td className="px-4 py-3 text-right font-mono text-cyan-400 font-semibold">${Math.floor(o.botRevenue).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => handleToggleStatus(o.id, isActive)}
                                disabled={isProcessing}
                                className={`p-2 rounded-lg transition-all ${!isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                title={!isActive ? "Restore Organization" : "Archive (Hide) Organization"}
                              >
                                {!isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrgs.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-20 text-muted-foreground italic">No {showArchived ? 'archived' : 'active'} segments found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* PROTOCOL CONTROLS */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-card border border-border p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Settings size={24} className="text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-semibold">Protocol Liquidity & Fees</h3>
                    <p className="text-xs text-muted-foreground">Mint BUSD to the reserve and set the dynamic withdrawal fee for organizations.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Available Reserve</p>
                  <p className="text-2xl font-bold font-mono text-emerald-400">${(config?.mintedBUSD || 0).toLocaleString()}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProtocol} className="flex flex-col md:flex-row items-end gap-4 bg-background p-4 rounded-xl border border-border">
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Coins size={14} /> Mint New Liquidity (BUSD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input 
                      type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)} placeholder="0.00" min="0" step="100"
                      className="w-full bg-secondary/50 border border-border rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Dynamic Conversion Fee (%)</label>
                  <div className="relative">
                    <input 
                      type="number" value={feePct} onChange={e => setFeePct(e.target.value)} required step="0.1" min="0" max="100"
                      className="w-full bg-secondary/50 border border-border rounded-lg pl-4 pr-8 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
                <button type="submit" disabled={isUpdatingProtocol} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-2 rounded-lg text-sm font-medium transition-colors">
                  {isUpdatingProtocol ? "Updating..." : "Update Protocol"}
                </button>
              </form>
            </motion.div>

            {/* BOTTOM TIER: Creation Footer */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card border border-border p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Building2 size={24} className="text-indigo-400" />
                <div>
                  <h3 className="text-lg font-semibold">Deploy New Organization</h3>
                  <p className="text-xs text-muted-foreground">Provision a new corporate sandbox on the De-ERP platform.</p>
                </div>
              </div>

              {error && <div className="text-red-500 text-xs mb-4">{error}</div>}
              <form onSubmit={handleCreate} className="flex flex-col md:flex-row items-end gap-4">
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Org Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="corp@domain.com"
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Org Root Password</label>
                  <input 
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Secure Password"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button type="submit" className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]">
                  <Plus size={16} /> Deploy Segment
                </button>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="exchange"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-emerald-500/20 to-card border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Coins size={80} className="text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Platform Commission</span>
                  </div>
                  <div className="text-5xl font-black font-mono tracking-tighter text-foreground">
                    ${(config?.monthlyRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Total revenue generated from organization protocol withdrawals.
                  </p>
                </motion.div>

                <div className="bg-card border border-border p-6 rounded-2xl">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" /> Fee Generation Leaders
                  </h3>
                  <div className="space-y-4">
                    {[...orgStats].sort((a,b) => (b.currencyFeeRev || 0) - (a.currencyFeeRev || 0)).slice(0, 5).map((org, i) => (
                      <div key={org.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-secondary text-muted-foreground'}`}>
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[120px]">{org.email}</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-emerald-400">${(org.currencyFeeRev || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col h-full min-h-[500px]">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <History size={18} className="text-indigo-400" /> Recent Protocol Activity
                  </h3>
                  <div className="flex-1 overflow-auto">
                    {protocolHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                        <ArrowRightLeft size={48} className="opacity-10 mb-4" />
                        <p className="italic">No protocol withdrawals recorded yet.</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-lg">
                          <tr>
                            <th className="px-4 py-3 rounded-l-lg text-emerald-400">Organization</th>
                            <th className="px-4 py-3">Gross Amount</th>
                            <th className="px-4 py-3 text-emerald-400">Platform Fee</th>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {protocolHistory.map((tx: any) => {
                            const meta = JSON.parse(tx.metadata || "{}");
                            return (
                              <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                <td className="px-4 py-4 font-medium">{tx.user?.email || "Unknown"}</td>
                                <td className="px-4 py-4 font-mono">${tx.amount.toLocaleString()}</td>
                                <td className="px-4 py-4 font-mono font-bold text-emerald-400">
                                  +${(meta.feePaid || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground text-xs">
                                  {new Date(tx.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-lg uppercase">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
