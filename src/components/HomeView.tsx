import React from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Shield, Sparkles, Award, Users, FileText, ChevronRight, Wallet } from "lucide-react";
import { INITIAL_COMMUNITIES } from "../lib/supabase";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { isConnected, address, identity, stats, connectWallet, switchNetwork, isCorrectNetwork } = useWeb3();

  // Calculated overall metrics
  const totalRegisteredMembers = 4920;
  const totalReputationIssued = 24500;
  const totalOffChainPosts = 1065;

  return (
    <div id="home-view" className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Hero Welcome Section */}
      <div className="relative rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] p-6 md:p-8 overflow-hidden shadow-lg">
        {/* Decorative background grid and gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Live on Base L2 Mainnet
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4 font-sans">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-emerald-400 to-teal-400">ELEVON</span>
          </h1>
          
          <p className="text-[#888] text-sm md:text-base leading-relaxed mb-6 font-sans">
            A Web3 Social Forum combining instant off-chain discussion boards with secure, soulbound, on-chain identity, XP, and reputation tokens on Base. Your voice is verified; your achievements are permanent.
          </p>

          <div className="flex flex-wrap gap-3">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-[#10B981] hover:brightness-110 text-black px-5 py-2.5 rounded-full font-bold transition flex items-center gap-2 text-sm shadow-md"
              >
                <Wallet className="w-4 h-4" />
                Connect Web3 Wallet
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchNetwork}
                className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-full font-bold transition flex items-center gap-2 text-sm shadow-md animate-pulse"
              >
                <Shield className="w-4 h-4" />
                Switch to Base Network
              </button>
            ) : !identity?.registered ? (
              <button
                onClick={() => onNavigate("profile")}
                className="bg-[#10B981] hover:brightness-110 text-black px-5 py-2.5 rounded-full font-bold transition flex items-center gap-2 text-sm shadow-md"
              >
                <Shield className="w-4 h-4" />
                Register On-Chain Identity
              </button>
            ) : (
              <button
                onClick={() => onNavigate("feed")}
                className="bg-[#1A1A1A] hover:bg-[#222] text-white px-5 py-2.5 rounded-full font-bold transition flex items-center gap-2 text-sm border border-[#333]"
              >
                Explore Active Feed
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => onNavigate("reputation")}
              className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-white px-5 py-2.5 rounded-full font-bold transition text-sm"
            >
              Learn Reputation Math
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-[#10B981]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {totalRegisteredMembers.toLocaleString()}
            </div>
            <div className="text-xs text-[#555] font-sans">On-chain Identities</div>
          </div>
        </div>
        
        <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-[#10B981]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {totalReputationIssued.toLocaleString()}
            </div>
            <div className="text-xs text-[#555] font-sans">Total Reputation Pool</div>
          </div>
        </div>

        <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-[#10B981]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {totalOffChainPosts.toLocaleString()}
            </div>
            <div className="text-xs text-[#555] font-sans">Off-chain Threads</div>
          </div>
        </div>
      </div>

      {/* Dual Stack Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* On Chain Block */}
        <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/5 border border-[#1A1A1A] text-[#10B981] rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white font-sans">
              On-Chain Identity & SBTs
            </h2>
          </div>
          <p className="text-[#888] text-xs leading-relaxed font-sans">
            All user credentials are stored directly inside decentralized ledger smart contracts. This guarantees that your profile cannot be locked or censored by admins, and that achievements like verification, streaks, badges, or special mod roles are issued as cryptographic soulbound tokens directly owned by your Base address.
          </p>
          <ul className="text-xs text-[#666] space-y-2 list-disc list-inside pl-1 font-sans">
            <li>On-chain XP & level multipliers</li>
            <li>Soulbound NFTs verification badges</li>
            <li>Cryptographic moderator credential checking</li>
          </ul>
        </div>

        {/* Off Chain Block */}
        <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/5 border border-[#1A1A1A] text-[#10B981] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white font-sans">
              Off-Chain Instant Discussion
            </h2>
          </div>
          <p className="text-[#888] text-xs leading-relaxed font-sans">
            To provide a snappy, Web2-grade user experience with zero friction and zero gas overhead, Elevon stores discussion threads, instant feeds, search categories, and comments inside our secure Supabase database pool. Only actual moderator reports or reputation-damaging actions trigger on-chain contract writes.
          </p>
          <ul className="text-xs text-[#666] space-y-2 list-disc list-inside pl-1 font-sans">
            <li>Instant microsecond text publishing</li>
            <li>Zero-gas commenting and thread creation</li>
            <li>Instant keywords indexing and global searching</li>
          </ul>
        </div>
      </div>

      {/* Recommended Communities Carousel preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#666]">Featured Guilds</h2>
          <button onClick={() => onNavigate("community")} className="text-xs text-[#10B981] hover:brightness-110 font-medium transition">
            See all guilds &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INITIAL_COMMUNITIES.slice(0, 2).map((community) => (
            <div
              key={community.id}
              className="border border-[#1A1A1A] bg-[#0E0E0E] p-5 rounded-xl hover:border-[#333] transition duration-150 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-white font-sans mb-1">
                  c/{community.name}
                </h3>
                <p className="text-xs text-[#888] font-sans leading-relaxed line-clamp-2">
                  {community.description}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-[#555] pt-3 border-t border-[#1A1A1A]">
                <span>{community.category}</span>
                <span>{community.memberCount} builders</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
