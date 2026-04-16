"use client";

import { useStore } from "@/store/useStore";
import { useState } from "react";
import { updateAdminConfig } from "@/app/actions";
import { Save, AlertCircle } from "lucide-react";
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
            <label className="text-sm font-medium text-muted-foreground">Total Corporate Funds ($)</label>
            <input 
              name="totalFunds"
              type="number" 
              value={formData.totalFunds}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
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
            <label className="text-sm font-medium text-muted-foreground">Total Workforce</label>
            <input 
              name="totalEmployees"
              type="number" 
              value={formData.totalEmployees}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
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

        <div className="pt-6 border-t border-border flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Configuration
          </button>
        </div>
      </motion.div>
    </div>
  );
}
