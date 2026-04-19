import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';
import { useStore, EIP6963ProviderInfo } from '@/store/useStore';
import { bridge } from '@/lib/contracts';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { setInstalledWallets, installedWallets, setSelectedWallet } = useStore();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const scanForWallets = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }
  };

  useEffect(() => {
    const wallets: any[] = [];
    
    const onAnnounce = (event: any) => {
      const { info } = event.detail;
      if (!wallets.find(w => w.rdns === info.rdns)) {
        wallets.push(info);
        setInstalledWallets([...wallets]);
      }
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    scanForWallets();

    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, [setInstalledWallets]);

  const handleSelect = async (wallet: any) => {
    setIsConnecting(wallet.rdns);
    try {
      bridge.setProviderRdns(wallet.rdns);
      setSelectedWallet(wallet.rdns);
      const address = await bridge.connectWallet();
      onSelect(address);
      onClose();
    } catch (e: any) {
      console.error("Wallet connection error:", e);
      if (e.code === "WALLET_NOT_FOUND") {
        alert("Wallet extension not detected. Please ensure your browser extension (like MetaMask) is installed and unlocked.");
      } else {
        alert(e.message || "Connection failed. Please check your wallet extension.");
      }
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0b] p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
                <p className="text-sm text-gray-400">Select your preferred wallet to continue</p>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Wallet List */}
            <div className="space-y-3">
              {installedWallets.length > 0 ? (
                installedWallets.map((wallet) => (
                  <button
                    key={wallet.rdns}
                    onClick={() => handleSelect(wallet)}
                    disabled={!!isConnecting}
                    className="group relative flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:border-blue-500/50 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-black/20 p-2">
                        <img 
                          src={wallet.icon} 
                          alt={wallet.name} 
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <span className="block font-semibold text-white">{wallet.name}</span>
                        <span className="text-xs text-gray-500">{wallet.rdns}</span>
                      </div>
                    </div>
                    {isConnecting === wallet.rdns ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                    )}
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-500">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <Wallet size={24} />
                  </div>
                  <p>No compatible wallets detected.</p>
                  <p className="text-xs mt-1 mb-4">Please install MetaMask or Phantom.</p>
                  <button 
                    onClick={scanForWallets}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                  >
                    Rescan for extension
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-blue-500/5 p-4 text-xs text-blue-400">
              <ShieldCheck size={16} />
              <p>Your private keys stay safe in your wallet extension. We never see them.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
