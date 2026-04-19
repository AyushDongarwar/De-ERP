"use client";

import { useStore } from "@/store/useStore";
import { LogIn, Key, Mail, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { loginUser } from "../actions";

export default function Login() {
  const router = useRouter();
  const { login } = useStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mouse tracking for the 'surprising' spotlight effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const res = await loginUser(email, password);
    setLoading(false);
    
    if (res.error) {
      setError(res.error);
    } else if (res.user) {
      login(res.user as any);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Global Background - Intensifies on interaction */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.01, rotateX: (mousePos.y - 250) / 100, rotateY: (mousePos.x - 250) / -100 }}
        onMouseMove={handleMouseMove}
        style={{ perspective: 1000 }}
        className="w-full max-w-md bg-card border border-border p-10 rounded-3xl shadow-2xl relative z-10 overflow-hidden group transition-all duration-300"
      >
        {/* The 'Surprising' Spotlight Background */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.15), transparent 40%)`
          }}
        />

        {/* Decorative Grid appearing on hover */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-0 group-hover:opacity-20 transition-opacity duration-500" />

        <div className="text-center mb-10 relative z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/20"
          >
            <LogIn className="text-white" size={32} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white/60">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-3 text-sm font-medium tracking-wide uppercase">Secure Portal Access</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-20">
          <div className="space-y-2 group/input">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-indigo-400 transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background/50 backdrop-blur-sm border border-border rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                placeholder="admin@de-erp.io"
              />
            </div>
          </div>
          
          <div className="space-y-2 group/input">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-indigo-400 transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background/50 backdrop-blur-sm border border-border rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-8 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In to Ecosystem <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Subtle decorative elements */}
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      </motion.div>
    </div>
  );
}
