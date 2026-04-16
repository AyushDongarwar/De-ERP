import { useState } from "react";
import { updateOrgVizTools, createWarehouse } from "@/app/actions";
import { BarChart, PieChart, Activity, Box, Plus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function OrganizationSetup({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");

  const tools = [
    { id: "EFFICIENCY", name: "Machine Efficiency", icon: Activity, desc: "Real-time tracking of machinery up-time." },
    { id: "DELIVERY", name: "Delivery Tracking", icon: Box, desc: "Monitor daily logistics and warehouse output." },
    { id: "ROI", name: "ROI Analytics", icon: BarChart, desc: "Track long-term investment returns on assets." },
    { id: "B2B", name: "B2B Logistics", icon: PieChart, desc: "Protocol for stablecoin-asset swaps." },
  ];

  const toggleTool = (id: string) => {
    setSelectedTools(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (selectedTools.length === 0) return;
      await updateOrgVizTools(user.id, selectedTools);
      setStep(2);
    } else {
      if (!warehouseName) return;
      await createWarehouse(user.id, warehouseName, warehouseLocation);
      onComplete();
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 bg-card border border-border rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
          {step === 1 ? "Customize Your Dashboard" : "Setup Your First Warehouse"}
        </h2>
        <p className="text-muted-foreground mb-8">
          {step === 1 ? "Select the visualization tools you need to manage your inventory and finances." : "Configure your primary logistics hub to start tracking machinery efficiency."}
        </p>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 text-left ${
                  selectedTools.includes(tool.id) 
                    ? "bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/20" 
                    : "bg-background border-border hover:border-indigo-400/50"
                }`}
              >
                <tool.icon className={`mb-3 ${selectedTools.includes(tool.id) ? "text-indigo-400" : "text-muted-foreground"}`} size={24} />
                <span className="font-bold text-foreground">{tool.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{tool.desc}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Warehouse Name</label>
              <input 
                type="text" value={warehouseName} onChange={e => setWarehouseName(e.target.value)} required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Central Hub Alpha"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Location (Optional)</label>
              <input 
                type="text" value={warehouseLocation} onChange={e => setWarehouseLocation(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Global Port Sector 7"
              />
            </div>
          </div>
        )}

        <button 
          onClick={handleNext}
          className="w-full mt-8 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
        >
          {step === 1 ? "Save Preferences" : "Initialize Infrastructure"}
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
