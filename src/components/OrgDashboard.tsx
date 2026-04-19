import { useState, useEffect } from "react";
import { getEmployeesByOrg, createEmployee, getTasksForOrg, createTask, getWarehouses, createWarehouse, addMachinery, unlockEmployeeFunds, getAdminConfig, withdrawFromProtocol, updateEmployeeLockin, updateEmployeeStatus } from "@/app/actions";
import { bridge } from "@/lib/contracts";
import { useStore } from "@/store/useStore";
import { Plus, Users, LayoutList, Bot, Box, Activity, Warehouse as WarehouseIcon, Truck, BarChart2, Wallet, Coins, ArrowUpRight, DollarSign, EyeOff, Eye, UserMinus, ListTodo, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OrganizationSetup from "./OrganizationSetup";
import { WalletSelector } from './WalletSelector';

export default function OrgDashboard({ user }: { user: any }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("workforce"); // workforce, warehouses, logistics, treasury, tasks
  const [isSetupNeeded, setIsSetupNeeded] = useState(user.vizTools === "[]");

  // Logistics Form State
  const [recipientOrg, setRecipientOrg] = useState("");
  const [logisticsAmount, setLogisticsAmount] = useState("");
  const [logisticsDesc, setLogisticsDesc] = useState("");

  // New Employee Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [payType, setPayType] = useState("HOURLY");
  const [hourly, setHourly] = useState(25);
  const [daily, setDaily] = useState(200);
  const [botPct, setBotPct] = useState(15);
  const [registerOnChain, setRegisterOnChain] = useState(false);
  const [employeeWallet, setEmployeeWallet] = useState("");
  const [err, setErr] = useState("");

  // Treasury State
  const [treasuryBalance, setTreasuryBalance] = useState("0.00");
  const [depositAmount, setDepositAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { walletAddress, connectWallet } = useStore();

  // New Warehouse/Machinery State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  
  // Task Management State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [protocolConfig, setProtocolConfig] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [e, t, w, conf] = await Promise.all([
        getEmployeesByOrg(user.id),
        getTasksForOrg(user.id),
        getWarehouses(user.id),
        getAdminConfig()
      ]);
      setEmployees(e);
      setTasks(t);
      setWarehouses(w);
      setProtocolConfig(conf);
      if (w.length > 0) setIsSetupNeeded(false);
    } catch (e) {
      console.error("Local Data Error:", e);
    }

    // Fetch Treasury Balance (Non-blocking)
    try {
      const bal = await bridge.getStablecoinBalance("0x1C5Cbd35d579c55af192d3Cc4830280dC9B1E9cb");
      setTreasuryBalance(bal);
    } catch (e) {
      console.error("Blockchain Read Error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleConnect = () => setIsSelectorOpen(true);

  const handleDeposit = async () => {
    if (!walletAddress) {
      alert("Connect wallet first.");
      return;
    }
    setIsProcessing(true);
    try {
      const amt = Number(depositAmount);
      if (amt <= 0) throw new Error("Amount must be > 0");

      if (!protocolConfig) throw new Error("System is initializing, please wait.");

      // Step 1: Buy from Protocol Reserve & Pay Dynamic Fee
      console.log("Acquiring BUSD from Protocol Reserve...");
      const res = await withdrawFromProtocol(user.id, amt);

      if (!res.success) throw new Error("Protocol deduction failed.");
      
      const netAmount = res.netAmount;
      alert(`Paid ${protocolConfig.conversionFee}% platform fee ($${res.feePaid.toFixed(2)}). You are depositing $${netAmount.toFixed(2)} to your Smart Contract treasury.`);

      // Step 2: Approve
      console.log("Approving BUSD...");
      await bridge.approveBUSD(netAmount);
      
      // Step 3: Deposit
      console.log("Depositing BUSD...");
      await bridge.depositTreasury(netAmount);
      
      setDepositAmount("");
      fetchData();
      alert("Treasury funded successfully via Protocol Reserve!");
    } catch (e: any) {
      if (e.message.includes("RPC Busy")) {
        alert("Network Traffic: The Sepolia RPC is currently busy. Please wait 15 seconds and try again.");
      } else {
        alert("Deposit failed: " + (e.reason || e.message));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (registerOnChain && !employeeWallet) {
      setErr("On-chain registration requires an employee wallet address.");
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create in local DB
      const res = await createEmployee(user.id, email, password, payType, hourly, daily, botPct);
      if (res.error) {
        setErr(res.error);
        return;
      }

      // Step 2: Register On-Chain if requested
      if (registerOnChain) {
        const monthlyEst = payType === 'HOURLY' ? hourly * 160 : daily * 20;
        await bridge.addEmployee(employeeWallet, monthlyEst);
      }

      setEmail(""); setPassword(""); setErr(""); setEmployeeWallet(""); setRegisterOnChain(false);
      fetchData();
      alert("Employee onboarded " + (registerOnChain ? "on-chain and " : "") + "successfully!");
    } catch (e: any) {
      setErr("Failed to complete onboarding: " + (e.reason || e.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async (employeeId: string) => {
    setIsProcessing(true);
    try {
      await unlockEmployeeFunds(employeeId);
      await fetchData();
    } catch (e: any) {
      alert("Failed to unlock: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLockin = async (employeeId: string, daysStr: string) => {
    const days = parseInt(daysStr, 10);
    if (!days || days < 1) return;
    try {
      await updateEmployeeLockin(employeeId, days);
      await fetchData();
    } catch (e: any) {
      alert("Failed to update lock-in: " + e.message);
    }
  };

  const handleToggleStatus = async (employeeId: string, currentStatus: boolean) => {
    setIsProcessing(true);
    try {
      await updateEmployeeStatus(employeeId, !currentStatus);
      await fetchData();
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName) return;
    setIsProcessing(true);
    try {
      await createWarehouse(user.id, warehouseName, warehouseLocation);
      setWarehouseName(""); setWarehouseLocation("");
      fetchData();
      alert("Logistic Sector Initialized!");
    } catch (err: any) {
      alert("Failed to initialize sector: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMachinery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId || !machineName) {
      alert("Select a sector and name the machine.");
      return;
    }
    setIsProcessing(true);
    try {
      await addMachinery(selectedWarehouseId, machineName, machineType);
      setMachineName(""); setMachineType("");
      fetchData();
      alert("Machinery Deployed!");
    } catch (err: any) {
      alert("Deployment failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogisticsPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) { alert("Connect wallet first."); return; }
    if (!recipientOrg || !logisticsAmount) return;

    setIsProcessing(true);
    try {
      const amt = Number(logisticsAmount);
      // Execute on-chain transfer via direct Stablecoin transfer
      console.log("Processing B2B Settlement...");
      await bridge.transferBUSD(recipientOrg, amt);

      // Clear form and notify
      setRecipientOrg(""); setLogisticsAmount(""); setLogisticsDesc("");
      fetchData();
      alert("Logistics settlement complete. BUSD transferred to recipient organization.");
    } catch (err: any) {
      alert("Logistics payment failed: " + (err.reason || err.message));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !taskTitle) return;
    setIsProcessing(true);
    try {
      await createTask(user.id, selectedEmployeeId, taskTitle, taskDesc);
      setTaskTitle(""); setTaskDesc(""); setSelectedEmployeeId("");
      fetchData();
      alert("Directive Dispatched successfully!");
    } catch (err: any) {
      alert("Failed to issue directive: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSetupNeeded) {
    return <OrganizationSetup user={user} onComplete={() => { setIsSetupNeeded(false); fetchData(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Operations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeTab === "treasury" ? "Manage your protocol payroll treasury." : "Control your decentralized workforce and logistics."}
          </p>
        </div>
        
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border overflow-x-auto max-w-full">
          {[
            { id: "workforce", label: "Workforce", icon: Users },
            { id: "tasks", label: "Tasks", icon: ListTodo },
            { id: "warehouses", label: "Warehouses", icon: WarehouseIcon },
            { id: "logistics", label: "Logistics", icon: Truck },
            { id: "treasury", label: "Treasury", icon: Coins },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-indigo-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "workforce" && (
          <motion.div 
            key="workforce"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="space-y-6 text-foreground">
              <div className="bg-card border border-border p-6 rounded-2xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-400" /> Onboard Employee
                </h3>
                {err && <div className="text-red-500 text-xs mb-4">{err}</div>}
                <form onSubmit={handleCreateEmployee} className="space-y-3">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Employee Email" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <select value={payType} onChange={e => setPayType(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-2 text-sm focus:outline-none">
                      <option value="HOURLY">Hourly Rate</option>
                      <option value="DAILY">Daily Rate</option>
                    </select>
                    <div className="flex bg-background border border-border rounded-lg overflow-hidden pr-2">
                      <span className="text-muted-foreground px-2 py-2 text-sm border-r border-border bg-secondary/50">$</span>
                      <input type="number" value={payType === 'HOURLY' ? hourly : daily} onChange={e => payType === 'HOURLY' ? setHourly(Number(e.target.value)) : setDaily(Number(e.target.value))} className="w-full bg-transparent px-2 text-sm focus:outline-none" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Bot size={12}/> Bot Allotment %</label>
                    <input type="range" min="0" max="50" value={botPct} onChange={e => setBotPct(Number(e.target.value))} className="w-full accent-indigo-500 mt-2" />
                    <div className="text-right text-xs font-bold text-indigo-400">{botPct}% Deducted</div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={registerOnChain} 
                        onChange={e => setRegisterOnChain(e.target.checked)}
                        className="rounded border-border bg-background focus:ring-indigo-500"
                      />
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Register On-chain Protocol</span>
                    </label>
                    {registerOnChain && (
                      <input 
                        type="text" 
                        value={employeeWallet} 
                        onChange={e => setEmployeeWallet(e.target.value)}
                        placeholder="Employee Wallet Address (0x...)" 
                        className="w-full mt-2 bg-background border border-border rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isProcessing ? "Processing..." : "Deploy Work Node"}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl flex-1 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    {showArchived ? <UserMinus size={18} className="text-red-400" /> : <Users size={18} className="text-muted-foreground" />}
                    {showArchived ? "Archived (Not Working)" : "Active Work Nodes"}
                  </h3>
                  <button 
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showArchived ? <Eye size={12} /> : <EyeOff size={12} />}
                    {showArchived ? "Show Active" : "Show Archived"}
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-lg">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Rate</th>
                        <th className="px-4 py-3 font-semibold">Bot %</th>
                        <th className="px-4 py-3 font-semibold text-indigo-400">Locked Balance</th>
                        <th className="px-4 py-3 font-semibold">Lock-In (Days)</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.filter(e => (e.isActive === false) === showArchived).map((e) => (
                        <tr key={e.id} className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${!e.isActive ? 'opacity-60 italic' : ''}`}>
                          <td className="px-4 py-4 font-medium">{e.email}</td>
                          <td className="px-4 py-4 text-muted-foreground font-mono">
                            ${e.payType === 'HOURLY' ? e.hourlyRate : e.dailyRate}/{e.payType === 'HOURLY' ? 'hr' : 'dy'}
                          </td>
                          <td className="px-4 py-4 text-indigo-400 font-bold">{e.botPercentage}%</td>
                          <td className="px-4 py-4 font-mono text-emerald-400/80 font-bold">
                            ${(e.lockedFunds || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-4">
                            <input 
                              type="number" 
                              defaultValue={e.lockinDays} 
                              onBlur={(evt) => handleUpdateLockin(e.id, evt.target.value)}
                              className="w-16 bg-background border border-border rounded px-2 py-1 text-xs text-center focus:border-indigo-500"
                              min="1"
                              disabled={!e.isActive}
                            />
                          </td>
                          <td className="px-4 py-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUnlock(e.id)}
                              disabled={isProcessing || !e.lockedFunds || e.lockedFunds <= 0 || !e.isActive}
                              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Unlock
                            </button>
                            <button
                              onClick={() => handleToggleStatus(e.id, e.isActive !== false)}
                              disabled={isProcessing}
                              className={`p-2 rounded-lg transition-all ${
                                e.isActive === false 
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                              }`}
                              title={e.isActive === false ? "Restore Employee" : "Archive (Hide) Employee"}
                            >
                              {e.isActive === false ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {employees.filter(e => (e.isActive === false) === showArchived).length === 0 && (
                        <tr><td colSpan={6} className="text-center py-20 text-muted-foreground italic">No {showArchived ? 'archived' : 'active'} work nodes found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <motion.div 
            key="tasks"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="space-y-6">
              <div className="bg-card border border-border p-6 rounded-3xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Send size={18} className="text-indigo-400" /> Directive Dispatch
                </h3>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Recipient Node</label>
                    <select 
                      value={selectedEmployeeId} 
                      onChange={e => setSelectedEmployeeId(e.target.value)} 
                      required 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Employee...</option>
                      {employees.filter(e => e.isActive !== false).map(e => (
                        <option key={e.id} value={e.id}>{e.email} ({e.payType})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Directive Title</label>
                    <input 
                      type="text" 
                      value={taskTitle} 
                      onChange={e => setTaskTitle(e.target.value)}
                      placeholder="e.g. Optimize Pipeline Alpha" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Description / Parameters</label>
                    <textarea 
                      value={taskDesc} 
                      onChange={e => setTaskDesc(e.target.value)}
                      placeholder="Detailed instructions for the worker..." 
                      rows={4}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isProcessing || !selectedEmployeeId}
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? "Transmitting..." : "Dispatch Directive"}
                  </button>
                </form>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl">
                <h4 className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1">
                  <Activity size={12} /> Command Protocol
                </h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  "Directives are immutable once dispatched. Nodes are incentivized to resolve tasks to maintain their protocol reputation and ensure future lock-in eligibility."
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <LayoutList size={18} className="text-muted-foreground" /> Organizational Task Queue
                </h3>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                    {tasks.filter(t => t.status === 'PENDING').length} PENDING
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    {tasks.filter(t => t.status === 'COMPLETED').length} RESOLVED
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                {tasks.map(t => (
                  <div key={t.id} className="group relative bg-background/50 border border-border p-4 rounded-2xl hover:border-indigo-500/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">{t.title}</h4>
                          {t.status === 'COMPLETED' ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Resolved</span>
                          ) : (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Transmitted</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-indigo-400">{t.employee?.email.split('@')[0]}</div>
                        <div className="text-[9px] text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {t.status === 'COMPLETED' && (
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <CheckCircle2 size={12} /> Milestone Verified
                         </div>
                      </div>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
                    <p className="text-sm text-muted-foreground italic">No directives found in the organizational queue.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Treasury Tab */}
        {activeTab === "treasury" && (
          <motion.div 
            key="treasury"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500/10 to-card border border-border p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Coins size={120} className="text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <Activity size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Protocol Treasury Balance</span>
                </div>
                <div className="text-6xl font-black font-mono tracking-tighter text-foreground">
                  ${Number(treasuryBalance).toLocaleString()} <span className="text-2xl text-muted-foreground">BUSD</span>
                </div>
                <p className="text-sm text-muted-foreground mt-4 max-w-md">
                  This pool powers the real-time streaming payments for all employees registered on the protocol. Ensure it is funded to avoid stream interruptions.
                </p>
              </div>
              
              {(() => {
                const cleanBalance = String(treasuryBalance).replace(/,/g, '');
                const dailyBurn = employees.reduce((acc, emp) => {
                  // SQLite returns 0/1 for booleans. Old records might be null (default to active).
                  const isActive = emp.isActive === undefined || emp.isActive === 1 || emp.isActive === true;
                  if (!isActive) return acc;
                  
                  const rate = Number(emp.payType === 'HOURLY' ? emp.hourlyRate : (emp.dailyRate / 8));
                  return acc + (rate * 24);
                }, 0);
                
                const runway = dailyBurn > 0 ? (Number(cleanBalance) / dailyBurn) : -1;

                return (
                  <div className="mt-8 flex gap-4">
                    <div className="flex-1 bg-background/50 border border-border p-4 rounded-2xl flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Daily Burn</div>
                      <div className="font-bold text-red-400 flex items-center gap-1">~${dailyBurn.toFixed(2)} <ArrowUpRight size={12}/></div>
                    </div>
                    <div className="flex-1 bg-background/50 border border-border p-4 rounded-2xl flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Est. Runway</div>
                      <div className="font-bold text-emerald-400">
                        {runway === -1 ? '∞ No Burn' : (runway > 365 ? '>1 Year' : `${Math.floor(runway)} Days`)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-card border border-border p-6 rounded-3xl">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2"><Plus size={18} className="text-indigo-400" /> Fund Treasury</span>
                {protocolConfig && (
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md font-mono">
                    Protocol Reserve: ${protocolConfig.mintedBUSD.toLocaleString()}
                  </span>
                )}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 flex justify-between">
                    Amount to Buy (BUSD)
                    {protocolConfig && <span className="text-emerald-400">Fee: {protocolConfig.conversionFee}%</span>}
                  </label>
                  <input 
                    type="number" 
                    value={depositAmount} 
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="1000.00" 
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 placeholder:text-muted-foreground/30 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                  {depositAmount && protocolConfig && (
                    <div className="text-[10px] text-muted-foreground mt-2 flex justify-between px-1">
                      <span>Platform Fee: ${(Number(depositAmount) * (protocolConfig.conversionFee / 100)).toFixed(2)}</span>
                      <span>Net Deposit: ${(Number(depositAmount) * (1 - protocolConfig.conversionFee / 100)).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {!walletAddress ? (
                  <button 
                    onClick={handleConnect}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet size={16} /> Connect Org Wallet
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={handleDeposit}
                      disabled={isProcessing || !depositAmount || (protocolConfig && protocolConfig.mintedBUSD < Number(depositAmount))}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? "Processing..." : `Convert Fiat & Deposit BUSD`}
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Connected: {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                  <h4 className="text-xs font-bold mb-1 flex items-center gap-1">
                    <Activity size={12} className="text-indigo-400" /> Fiat On-Ramp
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    This action will draw from the Super Admin Protocol Reserve, deduct the dynamic platform fee, and execute a BUSD deposit into your smart contract.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {activeTab === "warehouses" && (
          <motion.div 
            key="warehouses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <WarehouseIcon size={18} className="text-emerald-400" /> Initialize New Sector
                </h3>
                <form onSubmit={handleCreateWarehouse} className="space-y-3">
                  <input type="text" value={warehouseName} onChange={e => setWarehouseName(e.target.value)} required placeholder="Sector Name (e.g. Warehouse A)" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  <input type="text" value={warehouseLocation} onChange={e => setWarehouseLocation(e.target.value)} placeholder="Location (e.g. Berlin, DE)" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  <button type="submit" disabled={isProcessing} className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    {isProcessing ? "Processing..." : "Create Warehouse"}
                  </button>
                </form>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Plus size={18} className="text-cyan-400" /> Register Machinery
                </h3>
                <form onSubmit={handleAddMachinery} className="space-y-3">
                  <select 
                    value={selectedWarehouseId} 
                    onChange={e => setSelectedWarehouseId(e.target.value)} 
                    required 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <input type="text" value={machineName} onChange={e => setMachineName(e.target.value)} required placeholder="Machine Name" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500" />
                  <input type="text" value={machineType} onChange={e => setMachineType(e.target.value)} placeholder="Type (e.g. CNC, Hydraulic)" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500" />
                  <button type="submit" className="w-full mt-2 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    Deploy Asset
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {warehouses.map(w => (
                <div key={w.id} className="bg-card border border-border p-6 rounded-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                    <WarehouseIcon size={48} className="text-muted-foreground/10" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {w.name}
                        <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{w.location}</span>
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {w.machineries.map((m: any) => (
                      <div key={m.id} className="bg-background border border-border p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm">{m.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2 py-0.5 rounded-md">{m.type}</span>
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Efficiency Today</span>
                            <span className="text-emerald-400 font-bold">{m.efficiency}%</span>
                          </div>
                          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${m.efficiency}%` }} className="h-full bg-emerald-500" />
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
                            <Activity size={10} /> ROI Projected: <span className="text-foreground">8.4% / qtr</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {w.machineries.length === 0 && (
                      <div className="col-span-2 text-center py-6 text-muted-foreground text-sm flex items-center justify-center gap-2 italic">
                        No machineries deployed in this sector.
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {warehouses.length === 0 && <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-3xl">No warehouses initialized.</div>}
            </div>
          </motion.div>
        )}

        {activeTab === "logistics" && (
          <motion.div 
            key="logistics"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Payment Section */}
            <div className="bg-card border border-border p-6 rounded-3xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Truck size={32} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">B2B Settlement</h2>
                  <p className="text-xs text-muted-foreground">Settle material orders on-chain.</p>
                </div>
              </div>

              <form onSubmit={handleLogisticsPayment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Recipient Org Wallet</label>
                  <input 
                    type="text" 
                    value={recipientOrg} 
                    onChange={e => setRecipientOrg(e.target.value)}
                    placeholder="0x..." 
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Amount (BUSD)</label>
                    <input 
                      type="number" 
                      value={logisticsAmount} 
                      onChange={e => setLogisticsAmount(e.target.value)}
                      placeholder="500.00" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Reference</label>
                    <input 
                      type="text" 
                      value={logisticsDesc} 
                      onChange={e => setLogisticsDesc(e.target.value)}
                      placeholder="e.g. Parts #992" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-[0_10px_20px_rgba(99,102,241,0.2)]"
                >
                  {isProcessing ? "Processing..." : "Complete B2B Transfer"}
                </button>
              </form>
            </div>

            {/* Network Feed Section */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden">
               <Box className="absolute top-0 right-0 p-6 text-indigo-500/10 pointer-events-none" size={120} />
               <h3 className="font-bold flex items-center gap-2 mb-4">
                 <Activity size={18} className="text-indigo-400" /> Logistics Intelligence
               </h3>
               <div className="space-y-4">
                 {[
                   { label: "Optimal Route", val: "Port Hub A → Sector B", status: "Active" },
                   { label: "Asset Availability", val: "94.2%", status: "Stable" },
                   { label: "Network Latency", val: "12ms", status: "Verified" }
                 ].map((stat, i) => (
                   <div key={i} className="bg-background/50 border border-border/50 p-4 rounded-2xl flex justify-between items-center">
                     <div>
                       <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{stat.label}</div>
                       <div className="text-sm font-bold text-foreground">{stat.val}</div>
                     </div>
                     <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">{stat.status}</span>
                   </div>
                 ))}
               </div>
               
               <div className="mt-8 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                 <p className="text-[10px] text-indigo-400 font-medium leading-relaxed italic">
                   "Protocol auto-optimizes machinery efficiency based on shipment volume. B2B payments are atomic and irreversible."
                 </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <WalletSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        onSelect={connectWallet} 
      />
    </div>
  );
}
