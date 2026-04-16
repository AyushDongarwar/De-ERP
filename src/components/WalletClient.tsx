"use client";

import { useStore } from "@/store/useStore";
import { Lock, Unlock, Clock, ShieldCheck, Wallet, ArrowRightLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { updateWalletSplit, getCurrentUserFinancials, getOrgWorkforceFinancials } from "@/app/actions";
import { motion } from "framer-motion";

export default function WalletClient({ splitConfig }: { splitConfig: any }) {
  const { user, coldWalletBalance, hotWalletBalance, updateBalances } = useStore();
  const role = user?.role;
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [isOrgView, setIsOrgView] = useState(false);

  useEffect(() => {
    async function syncData() {
      if (!user?.id) return;
      
      const isOrg = role === 'ORGANIZATION';
      setIsOrgView(isOrg);

      const data = isOrg 
        ? await getOrgWorkforceFinancials(user.id)
        : await getCurrentUserFinancials(user.id);

      if (data) {
        setDbUser(data);
        updateBalances(data.coldWalletBalance, data.lockedFunds);
      }
    }
    syncData();
    const interval = setInterval(syncData, 30000); // Sync data every 30s
    return () => clearInterval(interval);
  }, [user?.id, role, updateBalances]);

  useEffect(() => {
    const lockDate = dbUser?.lastLockDate;
    const lockFunds = dbUser?.lockedFunds || 0;
    const lDays = dbUser?.lockinDays || 15;

    if (!lockDate || lockFunds === 0) {
      setTimeLeft(null);
      return;
    }
    
    const calculateTime = () => {
      const lockStart = new Date(lockDate).getTime();
      const lockinMs = lDays * 24 * 60 * 60 * 1000;
      const expiryDate = lockStart + lockinMs;
      const now = Date.now();
      const distance = expiryDate - now;
      
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return false;
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
        return true;
      }
    };

    calculateTime();
    const timer = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dbUser]); // Back to single dependency to satisfy React's constant size rule

  const toggleLockCycle = async () => {
    await updateWalletSplit(!splitConfig.unlockCycleActive);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isOrgView ? "Workforce Financial Ledger" : "Financial Ledger"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isOrgView ? "Aggregated status of decentralized workforce custody." : "Status of your decentralized Hot/Cold custody."}
          </p>
        </div>
        {(role === 'SUPER_ADMIN' || role === 'ORGANIZATION') && (
          <button 
            onClick={toggleLockCycle}
            className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg border border-indigo-400/20 hover:bg-indigo-600 flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all"
          >
            {splitConfig.unlockCycleActive ? (
              <><Unlock size={16} /> Protocol Unlocked</>
            ) : (
              <><Lock size={16} /> Loop Assets (15 Days)</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cold Wallet (15%) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{isOrgView ? "Workforce principle" : "Cold Wallet"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{isOrgView ? "Total Workforce Liquidity" : "Liquid Assets"}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">
              15.0%
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-mono">${coldWalletBalance.toFixed(2)}</div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/30 rounded-lg p-3 border border-border italic">
            <ShieldCheck size={14} className="text-emerald-400" /> Principles available for immediate claim.
          </div>
        </motion.div>

        {/* Hot Wallet (85%) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden lg:col-span-2 shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px]" />
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3 z-10">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{isOrgView ? "Workforce Staked Assets" : "Hot Wallet (Staked)"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{isOrgView ? "Global Bot Operations" : "Bot Yield Injection Cycle"}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/20 z-10">
              85.0%
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 z-10 relative">
            <div>
              <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-200 font-mono">
                ${hotWalletBalance.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-indigo-400/80 mt-2 font-bold tracking-wider">
                <ArrowRightLeft size={12}/> AUTOMATED REINVESTMENT ACTIVE
              </div>
            </div>
            
            <div className="bg-background/80 backdrop-blur border border-border rounded-xl p-4 min-w-[240px]">
              <div className="flex items-center gap-2 text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">
                <Clock size={16} className="text-indigo-400" /> Lock Expiry
              </div>
              {splitConfig.unlockCycleActive && timeLeft ? (
                <div className="grid grid-cols-4 gap-2 text-center text-xl font-bold font-mono text-foreground">
                  <div className="bg-secondary/50 rounded p-2">{String(timeLeft?.days ?? 0).padStart(2, '0')}<span className="text-[10px] block font-sans text-muted-foreground font-normal uppercase">DAYS</span></div>
                  <div className="bg-secondary/50 rounded p-2">{String(timeLeft?.hours ?? 0).padStart(2, '0')}<span className="text-[10px] block font-sans text-muted-foreground font-normal uppercase">HRS</span></div>
                  <div className="bg-secondary/50 rounded p-2">{String(timeLeft?.minutes ?? 0).padStart(2, '0')}<span className="text-[10px] block font-sans text-muted-foreground font-normal uppercase">MINS</span></div>
                  <div className="bg-secondary/50 rounded p-2 text-indigo-400">{String(timeLeft?.seconds ?? 0).padStart(2, '0')}<span className="text-[10px] block font-sans text-muted-foreground font-normal uppercase">SECS</span></div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs font-bold text-emerald-400 bg-emerald-500/5 rounded-lg border border-emerald-500/10 italic">
                  Cycle Complete / Liquidity Available
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
          <ShieldCheck size={18} className="text-indigo-400" />
          Protocol Consensus
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isOrgView 
            ? "This represents the decentralized ledger of your entire workforce. The 85/15 split is the protocol standard ensuring individual node growth and platform-wide liquidity. Principle (Cold) funds are liquid for employee withdrawals, while Hot (Staked) funds move through automated bot cycles."
            : "Your assets are managed by the De-ERP Decentralized Custody Protocol. The 85/15 split ensures platform stability and growth. 15% (Principle) is diverted to your Cold Wallet for immediate liquidity. The remaining 85% is injected into the Trading Bot Tier for 15-day high-frequency trading cycles, with all returns credited to your Hot Wallet balance upon cycle completion."}
        </p>
      </div>
    </div>
  );
}
