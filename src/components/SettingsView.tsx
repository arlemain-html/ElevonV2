import React, { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { CONTRACT_ADDRESSES, CHAIN_ID, RPC_URL } from "../blockchain/contracts";
import { ShieldAlert, Trash2, Cpu, Eye, ExternalLink, HardDrive, Shield } from "lucide-react";

export const SettingsView: React.FC = () => {
  const { isConnected, address, chainId, refreshOnChainData } = useWeb3();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetCache = () => {
    localStorage.removeItem("elevon_posts");
    localStorage.removeItem("elevon_comments");
    localStorage.removeItem("elevon_bookmarks");
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Network Diagnostics */}
      <div className="bg-[#0E0E0E] p-6 rounded-xl border border-[#1A1A1A] space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-[#10B981]" />
          Blockchain Network Diagnostics
        </h3>
        <p className="text-xs text-[#888]">
          Diagnose active wallet connections and smart contract configurations running inside the Base L2 sandbox.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#111] space-y-2">
            <span className="text-[10px] text-[#555] font-bold uppercase block">Wallet Details</span>
            <div className="flex justify-between">
              <span className="text-[#555]">Connected:</span>
              <span className={isConnected ? "text-[#10B981] font-bold" : "text-rose-500"}>
                {isConnected ? "TRUE" : "FALSE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555]">Address:</span>
              <span className="text-[#888] truncate max-w-[150px]" title={address || ""}>
                {address || "0x"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555]">Chain ID:</span>
              <span className="text-[#888]">
                {chainId || "None"} (Target: {CHAIN_ID})
              </span>
            </div>
          </div>

          <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#111] space-y-2">
            <span className="text-[10px] text-[#555] font-bold uppercase block">RPC Network Configuration</span>
            <div className="flex justify-between">
              <span className="text-[#555]">L2 Provider:</span>
              <span className="text-[#888]">Base Mainnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555]">RPC Endpoint:</span>
              <span className="text-[#555] truncate max-w-[150px]">{RPC_URL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555]">Explorer:</span>
              <a
                href="https://basescan.org"
                target="_blank"
                rel="noreferrer"
                className="text-[#10B981] font-bold hover:brightness-110 flex items-center gap-1"
              >
                Basescan
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contract registry details */}
      <div className="bg-[#0E0E0E] p-6 rounded-xl border border-[#1A1A1A] space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
          <Shield className="w-4 h-4 text-[#10B981]" />
          Smart Contract Registry
        </h3>
        <p className="text-xs text-[#888]">
          The verified immutable smart contracts acting as the source of truth for the Elevon dApp.
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl border border-[#111]">
            <div>
              <span className="text-[10px] text-[#555] uppercase font-bold block">ForumIdentityRegistry</span>
              <span className="text-[#888] break-all">{CONTRACT_ADDRESSES.ForumIdentityRegistry}</span>
            </div>
            <a
              href={`https://basescan.org/address/${CONTRACT_ADDRESSES.ForumIdentityRegistry}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#10B981] hover:brightness-110 shrink-0 ml-2"
              title="View on explorer"
            >
              <Eye className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl border border-[#111]">
            <div>
              <span className="text-[10px] text-[#555] uppercase font-bold block">ForumReputation</span>
              <span className="text-[#888] break-all">{CONTRACT_ADDRESSES.ForumReputation}</span>
            </div>
            <a
              href={`https://basescan.org/address/${CONTRACT_ADDRESSES.ForumReputation}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#10B981] hover:brightness-110 shrink-0 ml-2"
            >
              <Eye className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl border border-[#111]">
            <div>
              <span className="text-[10px] text-[#555] uppercase font-bold block">SoulboundReputationTokens</span>
              <span className="text-[#888] break-all">{CONTRACT_ADDRESSES.SoulboundReputationTokens}</span>
            </div>
            <a
              href={`https://basescan.org/address/${CONTRACT_ADDRESSES.SoulboundReputationTokens}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#10B981] hover:brightness-110 shrink-0 ml-2"
            >
              <Eye className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* System Wipe / Reset cache */}
      <div className="bg-[#0E0E0E] p-6 rounded-xl border border-[#1A1A1A] space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
          <HardDrive className="w-4 h-4 text-rose-500" />
          Offline Cache Management
        </h3>
        <p className="text-xs text-[#888]">
          Reset local simulator and localStorage caches to return the forum data, comments, bookmarks, and configurations to their baseline genesis state. This action is irreversible.
        </p>

        {resetSuccess && (
          <div className="bg-emerald-950/20 text-[#10B981] text-xs p-3 border border-emerald-900/30 rounded-xl font-medium">
            ✔ Cache wiped successfully. Re-syncing registry block...
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleResetCache}
            className="bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            Wipe Offline Cache
          </button>
        </div>
      </div>
    </div>
  );
};
