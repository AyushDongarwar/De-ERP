import { useState, useEffect } from "react";
import { getTasksForEmployee, completeTask, claimReleasedFunds, syncLockedFunds, getCurrentUserFinancials, getProtocolLiveStats } from "@/app/actions";
import { useStore } from "@/store/useStore";
import { CheckCircle, Clock, DollarSign, Bot, Activity, Lock, Unlock, TrendingUp, ShieldCheck, Wallet, ArrowUpRight, Zap, Users, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletSelector } from './WalletSelector';
import Link from 'next/link';

export default function EmployeeDashboard({ user }: { user: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [withdrawReleased, setWithdrawReleased] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("Calculation Pending...");
  const [isStatsHovered, setIsStatsHovered] = useState(false);
  const [liveStats, setLiveStats] = useState({ tasksCompleted: 0, totalWithdrawn: 0, topEmployee: "..." });

  const { 
    walletAddress, 
    connectWallet, 
    accumulatedPayroll, 
    addPayroll, 
    coldWalletBalance, 
    hotWalletBalance, 
    botROI, 
    updateBalances, 
    updateUser,
    setROI 
  } = useStore();

  // Sync with Database Financials
  useEffect(() => {
    const syncDB = async () => {
      const data = await getCurrentUserFinancials(user.id);
      if (data) {
        updateBalances(data.coldWalletBalance, data.lockedFunds);
      }
    };
    syncDB();
  }, [user.id, updateBalances]);
  
  const botCut = user.botPercentage;
  const rawRate = user.payType === 'HOURLY' ? user.hourlyRate : user.dailyRate / 8;
  const netRate = rawRate * (1 - (botCut / 100));

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getProtocolLiveStats();
      setLiveStats(stats);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refesh stats every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await getTasksForEmployee(user.id);
      setTasks(data);
    };
    fetchTasks();
  }, [user.id]);

  useEffect(() => {
    // UI Local Stream for responsiveness
    const interval = setInterval(() => {
      const perSecondEarn = netRate / 3600;
      addPayroll(perSecondEarn);
      
      const fluctuation = (Math.random() - 0.5) * 0.0001;
      setROI(Math.max(0.1, botROI + fluctuation));

      if (user.lockedFunds > 0 && user.lastLockDate) {
        const lockStart = new Date(user.lastLockDate).getTime();
        const lockinMs = (user.lockinDays || 15) * 24 * 60 * 60 * 1000;
        const expiryDate = lockStart + lockinMs;
        const now = Date.now();
        const diff = expiryDate - now;

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const mins = Math.floor((diff / 1000 / 60) % 60);
          setTimeLeft(`${days}d ${hours}h ${mins}m`);
        } else {
          setTimeLeft("Unlocking soon...");
        }
      } else {
        setTimeLeft(user.lockedFunds > 0 ? "Pending Cycle End" : "No Active Cycle");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [netRate, addPayroll, botROI, setROI, user]);

  const handleWithdraw = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }
    
    setIsWithdrawing(true);
    try {
      // Terminal now handles ONLY internal simulated stream
      const wageAmount = accumulatedPayroll;
      
      // Claim released bot money from ledger if any
      const released = withdrawReleased ? (user.releasedFunds || 0) : 0;
      if (released > 0) {
        await claimReleasedFunds(user.id);
        updateUser({ releasedFunds: 0 });
      }
      
      // Sync internal ledger (15/85 split)
      if (wageAmount > 0) {
        await syncLockedFunds(user.id, wageAmount);
        updateUser({ 
          lockedFunds: (user.lockedFunds || 0) + (wageAmount * 0.85),
          coldWalletBalance: (user.coldWalletBalance || 0) + (wageAmount * 0.15)
        });
      }

      const cold = (wageAmount * 0.15) + released;
      const hot = (wageAmount * 0.85);

      updateBalances(coldWalletBalance + cold, hotWalletBalance + hot);
      
      // Reset local accumulated
      useStore.setState({ accumulatedPayroll: 0 });
      alert(released > 0 
        ? `Protocol Settlement Successful! $${released.toFixed(2)} released funds plus on-chain wages have been moved to your Cold Wallet (Exchange Portal) for withdrawal.`
        : "Wages settled and split 85/15 (Hot/Cold) into your internal protocol wallets. You can now withdraw them via the Exchange Portal."
      );
    } catch (e: any) {
      alert("Withdrawal failed: " + (e.reason || e.message));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleConnect = () => setIsSelectorOpen(true);

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
    const data = await getTasksForEmployee(user.id);
    setTasks(data);
  };

  const simulateMonthEnd = () => {
    const total = accumulatedPayroll;
    const cold = total * 0.15;
    const hot = total * 0.85;
    updateBalances(coldWalletBalance + cold, hotWalletBalance + hot);
    useStore.setState({ accumulatedPayroll: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Node Terminal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {walletAddress ? `Connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Blockchain stream active. Connect wallet to withdraw."}
          </p>
          {user.releasedFunds > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                ${user.releasedFunds.toFixed(2)} Released by Organization
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {!walletAddress ? (
            <button 
              onClick={handleConnect}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Wallet size={14} /> Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-xl border border-border">
              {user.releasedFunds > 0 && (
                <label className="flex items-center gap-2 cursor-pointer group px-2">
                  <input 
                    type="checkbox" 
                    checked={withdrawReleased} 
                    onChange={e => setWithdrawReleased(e.target.checked)}
                    className="rounded border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 bg-background"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Include Released</span>
                </label>
              )}
              <button 
                onClick={handleWithdraw}
                disabled={isWithdrawing || (
                  (accumulatedPayroll <= 0) && 
                  (!withdrawReleased || !user.releasedFunds || user.releasedFunds <= 0)
                )}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                <DollarSign size={14} /> 
                {isWithdrawing ? "Withdrawing..." : `Withdraw $${(
                  accumulatedPayroll + (withdrawReleased ? (user.releasedFunds || 0) : 0)
                ).toFixed(2)}`}
              </button>
            </div>
          )}

          <div 
            className="relative"
            onMouseEnter={() => setIsStatsHovered(true)}
            onMouseLeave={() => setIsStatsHovered(false)}
          >
            <button className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Zap size={14} className="animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]" /> Protocol Status: Active
            </button>

            <AnimatePresence>
              {isStatsHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-background/80 backdrop-blur-xl border border-indigo-500/30 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Real-Time Network Metrics</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                          <CheckCircle size={16} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Tasks Finalized</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{liveStats.tasksCompleted}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                          <DollarSign size={16} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Liquidity Flow</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">${liveStats.totalWithdrawn.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                          <Trophy size={16} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Top Node</span>
                      </div>
                      <span className="text-[10px] font-bold text-foreground truncate max-w-[100px]">{liveStats.topEmployee.split('@')[0]}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Consensus verified across 3 network tiers.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stream */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign size={80} className="text-indigo-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6 text-indigo-400">
              <TrendingUp size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground">Accrued Wages (Internal Stream)</span>
            </div>
            <div className="text-5xl font-black tabular-nums bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              ${accumulatedPayroll.toFixed(5)}
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              Protocol streaming BUSD at ${netRate.toFixed(2)}/hr net.
            </div>
          </div>
        </motion.div>

        {/* Dual Wallet Visuals */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cold Wallet */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border p-6 rounded-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Unlock size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">LIQUID / COLD</span>
            </div>
            <h3 className="text-muted-foreground text-xs font-medium mb-1">Cold Wallet Balance</h3>
            <div className="text-2xl font-bold font-mono">${coldWalletBalance.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-4">15% of principle available for instant withdrawal.</p>
            <Link href="/exchange" className="mt-4 flex items-center justify-center gap-2 w-full text-xs font-bold text-emerald-400 bg-emerald-500/10 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors">
              Transfer to Exchange <ArrowUpRight size={14} />
            </Link>
          </motion.div>


          {/* Hot Wallet */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-2xl relative border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Lock size={20} />
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/5 px-2 py-0.5 rounded-full border border-indigo-400/10 italic">BOT-LOCKED / HOT</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-muted-foreground text-xs font-medium mb-1">C++ Algo Bot Investment</h3>
                <div className="text-2xl font-bold font-mono">${hotWalletBalance.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-indigo-400 font-bold mb-1">Live ROI</div>
                <div className="text-lg font-black text-indigo-400">+{botROI.toFixed(4)}%</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock size={12} /> Cycle Ends: <span className="text-foreground font-bold">{timeLeft}</span>
              </div>
              <ShieldCheck size={14} className="text-indigo-400/40" />
            </div>

          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <Clock size={18} className="text-muted-foreground" /> Work Task Queue
          </h3>
          <div className="space-y-4">
            {tasks.map(t => (
              <div key={t.id} className={`flex items-start justify-between p-4 rounded-xl border ${t.status === 'COMPLETED' ? 'bg-secondary/20 border-border' : 'bg-background border-border/50 shadow-sm transition-all hover:border-indigo-500/30'}`}>
                <div>
                  <h4 className={`font-semibold ${t.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                </div>
                {t.status === 'PENDING' ? (
                  <button 
                    onClick={() => handleCompleteTask(t.id)}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20 flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Resolve Node
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-green-500/10">Resolved</span>
                )}
              </div>
            ))}
            {tasks.length === 0 && <div className="text-center py-8 text-muted-foreground">No tasks assigned to your node.</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border p-6 rounded-2xl h-fit">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <Bot size={18} className="text-muted-foreground" /> Protocol Settings
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hot Wallet Split</label>
                <span className="text-indigo-400 font-bold">{user.botPercentage}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${user.botPercentage}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Diverted to Algo-Bot for 15-day yield cycles.</p>
            </div>
            
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
              <h4 className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1">
                <ShieldCheck size={12} /> Decentralized Custody
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your principle is locked in a secure smart contract. Hot wallet funds are invested via the C++ Core Bot, yielding automated returns.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <WalletSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        onSelect={connectWallet} 
      />
    </div>
  );
}
