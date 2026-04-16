"use client";

import { useStore } from "@/store/useStore";
import { useState, useEffect } from "react";
import { createTransaction, getCurrentUserFinancials, getTransactions, getOrgWorkforceFinancials, getOrgWorkforceTransactions } from "@/app/actions";
import { ArrowRightLeft, ArrowUpRight, History, Wallet, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { bridge } from "@/lib/contracts";

export default function ExchangeClient() {
  const { user, coldWalletBalance, updateBalances, updateUser, walletAddress, connectWallet } = useStore();
  const role = user?.role;
  const isOrg = role === 'ORGANIZATION';
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("Binance Exchange");
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [onChainWages, setOnChainWages] = useState<string>("0.00");

  useEffect(() => {
    async function syncData() {
      if (!user?.id) return;
      
      const finPromise = isOrg ? getOrgWorkforceFinancials(user.id) : getCurrentUserFinancials(user.id);
      const txPromise = isOrg ? getOrgWorkforceTransactions(user.id) : getTransactions(user.id);
      const wagePromise = (!isOrg && walletAddress) ? bridge.getUnclaimedWages(walletAddress) : Promise.resolve("0.00");
      
      const [finData, txData, wages] = await Promise.all([finPromise, txPromise, wagePromise]);
      
      if (finData) updateBalances(finData.coldWalletBalance, finData.lockedFunds);
      if (txData) setTransactions(txData);
      if (wages) setOnChainWages(wages);
    }
    syncData();
    const interval = setInterval(syncData, 15000);
    return () => clearInterval(interval);
  }, [user?.id, isOrg, updateBalances, walletAddress]);

  const adminWithdrawn = transactions.filter(t => t.type === 'WITHDRAWAL').reduce((acc, t) => acc + t.amount, 0);
  const availableBalance = role === 'ADMIN' ? Math.max(0, 37500 - adminWithdrawn) : (coldWalletBalance + Number(onChainWages));

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!walletAddress) {
      alert("Please connect your wallet to execute an on-chain transfer.");
      return;
    }
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount > availableBalance || withdrawAmount <= 0) return;
    if (!receiverAddress || !receiverAddress.startsWith("0x")) {
      alert("Please provide a valid recipient wallet address.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. CLAIM FROM PROTOCOL FIRST
      try {
        await bridge.withdrawWages();
      } catch (claimErr) {
        console.warn("Claim skipped or failed:", claimErr);
      }

      // 2. PERFORM ON-CHAIN TRANSFER TO RECIPIENT
      await bridge.transferBUSD(receiverAddress, withdrawAmount);
      
      // 3. IF SUCCESSFUL, SYNC WITH DB
      // We only decrement the ledger by what was available there (15% principle portion)
      const ledgerDeduction = Math.max(0, Math.min(withdrawAmount, coldWalletBalance));
      await createTransaction(user.id, withdrawAmount, ledgerDeduction, "WITHDRAWAL", `${recipient} (${receiverAddress.slice(0,6)}...)`);
      
      if (role === 'EMPLOYEE') {
        const remainingCold = Math.max(0, (coldWalletBalance + Number(onChainWages)) - withdrawAmount);
        updateBalances(remainingCold, useStore.getState().hotWalletBalance);
        updateUser({ coldWalletBalance: remainingCold });
        setOnChainWages("0.00");
      }
      
      const updatedTxs = await getTransactions(user.id);
      setTransactions(updatedTxs);
      
      setAmount("");
      setReceiverAddress("");
      alert("Metamask Transfer Successful! Funds sent on-chain.");
    } catch (err: any) {
      alert("On-chain Transfer Failed: " + (err.reason || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnect = async () => {
    try {
      const addr = await bridge.connectWallet();
      if (addr) useStore.setState({ walletAddress: addr });
    } catch (err: any) {
      alert(err.message || "Failed to connect wallet");
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exchange & Transfers</h1>
        <p className="text-muted-foreground text-sm mt-1">Withdraw available funds to external exchanges via smart contract.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-indigo-400" /> {isOrg ? "Available Workforce Principle" : "Available to Withdraw"}
            </h3>
            <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              ${availableBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isOrg ? "Aggregated principle reserves of your entire workforce." : "Maximum limit derived from cold wallet reserves."}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-2xl">
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Withdrawal Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={availableBalance}
                    placeholder="0.00"
                    className="w-full bg-background border border-border rounded-lg pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-muted-foreground/50"
                  />
                  <button type="button" onClick={() => setAmount(availableBalance.toString())} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-secondary text-foreground px-2 py-1 rounded">
                    MAX
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Recipient Wallet Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><ExternalLink size={14}/></span>
                  <input 
                    type="text" 
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors uppercase placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {!walletAddress ? (
                <button 
                  type="button"
                  onClick={handleConnect}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-4 py-3 rounded-lg text-sm font-semibold transition-all border border-border"
                >
                  <Wallet size={18} /> Connect Wallet to Transfer
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isProcessing || Number(amount) > availableBalance || !amount || !receiverAddress}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                >
                  {isProcessing ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><ArrowUpRight size={18} /> Execute On-Chain Transfer</>
                  )}
                </button>
              )}
            </form>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl flex flex-col">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <History size={18} className="text-muted-foreground" /> Transaction Ledger
          </h3>
          
          <div className="flex-1 overflow-auto">
            {transactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                <ArrowRightLeft size={48} className="opacity-20 mb-4" />
                <p>No transactions found on ledger.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-lg">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg">ID</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    {isOrg && <th className="px-4 py-3 font-medium">Employee</th>}
                    <th className="px-4 py-3 font-medium">Recipient</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors last:border-0">
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{tx.id.slice(-8)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500">
                          <ArrowUpRight size={12} /> {tx.type}
                        </span>
                      </td>
                      {isOrg && <td className="px-4 py-4 text-xs font-medium text-indigo-400">{tx.employeeEmail}</td>}
                      <td className="px-4 py-4">{tx.recipient}</td>
                      <td className="px-4 py-4 font-medium">${tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
