import { ethers } from "ethers";

const STABLECOIN_ADDRESS = process.env.NEXT_PUBLIC_STABLECOIN_ADDRESS || "0xBbFb69CE5f1B74d6125912b8Bc16bED1324dfa2b";
const PAYROLL_ADDRESS = process.env.NEXT_PUBLIC_PAYROLL_ADDRESS || "0x1C5Cbd35d579c55af192d3Cc4830280dC9B1E9cb";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

const STABLECOIN_ABI = [
	{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
	{ "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" } ], "name": "ERC20InsufficientAllowance", "type": "error" },
	{ "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" } ], "name": "ERC20InsufficientBalance", "type": "error" },
	{ "inputs": [ { "internalType": "address", "name": "approver", "type": "address" } ], "name": "ERC20InvalidApprover", "type": "error" },
	{ "inputs": [ { "internalType": "address", "name": "receiver", "type": "address" } ], "name": "ERC20InvalidReceiver", "type": "error" },
	{ "inputs": [ { "internalType": "address", "name": "sender", "type": "address" } ], "name": "ERC20InvalidSender", "type": "error" },
	{ "inputs": [ { "internalType": "address", "name": "spender", "type": "address" } ], "name": "ERC20InvalidSpender", "type": "error" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" },
	{ "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }
];

const PAYROLL_ABI = [
	{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
	{ "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "OwnableInvalidOwner", "type": "error" },
	{ "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "OwnableUnauthorizedAccount", "type": "error" },
	{ "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
	{ "inputs": [ { "internalType": "address", "name": "token", "type": "address" } ], "name": "SafeERC20FailedOperation", "type": "error" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "employee", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "rate", "type": "uint256" } ], "name": "EmployeeAdded", "type": "event" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "employee", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "finalPayout", "type": "uint256" } ], "name": "EmployeeRemoved", "type": "event" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "employer", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "TreasuryDeposited", "type": "event" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "employee", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "WagesWithdrawn", "type": "event" },
	{ "inputs": [ { "internalType": "address", "name": "_employeeWallet", "type": "address" }, { "internalType": "uint256", "name": "_monthlySalary", "type": "uint256" } ], "name": "addEmployee", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "depositTreasury", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "employees", "outputs": [ { "internalType": "uint256", "name": "wagePerSecond", "type": "uint256" }, { "internalType": "uint256", "name": "lastWithdrawalTime", "type": "uint256" }, { "internalType": "bool", "name": "isActive", "type": "bool" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "_employeeWallet", "type": "address" } ], "name": "getUnclaimedWages", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "_employeeWallet", "type": "address" } ], "name": "removeEmployee", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [], "name": "stablecoin", "outputs": [ { "internalType": "contract IERC20", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [], "name": "withdrawWages", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

export class BlockchainBridge {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  private providers: Map<string, any> = new Map();
  private selectedRdns: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("eip6963:announceProvider", (event: any) => {
        this.providers.set(event.detail.info.rdns, event.detail.provider);
      });
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }
  }

  setProviderRdns(rdns: string | null) {
    this.selectedRdns = rdns;
    this.provider = null; // Reset provider to force re-init with new one
    this.signer = null;
  }

  async isWalletAvailable() {
    const provider = await this.getProvider();
    return !!provider;
  }

  private async getProvider() {
    if (typeof window === "undefined") return null;
    
    // Check if we already have a provider
    if (this.provider) return this.provider;

    // If a specific provider is selected via RDNS
    if (this.selectedRdns && this.providers.has(this.selectedRdns)) {
      this.provider = new ethers.BrowserProvider(this.providers.get(this.selectedRdns));
      return this.provider;
    }

    // Fallback: search for MetaMask or EIP-6963 providers
    const eth = (window as any).ethereum;
    
    // If no window.ethereum and no EIP-6963 providers found yet, wait a moment
    if (!eth && this.providers.size === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check again after wait
    if (this.selectedRdns && this.providers.has(this.selectedRdns)) {
      this.provider = new ethers.BrowserProvider(this.providers.get(this.selectedRdns));
      return this.provider;
    }

    if (eth) {
      let selectedProvider = eth;
      if (eth.providers?.length > 0) {
        selectedProvider = eth.providers.find((p: any) => p.isMetaMask) || eth.providers[0];
      }
      this.provider = new ethers.BrowserProvider(selectedProvider);
      return this.provider;
    }

    // If still nothing, check if any provider announced itself
    if (this.providers.size > 0) {
      const firstProvider = Array.from(this.providers.values())[0];
      this.provider = new ethers.BrowserProvider(firstProvider);
      return this.provider;
    }

    return null;
  }

  async switchNetwork() {
    const provider = await this.getProvider();
    if (typeof window === "undefined" || !provider) return;
    
    try {
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("No ethereum provider found to switch network.");

      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const eth = (window as any).ethereum;
        if (eth) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia Test Network",
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        }
      } else if (switchError.message?.includes("Failed to fetch") || switchError.code === -32603) {
        throw new Error("RPC Connection Error: MetaMask is unable to reach the Sepolia network. Please check your internet connection or try manually adding an RPC in MetaMask.");
      } else {
        throw switchError;
      }
    }
  }

  private async getSigner() {
    const provider = await this.getProvider();
    if (!provider) {
      throw new Error("MetaMask or a compatible Web3 wallet was not found. Please install MetaMask to continue.");
    }
    
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(11155111)) {
        await this.switchNetwork();
        // After switching, the provider might need to be refreshed
        this.provider = null;
        const newProvider = await this.getProvider();
        if (!newProvider) throw new Error("Failed to reconnect after network switch.");
        this.signer = await newProvider.getSigner();
        return this.signer;
      }
    } catch (err: any) {
      if (err.message?.includes("user rejected")) {
        throw new Error("Network switch rejected. Please switch to Sepolia to use this application.");
      }
      throw err;
    }

    if (!this.signer) {
      try {
        this.signer = await provider.getSigner();
      } catch (err: any) {
        if (err.code === "ACTION_REJECTED" || err.message?.includes("user rejected")) {
          throw new Error("Wallet connection rejected. Please connect your wallet to continue.");
        }
        throw err;
      }
    }
    return this.signer;
  }

  async connectWallet() {
    try {
      const signer = await this.getSigner();
      const address = await signer.getAddress();
      return address;
    } catch (e: any) {
      if (e.code === -32002) {
        throw new Error("Handshake Pending: Please check your MetaMask window for an active request.");
      }
      throw e;
    }
  }

  async getStablecoinBalance(address: string) {
    const provider = await this.getProvider();
    if (!provider) return "0.00";
    
    try {
      // Check network before call
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(11155111)) {
        console.warn("getStablecoinBalance: Wrong network. Expected Sepolia.");
        return "0.00";
      }

      if (!ethers.isAddress(STABLECOIN_ADDRESS)) throw new Error("Invalid Stablecoin address");

      const contract = new ethers.Contract(STABLECOIN_ADDRESS, STABLECOIN_ABI, provider);
      const balance = await contract.balanceOf(address);
      return ethers.formatUnits(balance, 18);
    } catch (e: any) {
      if (e.code === "CALL_EXCEPTION") {
        console.error("Contract call failed. Is the contract deployed on your current network? (Expected Sepolia)");
      } else if (e.code === -32002) {
        console.warn("RPC is throttling. Using cached balance.");
      } else {
        console.error("Read Error:", e);
      }
      return "0.00";
    }
  }

  async approveBUSD(amount: number) {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(STABLECOIN_ADDRESS, STABLECOIN_ABI, signer);
    const tx = await contract.approve(PAYROLL_ADDRESS, ethers.parseUnits(amount.toString(), 18));
    return await tx.wait();
  }

  private handleError(e: any): never {
    if (e.code === -32603 || e.message?.includes("Failed to fetch") || e.message?.includes("coalesce")) {
      throw new Error("RPC Connection Error: MetaMask is unable to reach the Sepolia network. Please check your internet connection or try a different RPC in MetaMask.");
    }
    if (e.code === -32002) {
      throw new Error("RPC Busy: Your endpoint is rate-limited or a transaction is pending. Please wait 15 seconds.");
    }
    throw e;
  }

  async depositTreasury(amount: number) {
    try {
      const signer = await this.getSigner();
      const contract = new ethers.Contract(PAYROLL_ADDRESS, PAYROLL_ABI, signer);
      const tx = await contract.depositTreasury(ethers.parseUnits(amount.toString(), 18));
      return await tx.wait();
    } catch (e: any) {
      this.handleError(e);
    }
  }

  async addEmployee(wallet: string, monthlySalary: number) {
    try {
      const signer = await this.getSigner();
      const contract = new ethers.Contract(PAYROLL_ADDRESS, PAYROLL_ABI, signer);
      const tx = await contract.addEmployee(wallet, ethers.parseUnits(monthlySalary.toString(), 18));
      return await tx.wait();
    } catch (e: any) {
      this.handleError(e);
    }
  }

  async getUnclaimedWages(wallet: string) {
    const provider = await this.getProvider();
    if (!provider) return "0.00";
    
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(11155111)) return "0.00";

      const contract = new ethers.Contract(PAYROLL_ADDRESS, PAYROLL_ABI, provider);
      const wages = await contract.getUnclaimedWages(wallet);
      return ethers.formatUnits(wages, 18);
    } catch (e) {
      return "0.00";
    }
  }

  async withdrawWages() {
    try {
      const signer = await this.getSigner();
      const contract = new ethers.Contract(PAYROLL_ADDRESS, PAYROLL_ABI, signer);
      const tx = await contract.withdrawWages();
      return await tx.wait();
    } catch (e: any) {
      this.handleError(e);
    }
  }

  async transferBUSD(to: string, amount: number) {
    try {
      const signer = await this.getSigner();
      const contract = new ethers.Contract(STABLECOIN_ADDRESS, STABLECOIN_ABI, signer);
      const tx = await contract.transfer(to, ethers.parseUnits(amount.toString(), 18));
      return await tx.wait();
    } catch (e: any) {
      this.handleError(e);
    }
  }

  onRoiUpdate(callback: (roi: number) => void) {
    console.log("ROI updates active.");
  }
}

export const bridge = new BlockchainBridge();
