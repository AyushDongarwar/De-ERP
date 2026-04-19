"use client";

import { useStore } from "@/store/useStore";
import { useState } from "react";
import { updateAdminConfig, processOrganizationalPayroll } from "@/app/actions";
import { Save, AlertCircle, Banknote, ShieldAlert, TrendingDown, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPanelClient({ config }: { config: any }) {
  const { user } = useStore();
  const [formData, setFormData] = useState({
    totalFunds: config.totalFunds,
    profitFromBot: config.profitFromBot,
    totalEmployees: config.totalEmployees,
    totalMachines: config.totalMachines,
    monthlyRevenue: config.monthlyRevenue,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollMessage, setPayrollMessage] = useState("");

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ORGANIZATION') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle size={48} className="text-destructive mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You need administrator privileges to view this page.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateAdminConfig(formData);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleProcessPayroll = async () => {
    if (!user?.orgId && user?.role !== 'ORGANIZATION') return;
    setIsProcessingPayroll(true);
    try {
      const targetOrg = user.role === 'ORGANIZATION' ? user.id : user.orgId;
      const res = await processOrganizationalPayroll(targetOrg as string);
      setPayrollMessage(`Successfully processed $${res.amountProcessed.toLocaleString()} in wages.`);
    } catch (e: any) {
      setPayrollMessage(`Error: ${e.message}`);
    } finally {
      setIsProcessingPayroll(false);
      setTimeout(() => setPayrollMessage(""), 5000);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure global parameters and mock external bot logic.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-2xl space-y-6">
        <h3 className="text-lg font-semibold border-b border-border pb-4">Global Parameters Simulation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Corporate Funds ($)
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Activity size={10} /> LIVE SYNC
              </span>
            </label>
            <input 
              name="totalFunds"
              type="number" 
              value={formData.totalFunds}
              readOnly
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm cursor-not-allowed opacity-80"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Mock Bot Profit ($)</label>
            <input 
              name="profitFromBot"
              type="number" 
              value={formData.profitFromBot}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Workforce
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Activity size={10} /> LIVE SYNC
              </span>
            </label>
            <input 
              name="totalEmployees"
              type="number" 
              value={formData.totalEmployees}
              readOnly
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm cursor-not-allowed opacity-80"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Total Machinery</label>
            <input 
              name="totalMachines"
              type="number" 
              value={formData.totalMachines}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Monthly Revenue Target ($)</label>
            <input 
              name="monthlyRevenue"
              type="number" 
              value={formData.monthlyRevenue}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Organizational Financial Operations (Only for Orgs) */}
      {(user?.role === 'ORGANIZATION' || user?.role === 'SUPER_ADMIN') && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
             <h3 className="text-lg font-semibold flex items-center gap-2">
               <Banknote size={20} className="text-emerald-400" /> Financial Operations
             </h3>
             {user?.role === 'ORGANIZATION' && (
               <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/20">
                 PROVISIONED SEGMENT
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Workforce Settlement</h4>
                <p className="text-xs text-muted-foreground">Trigger the weekly payroll cycle for all connected nodes. This will deduct realized wages from your ledger.</p>
              </div>
              <button 
                onClick={handleProcessPayroll}
                disabled={isProcessingPayroll}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isProcessingPayroll ? "Processing..." : "Process Weekly Payroll"}
              </button>
              {payrollMessage && <p className="text-[10px] font-bold text-center text-emerald-400 animate-pulse">{payrollMessage}</p>}
            </div>

            <div className="bg-secondary/30 rounded-2xl p-4 border border-border flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-2">
                <ShieldAlert size={14} className="text-orange-400" /> Operational Health
              </div>
              <p className="text-xs text-muted-foreground italic mb-4">
                Nodes with negative liquidity will enter "Financial Debt" status, accruing interest according to the protocol dynamic rate.
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-red-400">
                <TrendingDown size={14} /> Critical Liquidity Check Active
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
