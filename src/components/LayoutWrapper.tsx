"use client";

import { useStore } from "@/store/useStore";
import { LogOut, LayoutDashboard, Wallet, Briefcase, ChevronRight, Users, ShieldCheck, Coins, BarChart3, Bot } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { WalletSelector } from "./WalletSelector";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout, walletAddress, connectWallet } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isPublicPage = pathname === '/' || pathname === '/login';
    
    // Redirect if trying to access private page without user
    if (!user && !isPublicPage) {
      router.push('/');
    }

    // Smart Redirect: If logged in and on landing page, go to dashboard
    if (user && pathname === '/') {
      router.push('/dashboard');
    }
  }, [user, pathname, router, mounted]);

  if (!mounted) return null;

  const isPublicPage = pathname === '/' || pathname === '/login';

  if (!user) {
    if (isPublicPage) {
      return <main className="min-h-screen bg-background text-foreground">{children}</main>;
    }
    return null;
  }

  if (pathname === '/') {
    return <main className="min-h-screen bg-background flex text-foreground">{children}</main>;
  }

  const handleConnectWallet = () => {
    if (walletAddress) return;
    setIsSelectorOpen(true);
  };

  const getNavItems = () => {
    if (user.role === 'SUPER_ADMIN') {
      return [
        { name: 'Platform Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Protocol & Fees', href: '/protocol', icon: ShieldCheck },
        { name: 'Admin Center', href: '/admin', icon: ShieldCheck },
        { name: 'Bot Ecosystem', href: '/bot', icon: Bot },
        { name: 'Revenue Ledger', href: '/revenue', icon: BarChart3 },
      ];
    } else if (user.role === 'ORGANIZATION') {
      return [
        { name: 'Org Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Wallet System', href: '/wallet', icon: Wallet },
        { name: 'Exchange Offload', href: '/exchange', icon: Briefcase },
      ];
    } else {
      return [
        { name: 'My Tasks', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Wallet System', href: '/wallet', icon: Wallet },
        { name: 'Exchange Withdraw', href: '/exchange', icon: Briefcase },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            De-ERP
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">{user.role.replace('_', ' ')} Portal</p>
          <div className="mt-3 text-xs text-muted-foreground truncate">{user.email}</div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link key={item.name} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "bg-indigo-500/10 text-indigo-400" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon size={18} className={isActive ? "text-indigo-400" : ""} />
                {item.name}
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="ml-auto">
                    <ChevronRight size={14} />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur flex items-center justify-between px-8 z-10">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            {pathname.split('/').pop()?.toUpperCase() || 'DASHBOARD'}
          </div>
          
          <div className="flex items-center gap-4">
            {user.role !== 'SUPER_ADMIN' && (
              <button 
                onClick={handleConnectWallet}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-2",
                  walletAddress 
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", walletAddress ? "bg-green-500" : "bg-indigo-500 animate-pulse")} />
                {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : "Connect Wallet"}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>

      <WalletSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        onSelect={connectWallet} 
      />
    </div>
  );
}
