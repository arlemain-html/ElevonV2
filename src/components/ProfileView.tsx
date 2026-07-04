import React, { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { OnChainIdentity, OnChainStats, Post } from "../types";
import { ShieldCheck, Calendar, RefreshCw, PenTool, Edit3, Save, CheckCircle, XCircle, ExternalLink, Bookmark } from "lucide-react";
import { CONTRACT_ADDRESSES } from "../blockchain/contracts";
import { getStoredPosts, getStoredBookmarks } from "../lib/supabase";

interface ProfileViewProps {
  onNavigateToPost: (post: Post) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateToPost }) => {
  const {
    isConnected,
    address,
    identity,
    stats,
    registerProfile,
    updateProfile,
    txStatus,
    txHash,
    error,
    connectWallet,
    switchNetwork,
    isCorrectNetwork,
    refreshOnChainData
  } = useWeb3();

  // Local Form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Loaded saved off-chain bookmarks
  const [savedBookmarks, setSavedBookmarks] = useState<Post[]>([]);

  useEffect(() => {
    // Attempt to load username/bio from localStorage fallback
    const savedName = localStorage.getItem(`elevon_username_${address}`);
    const savedBio = localStorage.getItem(`elevon_bio_${address}`);
    
    if (savedName) setUsername(savedName);
    else setUsername("");

    if (savedBio) setBio(savedBio);
    else setBio("");

    // Load bookmarked posts
    const storedBookmarks = getStoredBookmarks();
    const storedPosts = getStoredPosts();
    const bookmarked = storedPosts.filter((p: any) => storedBookmarks.includes(p.id));
    setSavedBookmarks(bookmarked);
  }, [address]);

  // Execute Registration on-chain
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    // Trigger on-chain contract write!
    const success = await registerProfile(username, bio);
    if (success) {
      // Save offline representation too
      localStorage.setItem(`elevon_username_${address}`, username);
      localStorage.setItem(`elevon_bio_${address}`, bio);
      setIsEditing(false);
    }
  };

  // Execute Profile Update on-chain
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    // Trigger on-chain update write
    const success = await updateProfile(username, bio);
    if (success) {
      localStorage.setItem(`elevon_username_${address}`, username);
      localStorage.setItem(`elevon_bio_${address}`, bio);
      setIsEditing(false);
    }
  };

  const getRegisteredDate = (identityObj: OnChainIdentity | null) => {
    if (!identityObj || Number(identityObj.registeredAt) === 0) return "Never";
    // Convert block timestamp to readable date
    const date = new Date(Number(identityObj.registeredAt) * 1000);
    return date.toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <div className="w-16 h-16 bg-[#0E0E0E] border border-[#1A1A1A] rounded-full flex items-center justify-center mx-auto text-[#555]">
          <RefreshCw className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Wallet Disconnected</h2>
          <p className="text-xs text-[#888] leading-relaxed">
            Please connect your Web3 MetaMask wallet to inspect, register, or manage your on-chain Elevon Identity.
          </p>
        </div>
        <button
          onClick={connectWallet}
          className="bg-[#10B981] hover:brightness-110 text-black px-5 py-2.5 rounded-full font-bold transition text-xs shadow-md"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <div className="w-16 h-16 bg-[#10B981]/5 border border-[#10B981]/15 rounded-full flex items-center justify-center mx-auto text-[#10B981] animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Incorrect Blockchain Network</h2>
          <p className="text-xs text-[#888] leading-relaxed">
            ELEVON is deployed exclusively on Base L2 Mainnet (Chain ID 8453). Switch your wallet network to continue.
          </p>
        </div>
        <button
          onClick={switchNetwork}
          className="bg-[#10B981] hover:brightness-110 text-black px-5 py-2.5 rounded-full font-bold transition text-xs shadow-md animate-pulse"
        >
          Switch to Base Network
        </button>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <div className="w-16 h-16 bg-[#0E0E0E] border border-[#1A1A1A] rounded-full flex items-center justify-center mx-auto text-[#10B981]">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Loading Profile</h2>
          <p className="text-xs text-[#888] leading-relaxed">
            Fetching your secure on-chain identity records from Base L2...
          </p>
        </div>
      </div>
    );
  }

  const isRegistered = identity?.registered;

  return (
    <div id="profile-view" className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Transaction status notifications */}
      {txStatus !== "idle" && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-sans ${
          txStatus === "pending"
            ? "bg-[#10B981]/5 border-[#10B981]/20 text-[#10B981]"
            : txStatus === "success"
            ? "bg-emerald-950/20 border-emerald-900/30 text-[#10B981]"
            : "bg-rose-950/20 border-rose-900/30 text-rose-400"
        }`}>
          <div className="flex items-center gap-2">
            {txStatus === "pending" && <RefreshCw className="w-4 h-4 animate-spin" />}
            {txStatus === "success" && <CheckCircle className="w-4 h-4" />}
            {txStatus === "failed" && <XCircle className="w-4 h-4" />}
            <span>
              {txStatus === "pending" && "Transaction Pending. Please confirm block mining on MetaMask..."}
              {txStatus === "success" && "Transaction Succeeded! On-chain identity status updated."}
              {txStatus === "failed" && `Transaction failed: ${error}`}
            </span>
          </div>
          {txHash && (
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold underline text-[#10B981] hover:brightness-110"
            >
              Basescan Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Main Profile Info & Forms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Stats card */}
        <div className="bg-[#0E0E0E] p-5 rounded-xl border border-[#1A1A1A] space-y-4">
          <div className="text-center space-y-2">
            {/* Round avatar representation */}
            <div className="w-16 h-16 rounded-full bg-[#111] border border-[#222] flex items-center justify-center mx-auto relative">
              {identity?.verified && (
                <ShieldCheck className="w-6 h-6 text-[#10B981] absolute -bottom-1 -right-1 fill-black rounded-full" />
              )}
              <span className="text-xl font-bold font-mono text-[#888]">{username ? username[0].toUpperCase() : "?"}</span>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white">
                {username || "Unregistered Explorer"}
              </h3>
              <p className="text-[10px] font-mono text-[#555] break-all">{address}</p>
            </div>
          </div>

          <div className="border-t border-[#111] pt-3 space-y-2.5 text-xs">
            <div className="flex justify-between font-sans">
              <span className="text-[#555]">Identity Status:</span>
              <span className={`font-bold font-mono ${isRegistered ? "text-[#10B981]" : "text-amber-500"}`}>
                {isRegistered ? "REGISTERED" : "UNREGISTERED"}
              </span>
            </div>

            <div className="flex justify-between font-sans">
              <span className="text-[#555]">Registry Block date:</span>
              <span className="font-semibold text-[#888] font-mono">
                {getRegisteredDate(identity)}
              </span>
            </div>

            <div className="flex justify-between font-sans">
              <span className="text-[#555]">Identity Hash:</span>
              <span className="font-semibold text-[#888] font-mono text-[9px] break-all truncate max-w-[120px]">
                {identity?.profileHash && identity.profileHash !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                  ? `${identity.profileHash.slice(0, 10)}...`
                  : "Not registered"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-2 bg-[#0E0E0E] p-6 rounded-xl border border-[#1A1A1A]">
          {!identity?.registered ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register On-chain Identity</h3>
                <p className="text-xs text-[#888] leading-relaxed font-sans">
                  Elevon gates forum threads publication on registered addresses. By executing this registration, you mint a cryptographic record into the `ForumIdentityRegistry` on Base Mainnet. Gas cost is minuscule (&lt;$0.01).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Decentralized Username</label>
                  <input
                    type="text"
                    placeholder="Enter unique alias..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1A1A1A] text-xs rounded-xl p-3 text-[#E0E0E0] focus:outline-none focus:border-[#333]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">On-chain Bio</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description about yourself or what you build on Base..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1A1A1A] text-xs rounded-xl p-3 text-[#E0E0E0] focus:outline-none focus:border-[#333] font-sans leading-relaxed"
                  />
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-3.5 rounded-xl font-mono text-[10px] text-[#555] leading-snug">
                Contract Method: <code className="text-[#10B981] font-bold">register(bytes32 profileHash)</code><br />
                Address: <code className="text-[#888]">{CONTRACT_ADDRESSES.ForumIdentityRegistry}</code>
              </div>

              <button
                type="submit"
                className="bg-[#10B981] hover:brightness-110 text-black font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition"
              >
                Register Identity Profile
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#111] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Decentralized Bio details</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[10px] font-bold text-[#888] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                >
                  {isEditing ? "Cancel Edit" : "Edit Bio"}
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#555] block font-bold">Decentralized bio</span>
                    <p className="text-xs text-[#E0E0E0] font-sans leading-relaxed bg-[#0A0A0A] p-4 rounded-xl border border-[#1A1A1A] whitespace-pre-line">
                      {bio || "No bio registered yet. Complete your on-chain profile to help other builders recognize you."}
                    </p>
                  </div>

                  <div className="flex items-start gap-2 bg-[#10B981]/5 border border-[#10B981]/15 text-[#10B981] p-3.5 rounded-xl text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Your on-chain Identity profile is fully active. You are cleared to publish threads and receive reputation points.</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Decentralized Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#1A1A1A] text-xs rounded-xl p-3 text-[#E0E0E0] focus:outline-none focus:border-[#333]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">On-chain Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#1A1A1A] text-xs rounded-xl p-3 text-[#E0E0E0] focus:outline-none focus:border-[#333] font-sans leading-relaxed"
                    />
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded font-mono text-[9px] text-[#555]">
                    Will call contract: <code className="text-[#10B981] font-bold">updateProfileHash(bytes32 newHash)</code>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#10B981] hover:brightness-110 text-black font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition"
                  >
                    Save Changes On-chain
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bookmarked Threads Segment */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-[#10B981]" />
          Bookmarked Threads ({savedBookmarks.length})
        </h3>

        {savedBookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedBookmarks.map((post) => (
              <div
                key={post.id}
                onClick={() => onNavigateToPost(post)}
                className="border border-[#1A1A1A] bg-[#0E0E0E] p-5 rounded-xl hover:border-[#333] hover:bg-[#111] transition duration-150 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#555] mb-1.5">
                    <span>c/{post.communityId}</span>
                    <span>•</span>
                    <span className="font-mono">{post.authorName}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#E0E0E0] font-sans leading-relaxed line-clamp-2">
                    {post.title}
                  </h4>
                </div>
                <div className="text-[10px] text-[#10B981] font-bold mt-3">
                  Read Thread &rarr;
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#0E0E0E]/40 border border-dashed border-[#1A1A1A] rounded-xl">
            <p className="text-xs text-[#555]">You haven't bookmarked any threads yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
