"use client";

import { useStore } from "@/store/useStore";
import { DollarSign, Users, Cpu, TrendingUp } from "lucide-react";
import { EarningChart } from "./Charts";
import { motion } from "framer-motion";

export default function DashboardClient({ config }: { config: any }) {
  const { user, accumulatedPayroll } = useStore();

  const mockChartData = [
    { name: 'Mon', savings: 1200 },
    { name: 'Tue', savings: 1900 },
    { name: 'Wed', savings: 2400 },
    { name: 'Thu', savings: 2100 },
    { name: 'Fri', savings: 3200 },
    { name: 'Sat', savings: 3800 },
    { name: 'Sun', savings: 4100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your resources today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Funds Widget */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-card border border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <DollarSign size={18} />
            </div>
            <span className="text-sm font-medium">Total Resource Value</span>
          </div>
          <h3 className="text-2xl font-bold">${config.totalFunds.toLocaleString()}</h3>
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> +2.5% from last month
          </p>
        </motion.div>

        {/* Dynamic Payroll / Trading Profit */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <TrendingUp size={18} />
            </div>
            <span className="text-sm font-medium">
              {user?.role === 'SUPER_ADMIN' ? 'External Bot Profit' : 'Your Live Payroll'}
            </span>
          </div>
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
            ${user?.role === 'SUPER_ADMIN' ? config.profitFromBot.toLocaleString() : accumulatedPayroll.toFixed(4)}
          </h3>
          <p className="text-xs text-muted-foreground mt-2">Streaming real-time</p>
        </motion.div>

        {/* Employees */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
              <Users size={18} />
            </div>
            <span className="text-sm font-medium">Active Workforce</span>
          </div>
          <h3 className="text-2xl font-bold">{config.totalEmployees}</h3>
          <p className="text-xs text-muted-foreground mt-2">Connected & streaming</p>
        </motion.div>

        {/* Machinery */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
              <Cpu size={18} />
            </div>
            <span className="text-sm font-medium">Machine Uptime</span>
          </div>
          <h3 className="text-2xl font-bold">{config.totalMachines}</h3>
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> 99.9% uptime
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-2 bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Revenue Trajectory</h3>
          <EarningChart data={mockChartData} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Monthly Target</h3>
            <p className="text-sm text-muted-foreground">Operating target vs achieved</p>
          </div>
          <div className="flex items-center justify-center my-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.3} className="text-indigo-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">70%</span>
                <span className="text-xs text-muted-foreground">reached</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-border pt-4">
            <div className="text-muted-foreground">Target: <span className="text-foreground">${config.monthlyRevenue.toLocaleString()}</span></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
