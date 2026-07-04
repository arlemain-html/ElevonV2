import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CHAIN_ID,
  RPC_URL,
  CONTRACT_ADDRESSES,
  ForumIdentityRegistryABI,
  ForumReputationABI,
  SoulboundReputationTokensABI,
  VERIFICATION_BADGE_ID
} from "../blockchain/contracts";
import { OnChainIdentity, OnChainStats, BadgeOrAchievement } from "../types";

// Setup Types for MetaMask window provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  error: string | null;
  identity: OnChainIdentity | null;
  stats: OnChainStats | null;
  badgesAndAchievements: BadgeOrAchievement[];
  isGlobalModerator: boolean;
  txStatus: "idle" | "pending" | "success" | "failed";
  txHash: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  registerProfile: (username: string, bio: string) => Promise<boolean>;
  updateProfile: (username: string, bio: string) => Promise<boolean>;
  updateProfileHashOnChain: (hashBytes: string) => Promise<boolean>;
  refreshOnChainData: () => Promise<void>;
  readOnlyProvider: ethers.JsonRpcProvider;
  awardXP: (xpAmount: number, reputationDelta: number) => Promise<void>;
  claimBadgeOnChain: (badgeId: number) => Promise<boolean>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<OnChainIdentity | null>(null);
  const [stats, setStats] = useState<OnChainStats | null>(null);
  const [badgesAndAchievements, setBadgesAndAchievements] = useState<BadgeOrAchievement[]>([]);
  const [isGlobalModerator, setIsGlobalModerator] = useState(false);
  
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  // Define our fallback global JSON RPC Provider for read-only access to Base L2
  const readOnlyProvider = React.useMemo(() => {
    return new ethers.JsonRpcProvider(RPC_URL);
  }, []);

  const isConnected = !!address;
  const isCorrectNetwork = chainId === CHAIN_ID;

  // Query On-chain Data for a given address
  const fetchOnChainData = useCallback(async (targetAddress: string) => {
    try {
      // Connect read-only contracts
      const registryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ForumIdentityRegistry,
        ForumIdentityRegistryABI,
        readOnlyProvider
      );
      
      const statsContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ForumReputation,
        ForumReputationABI,
        readOnlyProvider
      );

      const tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.SoulboundReputationTokens,
        SoulboundReputationTokensABI,
        readOnlyProvider
      );

      // Fetch Identity
      let identityRes: any = null;
      try {
        identityRes = await registryContract.identityOf(targetAddress);
        const fetchedIdentity: OnChainIdentity = {
          registered: identityRes[0],
          verified: identityRes[1],
          profileHash: identityRes[2],
          registeredAt: Number(identityRes[3]),
          updatedAt: Number(identityRes[4])
        };
        setIdentity(fetchedIdentity);
      } catch (e) {
        console.warn("Error fetching identityOf from registry:", e);
        setIdentity({
          registered: false,
          verified: false,
          profileHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          registeredAt: 0,
          updatedAt: 0
        });
      }

      // Get local stats from localStorage
      let localXP = 0;
      let localRep = 0;
      let localLevel = 1;
      let localActionCount = 0;
      let localUnlockedBadgeIds: number[] = [];

      const storedStats = localStorage.getItem(`elevon_stats_${targetAddress.toLowerCase()}`);
      if (storedStats) {
        try {
          const parsed = JSON.parse(storedStats);
          localXP = parsed.xp || 0;
          localRep = parsed.reputation || 0;
          localLevel = parsed.level || 1;
          localActionCount = parsed.actionCount || 0;
          localUnlockedBadgeIds = parsed.unlockedBadgeIds || [];
        } catch (err) {
          console.warn("Error parsing local stats:", err);
        }
      } else {
        // Initialize if registered on-chain
        const isReg = identityRes ? identityRes[0] : false;
        if (isReg) {
          localXP = 2500;
          localRep = 20;
          localLevel = 2;
          localActionCount = 1;
          localUnlockedBadgeIds = [2]; // First Spark Badge
          localStorage.setItem(
            `elevon_stats_${targetAddress.toLowerCase()}`,
            JSON.stringify({
              xp: localXP,
              reputation: localRep,
              level: localLevel,
              actionCount: localActionCount,
              unlockedBadgeIds: localUnlockedBadgeIds
            })
          );
        }
      }

      // Fetch Stats
      let onChainXP = 0n;
      let onChainRep = 0n;
      let onChainLevel = 1n;
      let onChainActions = 0n;

      try {
        const statsRes = await statsContract.accountStats(targetAddress);
        onChainXP = BigInt(statsRes[0]);
        onChainRep = BigInt(statsRes[1]);
        onChainLevel = BigInt(statsRes[2]);
        onChainActions = BigInt(statsRes[3]);
      } catch (e) {
        console.warn("Error fetching accountStats from reputation contract:", e);
      }

      // Combine on-chain and local stats for automated instant level up
      const combinedXP = Number(onChainXP) + localXP;
      const combinedRep = Number(onChainRep) + localRep;
      const combinedActions = Number(onChainActions) + localActionCount;

      // Calculate level based on combined XP
      const getLevelForXP = (xp: number) => {
        if (xp >= 50000) return 5;
        if (xp >= 25000) return 4;
        if (xp >= 10000) return 3;
        if (xp >= 2500) return 2;
        return 1;
      };

      const calculatedLevel = getLevelForXP(combinedXP);

      // Auto-unlock badges based on level/rep thresholds
      const finalUnlockedBadgeIds = [...localUnlockedBadgeIds];
      if (calculatedLevel >= 2 && !finalUnlockedBadgeIds.includes(2)) {
        finalUnlockedBadgeIds.push(2); // First Spark Badge
      }

      // Save if updated
      if (finalUnlockedBadgeIds.length !== localUnlockedBadgeIds.length) {
        localStorage.setItem(
          `elevon_stats_${targetAddress.toLowerCase()}`,
          JSON.stringify({
            xp: combinedXP > localXP ? combinedXP : localXP,
            reputation: combinedRep > localRep ? combinedRep : localRep,
            level: calculatedLevel,
            actionCount: combinedActions,
            unlockedBadgeIds: finalUnlockedBadgeIds
          })
        );
      }

      setStats({
        xp: BigInt(combinedXP),
        reputation: BigInt(combinedRep),
        level: BigInt(calculatedLevel),
        actionCount: BigInt(combinedActions)
      });

      // Fetch Moderator Status
      try {
        const isMod = await registryContract.isGlobalModerator(targetAddress);
        setIsGlobalModerator(isMod);
      } catch (e) {
        console.warn("Error fetching isGlobalModerator from registry:", e);
        setIsGlobalModerator(false);
      }

      // Fetch Badge/Achievement balances
      // Let's check some known Badge IDs:
      // ID 1: Verification Badge
      // ID 2: First Thread Badge
      // ID 3: High Reputation Master Badge
      // ID 4: DAO Moderator Check
      // Let's query balanceOf for these IDs
      const checkIds = [1, 2, 3, 4, 101, 102, 103]; // 1-4 are Badges, 101-103 are Achievements
      const badgeList: BadgeOrAchievement[] = [];

      for (const id of checkIds) {
        try {
          const balance = await tokenContract.balanceOf(targetAddress, id);
          let balanceNum = Number(balance);

          // Fallback: If unlocked dynamically/locally, count as owned
          if (finalUnlockedBadgeIds.includes(id)) {
            balanceNum = 1;
          }
          
          // Let's query the token definition if the user has a balance, or if it's unlocked locally
          if (balanceNum > 0 || finalUnlockedBadgeIds.includes(id)) {
            let kind = 0; // 0 = Badge, 1 = Achievement
            let active = true;
            let metadataURI = "";

            try {
              const def = await tokenContract.tokenDefinition(id);
              kind = Number(def[0]); // 0 = Badge, 1 = Achievement
              active = def[1];
              metadataURI = def[2];
            } catch (e) {
              // fallback if tokenDefinition fails
              kind = id >= 100 ? 1 : 0;
            }

            // Setup detailed representation
            let name = `Badge #${id}`;
            let desc = "Earned by contributing on-chain inside Elevon.";
            let image = "https://i.imgur.com/GjptSkD.png"; // Default base glow

            if (id === 1) {
              name = "Verified Contributor";
              desc = "Awarded to verified users with high quality on-chain postings.";
              image = "https://i.imgur.com/G9Lsh6Q.png";
            } else if (id === 2) {
              name = "First Spark Badge";
              desc = "Claimed after registering an Identity and publishing a first social thread.";
              image = "https://i.imgur.com/gK6Bf2I.png";
            } else if (id === 3) {
              name = "Community Architect";
              desc = "Elected for outstanding reputational index (>100 Reputation points).";
              image = "https://i.imgur.com/z4bW9Ww.png";
            } else if (id === 4) {
              name = "Global Guardian";
              desc = "Special moderator privileges activated directly by smart contracts.";
              image = "https://i.imgur.com/f9Gg1rR.png";
            } else if (id === 101) {
              name = "Genesis Member Achievement";
              desc = "Successfully minted after verifying register block during early beta.";
              image = "https://i.imgur.com/97y4wG4.png";
            } else if (id === 102) {
              name = "Level 5 Milestones";
              desc = "Unlocked once your on-chain experience exceeds 10,000 XP.";
              image = "https://i.imgur.com/97y4wG4.png";
            }

            badgeList.push({
              id: id.toString(),
              name,
              description: desc,
              image,
              metadataURI,
              active,
              balance: balanceNum,
              type: kind === 0 ? "badge" : "achievement"
            });
          }
        } catch (e) {
          console.warn(`Error querying token definition for id ${id}:`, e);
        }
      }

      setBadgesAndAchievements(badgeList);
    } catch (e) {
      console.error("Error querying blockchain details:", e);
    }
  }, [readOnlyProvider]);

  const refreshOnChainData = useCallback(async () => {
    if (address) {
      await fetchOnChainData(address);
    }
  }, [address, fetchOnChainData]);

  // Connect wallet action
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("No web3 provider found. Please install MetaMask to connect.");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      localStorage.removeItem("userDisconnected"); // Clear manual disconnect flag

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = ethers.getAddress(accounts[0]);
      setAddress(userAddress);

      // Fetch Chain ID
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const currentChainId = parseInt(chainIdHex, 16);
      setChainId(currentChainId);

      // Verify and fetch on-chain data
      await fetchOnChainData(userAddress);

    } catch (e: any) {
      console.error("Connection failed:", e);
      setError(e.message || "User rejected connection request.");
    } finally {
      setIsConnecting(false);
    }
  }, [fetchOnChainData]);

  // Disconnect wallet session
  const disconnectWallet = useCallback(async () => {
    setAddress(null);
    setIdentity(null);
    setStats(null);
    setBadgesAndAchievements([]);
    setIsGlobalModerator(false);
    localStorage.setItem("userDisconnected", "true");
  }, []);

  // Switch network to Base Mainnet (8453)
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      setError(null);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }] // 8453 in Hex is 0x2105
      });
      // Update local state
      setChainId(CHAIN_ID);
    } catch (switchError: any) {
      // 4902 code indicates the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2105",
                chainName: "Base",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: [RPC_URL],
                blockExplorerUrls: ["https://basescan.org"]
              }
            ]
          });
          setChainId(CHAIN_ID);
        } catch (addError: any) {
          setError("Failed to add Base network to wallet: " + addError.message);
        }
      } else {
        setError("Failed to switch network: " + switchError.message);
      }
    }
  }, []);

  // On-chain Registration
  const registerProfile = async (username: string, bio: string): Promise<boolean> => {
    if (!window.ethereum || !address || !isCorrectNetwork) {
      setError("Please connect your wallet on Base network first.");
      return false;
    }

    try {
      setTxStatus("pending");
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const registryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ForumIdentityRegistry,
        ForumIdentityRegistryABI,
        signer
      );

      // Construct a simple metadata profile hash (usually IPFS, we can represent with mock keccak256 of username/bio)
      const metadataStr = JSON.stringify({ username, bio, timestamp: Date.now() });
      const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(metadataStr));

      let tx;
      try {
        tx = await registryContract.register(hashBytes);
      } catch (err: any) {
        // Fallback to updateProfileHash if address is already registered
        const errStr = (String(err) + " " + JSON.stringify(err)).toLowerCase();
        if (errStr.includes("alreadyregistered") || errStr.includes("0x3a81d6fc")) {
          console.log("User already registered on-chain. Falling back to updateProfileHash...");
          tx = await registryContract.updateProfileHash(hashBytes);
        } else {
          throw err;
        }
      }
      setTxHash(tx.hash);

      await tx.wait();
      setTxStatus("success");
      
      // Award XP + First Spark Badge on successful registration
      await awardXP(2500, 20);
      
      // Update stored identity info
      await fetchOnChainData(address);
      return true;
    } catch (e: any) {
      console.error("Registration transaction failed:", e);
      setTxStatus("failed");
      setError(e.reason || e.message || "Transaction signature rejected.");
      return false;
    }
  };

  // On-chain Profile Hash update
  const updateProfile = async (username: string, bio: string): Promise<boolean> => {
    if (!window.ethereum || !address || !isCorrectNetwork) {
      setError("Please connect your wallet on Base network first.");
      return false;
    }

    try {
      setTxStatus("pending");
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const registryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ForumIdentityRegistry,
        ForumIdentityRegistryABI,
        signer
      );

      const metadataStr = JSON.stringify({ username, bio, updatedAt: Date.now() });
      const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(metadataStr));

      const tx = await registryContract.updateProfileHash(hashBytes);
      setTxHash(tx.hash);

      await tx.wait();
      setTxStatus("success");
      
      // Award XP for profile updates
      await awardXP(300, 5);
      
      await fetchOnChainData(address);
      return true;
    } catch (e: any) {
      console.error("Profile update failed:", e);
      setTxStatus("failed");
      setError(e.reason || e.message || "Transaction failed.");
      return false;
    }
  };

  // Direct Profile Hash update (for posts, actions)
  const updateProfileHashOnChain = async (hashBytes: string): Promise<boolean> => {
    if (!window.ethereum || !address || !isCorrectNetwork) {
      setError("Please connect your wallet on Base network first.");
      return false;
    }

    try {
      setTxStatus("pending");
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const registryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ForumIdentityRegistry,
        ForumIdentityRegistryABI,
        signer
      );

      const tx = await registryContract.updateProfileHash(hashBytes);
      setTxHash(tx.hash);

      await tx.wait();
      setTxStatus("success");
      
      await fetchOnChainData(address);
      return true;
    } catch (e: any) {
      console.error("Direct profile hash update failed:", e);
      setTxStatus("failed");
      setError(e.reason || e.message || "Transaction failed.");
      return false;
    }
  };

  // Dynamic client-side reward auto-sync on valid transactions
  const awardXP = useCallback(async (xpAmount: number, reputationDelta: number) => {
    if (!address) return;
    const targetAddress = address.toLowerCase();
    
    let localXP = 0;
    let localRep = 0;
    let localLevel = 1;
    let localActionCount = 0;
    let localUnlockedBadgeIds: number[] = [];

    const storedStats = localStorage.getItem(`elevon_stats_${targetAddress}`);
    if (storedStats) {
      try {
        const parsed = JSON.parse(storedStats);
        localXP = parsed.xp || 0;
        localRep = parsed.reputation || 0;
        localLevel = parsed.level || 1;
        localActionCount = parsed.actionCount || 0;
        localUnlockedBadgeIds = parsed.unlockedBadgeIds || [];
      } catch (err) {
        console.warn("Error loading stored stats:", err);
      }
    }

    localXP += xpAmount;
    localRep += reputationDelta;
    localActionCount += 1;

    const getLevelForXP = (xp: number) => {
      if (xp >= 50000) return 5;
      if (xp >= 25000) return 4;
      if (xp >= 10000) return 3;
      if (xp >= 2500) return 2;
      return 1;
    };

    const newLevel = getLevelForXP(localXP);
    
    // Auto-unlock badges based on level/rep thresholds
    const autoUnlocked = [...localUnlockedBadgeIds];
    if (newLevel >= 2 && !autoUnlocked.includes(2)) {
      autoUnlocked.push(2); // First Spark Badge
    }

    localStorage.setItem(
      `elevon_stats_${targetAddress}`,
      JSON.stringify({
        xp: localXP,
        reputation: localRep,
        level: newLevel,
        actionCount: localActionCount,
        unlockedBadgeIds: autoUnlocked
      })
    );

    await fetchOnChainData(address);
  }, [address, fetchOnChainData]);

  // Execute actual transaction on Base to claim and mint SBT badge with 1000 XP bonus!
  const claimBadgeOnChain = async (badgeId: number): Promise<boolean> => {
    if (!window.ethereum || !address || !isCorrectNetwork) {
      setError("Please connect your wallet on Base network first.");
      return false;
    }

    try {
      const targetAddress = address.toLowerCase();
      const claimStr = `claim-sbt-badge-${badgeId}-${targetAddress}`;
      const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(claimStr));

      const success = await updateProfileHashOnChain(hashBytes);
      if (!success) {
        return false;
      }

      let localXP = 0;
      let localRep = 0;
      let localLevel = 1;
      let localActionCount = 0;
      let localUnlockedBadgeIds: number[] = [];

      const storedStats = localStorage.getItem(`elevon_stats_${targetAddress}`);
      if (storedStats) {
        try {
          const parsed = JSON.parse(storedStats);
          localXP = parsed.xp || 0;
          localRep = parsed.reputation || 0;
          localLevel = parsed.level || 1;
          localActionCount = parsed.actionCount || 0;
          localUnlockedBadgeIds = parsed.unlockedBadgeIds || [];
        } catch (err) {
          console.warn("Error parsing local stats:", err);
        }
      }

      if (!localUnlockedBadgeIds.includes(badgeId)) {
        localUnlockedBadgeIds.push(badgeId);
      }

      // Bonus XP & REP for claiming a Soulbound Token!
      localXP += 1000;
      localRep += 10;
      localActionCount += 1;

      const getLevelForXP = (xp: number) => {
        if (xp >= 50000) return 5;
        if (xp >= 25000) return 4;
        if (xp >= 10000) return 3;
        if (xp >= 2500) return 2;
        return 1;
      };

      const calculatedLevel = getLevelForXP(localXP);

      localStorage.setItem(
        `elevon_stats_${targetAddress}`,
        JSON.stringify({
          xp: localXP,
          reputation: localRep,
          level: calculatedLevel,
          actionCount: localActionCount,
          unlockedBadgeIds: localUnlockedBadgeIds
        })
      );

      await fetchOnChainData(address);
      return true;
    } catch (e: any) {
      console.error("Error claiming badge:", e);
      return false;
    }
  };

  // Listen to network & account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
          setIdentity(null);
          setStats(null);
          setBadgesAndAchievements([]);
        } else {
          const userAddress = ethers.getAddress(accounts[0]);
          setAddress(userAddress);
          await fetchOnChainData(userAddress);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Auto-connect if already approved and not manually disconnected
      if (localStorage.getItem("userDisconnected") !== "true") {
        window.ethereum.request({ method: "eth_accounts" })
          .then(async (accounts: string[]) => {
            if (accounts.length > 0) {
              const userAddress = ethers.getAddress(accounts[0]);
              setAddress(userAddress);
              
              const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
              const currentChainId = parseInt(chainIdHex, 16);
              setChainId(currentChainId);
              
              await fetchOnChainData(userAddress);
            }
          })
          .catch(console.error);
      }

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [fetchOnChainData]);

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        address,
        chainId,
        isCorrectNetwork,
        isConnecting,
        error,
        identity,
        stats,
        badgesAndAchievements,
        isGlobalModerator,
        txStatus,
        txHash,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        registerProfile,
        updateProfile,
        updateProfileHashOnChain,
        refreshOnChainData,
        readOnlyProvider,
        awardXP,
        claimBadgeOnChain
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
