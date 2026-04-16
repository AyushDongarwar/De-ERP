import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserState {
  id: string;
  email: string | null;
  role: 'SUPER_ADMIN' | 'ORGANIZATION' | 'EMPLOYEE';
  orgId: string | null;
  payType: string;
  hourlyRate: number;
  dailyRate: number;
  botPercentage: number;
  releasedFunds: number;
  lockedFunds: number;
  coldWalletBalance: number;
}

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface AppState {
  user: UserState | null;
  walletAddress: string | null;
  selectedWalletRdns: string | null;
  installedWallets: EIP6963ProviderInfo[];
  accumulatedPayroll: number;
  coldWalletBalance: number;
  hotWalletBalance: number;
  botROI: number;
  login: (user: UserState) => void;
  logout: () => void;
  setInstalledWallets: (wallets: EIP6963ProviderInfo[]) => void;
  setSelectedWallet: (rdns: string | null) => void;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  addPayroll: (amount: number) => void;
  updateBalances: (cold: number, hot: number) => void;
  updateUser: (user: Partial<UserState>) => void;
  setROI: (roi: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      walletAddress: null,
      selectedWalletRdns: null,
      installedWallets: [],
      accumulatedPayroll: 0,
      coldWalletBalance: 0,
      hotWalletBalance: 0,
      botROI: 0.1559, // Start with the requested example value
      login: (user) => set({ user }),
      logout: () => set({ 
        user: null, 
        walletAddress: null, 
        selectedWalletRdns: null, 
        accumulatedPayroll: 0, 
        coldWalletBalance: 0, 
        hotWalletBalance: 0 
      }),
      setInstalledWallets: (wallets) => set({ installedWallets: wallets }),
      setSelectedWallet: (rdns) => set({ selectedWalletRdns: rdns }),
      connectWallet: (address) => set({ walletAddress: address }),
      disconnectWallet: () => set({ walletAddress: null }),
      addPayroll: (amount) => set((state) => ({ accumulatedPayroll: state.accumulatedPayroll + amount })),
      updateBalances: (cold, hot) => set({ coldWalletBalance: cold, hotWalletBalance: hot }),
      updateUser: (u) => set((state) => ({ 
        user: state.user ? { ...state.user, ...u } : null 
      })),
      setROI: (roi) => set({ botROI: roi }),
    }),
    {
      name: 'de-erp-storage',
    }
  )
);
