"use client";

import { motion } from "framer-motion";
import { ArrowRight, Box, Zap, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-indigo-500/30 w-full">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Box size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              De-ERP
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Platform</a>
            <a href="#protocol" className="hover:text-white transition-colors">85/15 Protocol</a>
            <a href="#developers" className="hover:text-white transition-colors">Developers</a>
          </div>
          <div>
            <Link href="/login" className="px-5 py-2 text-sm font-medium rounded-full bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Access Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-6">
        {/* Glowing Background FX */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mask-image-radial-gradient"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            v2.0 Protocol is now live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
            The Future of Decentralized <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 animate-gradient-x">
              Resource Management
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Automate payroll streams via smart contracts, lock liquidity globally, and monitor your entire organization through our unified, non-custodial ERP framework.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login" className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-2 group">
              Get Started Seamlessly 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#architecture" className="px-8 py-4 rounded-full bg-white/5 text-white border border-white/10 font-semibold hover:bg-white/10 transition-all flex items-center gap-2">
              View Architecture Docs
            </a>
          </motion.div>
        </div>

        {/* Mock UI Preview window */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-6xl mx-auto mt-24 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 bottom-[-20px]" />
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#09090b] shadow-2xl relative">
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="mx-auto bg-white/5 rounded pl-4 pr-12 text-xs text-white/30 h-6 flex items-center">app.de-erp.io / dashboard</div>
            </div>
            {/* Fake dashboard inner - populated with 'Live' preview elements */}
            <div className="p-0 flex flex-col h-[500px] bg-[#09090b]">
               <div className="flex-1 flex overflow-hidden">
                 {/* Sidebar Mock */}
                 <div className="w-48 border-r border-white/5 p-4 space-y-4">
                   <div className="h-4 w-24 bg-white/10 rounded" />
                   <div className="space-y-2 pt-4">
                     {[1,2,3,4].map(i => (
                       <div key={i} className={`h-8 rounded-lg flex items-center px-3 gap-2 ${i === 1 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-transparent text-white/20'}`}>
                         <div className="w-3 h-3 rounded bg-current opacity-30" />
                         <div className="h-2 w-12 bg-current opacity-20" />
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 {/* Content Mock */}
                 <div className="flex-1 p-6 space-y-6 overflow-hidden">
                   <div className="flex justify-between items-center">
                     <div className="space-y-1">
                       <h4 className="text-sm font-bold text-white/90">Global Fleet Overview</h4>
                       <p className="text-[10px] text-white/40 font-medium">REAL-TIME NETWORK DIAGNOSTICS</p>
                     </div>
                     <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-bold text-indigo-400 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                       SYSTEM OPERATIONAL
                     </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                     {[
                       { label: 'Network Nodes', val: '1,248', color: 'indigo' },
                       { label: 'Protocol Yield', val: '15.59%', color: 'cyan' },
                       { label: 'Total Value', val: '$659.4M', color: 'purple' }
                     ].map((stat, i) => (
                       <div key={i} className="h-24 bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                         <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</div>
                         <div className="text-xl font-bold text-white/90">{stat.val}</div>
                         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full bg-${stat.color}-500 w-${i === 0 ? '4/5' : i === 1 ? '1/2' : '3/4'}`} />
                         </div>
                       </div>
                     ))}
                   </div>

                   <div className="grid grid-cols-2 gap-4 h-full">
                     <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                           <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Yield Stream</div>
                           <Zap size={14} className="text-indigo-400" />
                        </div>
                        <div className="space-y-3">
                          {[
                            { email: 'aaa@de-erp.io', amount: '+$14.20' },
                            { email: 'bbb@de-erp.io', amount: '+$8.50' },
                            { email: 'ccc@de-erp.io', amount: '+$21.00' }
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                                <div className="text-[10px] text-white/60 font-medium">{row.email}</div>
                              </div>
                              <div className="text-[10px] text-green-400 font-bold font-mono">{row.amount}</div>
                            </div>
                          ))}
                        </div>
                        {/* Fake mini chart lines */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end px-4 gap-1 opacity-20 pointer-events-none">
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className="flex-1 bg-indigo-400 rounded-t-sm" style={{ height: `${Math.sin(i * 0.5) * 40 + 50}%` }} />
                          ))}
                        </div>
                     </div>
                     <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Node Health Status</div>
                        <div className="space-y-3">
                          {[
                            { name: 'EU-West Cluster', status: 'Online' },
                            { name: 'US-East Relay', status: 'Syncing' },
                            { name: 'Asia Gateway', status: 'Online' }
                          ].map((node, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'Online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                <div className="text-[10px] text-white/70 font-medium">{node.name}</div>
                              </div>
                              <div className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${node.status === 'Online' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {node.status}
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features */}
      <section className="py-24 bg-background relative z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Enterprise-Grade Architecture</h2>
            <p className="text-white/50 max-w-2xl mx-auto">Skip the legacy middle-men. De-ERP provides everything you need to execute complex corporate financing entirely on-chain.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Live Streaming Payroll</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Why pay bi-weekly? Our React-driven smart contracts simulate per-second micro-transactions directly to employee wallets.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">85/15 Governance Logic</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Automatically allocate 85% of yields to cold storage pools while exposing 15% to high-velocity hot wallets via deterministic 15-day locks.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                <Box size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seamless Exchange Offloads</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Execute withdrawals instantly to Binance, Kraken, and Coinbase Prime directly from the corporate dashboard with full audit-ledgers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Basic Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-white/30 text-sm">
        <p>© 2026 Decentralized ERP LLC. All rights simulated for demo purposes.</p>
      </footer>

      {/* Global override styles for web only gradient text */}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-gradient-x {
          background-size: 200% auto;
          animation: 3s gradient-x linear infinite;
        }
        @keyframes gradient-x {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}} />
    </div>
  );
}
