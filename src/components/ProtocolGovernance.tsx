"use client";

import { useState, useEffect } from "react";
import { getAdminConfig, updateProtocolSettings, createOrganization } from "@/app/actions";
import { Settings, Coins, Building2, Mail, Plus, Activity, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LivePulseChart } from "./Charts";

export default function ProtocolGovernance() {
  const [config, setConfig] = useState<any>(null);
  const [mintAmount, setMintAmount] = useState<string>("");
  const [feePct, setFeePct] = useState<string>("");
  const [isUpdatingProtocol, setIsUpdatingProtocol] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  const fetchData = async () => {
    const adminConf = await getAdminConfig();
    setConfig(adminConf);
    if (!feePct) setFeePct(adminConf.conversionFee.toString());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProtocol(true);
    await updateProtocolSettings(Number(mintAmount) || 0, Number(feePct));
    setMintAmount("");
    await fetchData();
    setIsUpdatingProtocol(false);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsCreatingOrg(true);
    const res = await createOrganization(email, password);
    if (res.error) {
      setError(res.error);
    } else {
      setEmail("");
      setPassword("");
      setError("");
      alert("Organization deployed successfully!");
    }
    setIsCreatingOrg(false);
  };

  if (!config) return <div className="p-8 animate-pulse text-muted-foreground">Loading Protocol Matrix...</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" /> Protocol Liquidity & Governance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage global liquidity reserves and organization deployment.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
            <Activity size={16} className="text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Reserve Depth */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" /> Reserve Liquidity Depth
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Live simulation of liquidity pressure and availability.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase">Current Reserve</span>
              <p className="text-2xl font-black font-mono text-emerald-400">${config.mintedBUSD.toLocaleString()}</p>
            </div>
          </div>
          <LivePulseChart baseValue={config.mintedBUSD} />
        </motion.div>

        {/* Quick Stats Column */}
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border p-6 rounded-2xl">
                <h4 className="text-sm font-medium text-muted-foreground uppercase mb-4">Network Settings</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Dynamic Fee</span>
                        <span className="text-xl font-bold text-indigo-400">{config.conversionFee}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Total Minted</span>
                        <span className="text-sm font-mono">${(config.mintedBUSD || 0).toLocaleString()}</span>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Control Form */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Settings size={20} />
            </div>
            <h3 className="text-lg font-semibold">Liquidity Settings</h3>
          </div>

          <form onSubmit={handleUpdateProtocol} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Coins size={14} /> Additional Mint (BUSD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input 
                  type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)} placeholder="0.00" min="0" step="100"
                  className="w-full bg-background border border-border rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Dynamic Conversion Fee (%)</label>
              <div className="relative">
                <input 
                  type="number" value={feePct} onChange={e => setFeePct(e.target.value)} required step="0.1" min="0" max="100"
                  className="w-full bg-background border border-border rounded-xl pl-4 pr-8 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>

            <button type="submit" disabled={isUpdatingProtocol} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {isUpdatingProtocol ? "Syncing..." : "Apply Protocol Updates"}
            </button>
          </form>
        </motion.div>

        {/* Deploy Org Form */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Building2 size={20} />
            </div>
            <h3 className="text-lg font-semibold">Deploy New Organization</h3>
          </div>

          {error && <div className="text-red-500 text-xs mb-4 bg-red-500/10 p-2 rounded-lg">{error}</div>}
          
          <form onSubmit={handleCreateOrg} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Mail size={14} /> Org Root Email
              </label>
              <input 
                type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="corp@domain.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Org Root Password</label>
              <input 
                type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button type="submit" disabled={isCreatingOrg} className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2">
              <Plus size={18} /> {isCreatingOrg ? "Deploying..." : "Provision Sandbox"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
