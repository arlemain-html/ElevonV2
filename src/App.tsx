import React, { useState } from "react";
import { Web3Provider, useWeb3 } from "./contexts/Web3Context";
import { HomeView } from "./components/HomeView";
import { FeedView } from "./components/FeedView";
import { CommunitiesView } from "./components/CommunitiesView";
import { ReputationView } from "./components/ReputationView";
import { BadgesView } from "./components/BadgesView";
import { ProfileView } from "./components/ProfileView";
import { SearchView } from "./components/SearchView";
import { SettingsView } from "./components/SettingsView";
import { Post } from "./types";
import {
  Home,
  MessageSquare,
  Users,
  Search,
  Zap,
  Award,
  User,
  Settings,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Menu,
  X,
  LogOut
} from "lucide-react";

const MainAppContent: React.FC = () => {
  const { isConnected, address, identity, stats, connectWallet, disconnectWallet, chainId, isCorrectNetwork, switchNetwork } = useWeb3();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("All");

  // Shorten user address
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  // Menu items with their names and icons
  const menuItems = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "feed", label: "Active Feed", icon: MessageSquare },
    { id: "community", label: "Guilds & Groups", icon: Users },
    { id: "search", label: "Search Forum", icon: Search },
    { id: "reputation", label: "On-Chain Rep", icon: Zap },
    { id: "badges", label: "SBT Collections", icon: Award },
    { id: "profile", label: "My Profile", icon: User },
    { id: "settings", label: "Diagnostics", icon: Settings }
  ];

  const handleSelectCommunity = (communityId: string) => {
    setSelectedPost(null);
    setSelectedCommunityId(communityId);
    setActiveTab("feed");
  };

  const handleNavigateToPost = (post: Post) => {
    setSelectedPost(post);
    setActiveTab("feed");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col md:flex-row antialiased font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden border-b border-[#1A1A1A] bg-[#0A0A0A] p-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center font-bold text-sm tracking-tight text-black">
            E
          </div>
          <span className="font-sans font-bold tracking-tight text-lg text-white">ELEVON</span>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="bg-[#111] border border-[#222] text-[10px] font-mono text-[#E0E0E0] px-2.5 py-1 rounded-md">
              {shortAddress}
            </span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-[#111] border border-[#222] text-[#888]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation - Left Column */}
      <aside
        className={`w-64 border-r border-[#1A1A1A] bg-[#0A0A0A] p-6 flex flex-col justify-between shrink-0 fixed md:sticky top-0 h-[calc(100vh-65px)] md:h-screen z-30 transition-all duration-300 ${
          isMobileMenuOpen ? "left-0" : "-left-64 md:left-0"
        }`}
      >
        <div className="space-y-8">
          {/* Brand Identity Header */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#10B981] rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center font-bold text-sm tracking-tight text-black">
              E
            </div>
            <span className="font-sans font-bold tracking-tight text-xl text-white">ELEVON</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedPost(null);
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold border transition-all ${
                    isActive
                      ? "bg-[#1A1A1A] text-white border-[#333]"
                      : "text-[#888] hover:text-white hover:bg-[#111] border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session Box at bottom of Sidebar */}
        <div className="border-t border-[#1A1A1A] pt-5 space-y-3.5">
          {isConnected ? (
            <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-3.5 rounded-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center font-mono font-bold text-[#E0E0E0]">
                  {usernamePlaceholder(address)}
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-200">
                    {identity?.registered ? localStorage.getItem(`elevon_username_${address}`) || "Registered User" : "Visitor"}
                    {identity?.verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] fill-[#10B981]/10" />
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-[#666]">{shortAddress}</span>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono border-t border-[#1A1A1A] pt-3">
                  <div className="bg-[#111] p-1.5 rounded border border-[#222]">
                    <div className="text-[#666] font-sans">Level</div>
                    <div className="text-white font-bold">LV {Number(stats.level) || 1}</div>
                  </div>
                  <div className="bg-[#111] p-1.5 rounded border border-[#222]">
                    <div className="text-[#666] font-sans">Reputation</div>
                    <div className="text-[#10B981] font-bold">+{Number(stats.reputation)} REP</div>
                  </div>
                </div>
              )}

              <button
                onClick={disconnectWallet}
                className="w-full mt-2 bg-[#141414] hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/40 text-[#888] font-bold px-3 py-1.5 rounded-xl text-[10px] tracking-wide uppercase transition duration-200 flex items-center justify-center gap-1.5 border border-[#222]"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full bg-[#10B981] hover:brightness-110 text-black font-bold px-4 py-2.5 rounded-full text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </aside>

      {/* Main Container Stage - Right Column */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-full bg-[#050505]">
        {/* Wrong network alert banner */}
        {isConnected && !isCorrectNetwork && (
          <div className="bg-[#0E0E0E] border border-[#1A1A1A] text-[#E0E0E0] p-4 rounded-xl text-xs font-sans flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>
                <strong>Wrong Network detected:</strong> Please switch your wallet network to Base Mainnet (Chain ID 8453) to fetch your correct on-chain reputation points and write registrations.
              </span>
            </div>
            <button
              onClick={switchNetwork}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
            >
              Switch Network
            </button>
          </div>
        )}

        {/* Render Active View tab */}
        <div className="min-h-[calc(100vh-140px)]">
          {activeTab === "home" && <HomeView onNavigate={setActiveTab} />}
          
          {activeTab === "feed" && (
            <FeedView
              selectedPost={selectedPost}
              setSelectedPost={setSelectedPost}
              searchQuery={searchQuery}
              initialCommunityId={selectedCommunityId}
              onClearCommunityFilter={() => setSelectedCommunityId("All")}
            />
          )}
          
          {activeTab === "community" && <CommunitiesView onSelectCommunity={handleSelectCommunity} />}
          
          {activeTab === "search" && <SearchView onNavigateToPost={handleNavigateToPost} />}
          
          {activeTab === "reputation" && <ReputationView />}
          
          {activeTab === "badges" && <BadgesView />}
          
          {activeTab === "profile" && <ProfileView onNavigateToPost={handleNavigateToPost} />}
          
          {activeTab === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
};

// Quick helper to generate a fallback avatar letter
function usernamePlaceholder(address: string | null) {
  if (!address) return "?";
  return address[2].toUpperCase();
}

export default function App() {
  return (
    <Web3Provider>
      <MainAppContent />
    </Web3Provider>
  );
}
