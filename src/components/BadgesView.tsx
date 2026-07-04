import React, { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Award, Lock, ShieldCheck, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { CONTRACT_ADDRESSES } from "../blockchain/contracts";

export const BadgesView: React.FC = () => {
  const { isConnected, badgesAndAchievements, stats, claimBadgeOnChain, isCorrectNetwork } = useWeb3();
  const [mintingId, setMintingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const level = stats ? Number(stats.level) : 1;
  const reputation = stats ? Number(stats.reputation) : 0;
  const xp = stats ? Number(stats.xp) : 0;

  // Reference definition of all possible badges in Elevon L2
  const ALL_BADGES = [
    {
      id: "2",
      name: "First Spark Badge",
      description: "Claimed after registering an Identity and publishing your first thread.",
      image: "https://i.imgur.com/gK6Bf2I.png",
      type: "badge",
      howToUnlock: "Create your on-chain identity profile to reach Contribution Level 2 (2,500 XP)."
    },
    {
      id: "1",
      name: "Verified Contributor",
      description: "Awarded to verified builders with validated on-chain contributions.",
      image: "https://i.imgur.com/G9Lsh6Q.png",
      type: "badge",
      howToUnlock: "Reach Contribution Level 3 (10,000 XP) to request this official on-chain checkmark."
    },
    {
      id: "3",
      name: "Community Architect",
      description: "Elected for outstanding reputation metrics exceeding 150 points.",
      image: "https://i.imgur.com/z4bW9Ww.png",
      type: "badge",
      howToUnlock: "Maintain constructive threads until your on-chain reputation stats exceed 150 REP."
    },
    {
      id: "102",
      name: "Level 5 Milestones",
      description: "Successfully unlocked once experience points exceed 50,000 XP.",
      image: "https://i.imgur.com/97y4wG4.png",
      type: "achievement",
      howToUnlock: "Increase your contribution level to LVL 5 (50,000 XP)."
    },
    {
      id: "101",
      name: "Genesis Member Achievement",
      description: "Minted to users who verified their profiles during early beta registry blocks.",
      image: "https://i.imgur.com/97y4wG4.png",
      type: "achievement",
      howToUnlock: "Available during early beta testing. Requires Level 1+."
    },
    {
      id: "4",
      name: "Global Guardian",
      description: "Special moderator privileges activated directly by smart contracts.",
      image: "https://i.imgur.com/f9Gg1rR.png",
      type: "badge",
      howToUnlock: "Granted directly by community admins for active moderation guilds."
    }
  ];

  // Helper to determine eligibility for each badge
  const getEligibilityInfo = (badgeId: string) => {
    if (!isConnected) {
      return { eligible: false, reqMessage: "Connect wallet to view requirements", currentMessage: "" };
    }

    switch (badgeId) {
      case "2": // First Spark Badge
        return {
          eligible: level >= 2,
          reqMessage: "Requires Contribution Level 2 (2,500+ XP)",
          currentMessage: `Currently Level ${level} (${xp.toLocaleString()} XP)`
        };
      case "1": // Verified Contributor
        return {
          eligible: level >= 3,
          reqMessage: "Requires Contribution Level 3 (10,000+ XP)",
          currentMessage: `Currently Level ${level} (${xp.toLocaleString()} XP)`
        };
      case "3": // Community Architect
        return {
          eligible: reputation >= 150,
          reqMessage: "Requires Reputation >= 150 REP",
          currentMessage: `Currently ${reputation} REP`
        };
      case "102": // Level 5 Milestones
        return {
          eligible: level >= 5,
          reqMessage: "Requires Contribution Level 5 (50,000+ XP)",
          currentMessage: `Currently Level ${level} (${xp.toLocaleString()} XP)`
        };
      case "101": // Genesis Member
        return {
          eligible: level >= 1,
          reqMessage: "Requires Level 1+ Registry Status",
          currentMessage: `Currently Level ${level}`
        };
      case "4": // Global Guardian
        return {
          eligible: false, // Moderation granted
          reqMessage: "Granted directly to active DAO moderators",
          currentMessage: "Requires admin role assignment"
        };
      default:
        return { eligible: false, reqMessage: "", currentMessage: "" };
    }
  };

  const handleMintBadge = async (badgeIdStr: string) => {
    const badgeId = parseInt(badgeIdStr, 10);
    if (isNaN(badgeId)) return;

    if (!isCorrectNetwork) {
      setMessage({ type: "error", text: "Please switch to Base network before minting." });
      return;
    }

    setMintingId(badgeIdStr);
    setMessage(null);

    try {
      const success = await claimBadgeOnChain(badgeId);
      if (success) {
        setMessage({
          type: "success",
          text: `🎉 Soulbound Token Badge #${badgeId} claimed & minted successfully on-chain! +1,000 XP granted.`
        });
      } else {
        setMessage({
          type: "error",
          text: "Transaction failed or was rejected. Please try again."
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setMintingId(null);
    }
  };

  return (
    <div id="badges-view" className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Informational intro */}
      <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#1A1A1A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#10B981]/5 text-[#10B981] border border-[#10B981]/15 rounded-xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Soulbound Badges & Achievements</h2>
            <p className="text-xs text-[#888] leading-relaxed font-sans max-w-2xl">
              Badges are issued as ERC1155 Soulbound Tokens (SBTs) on Base. Because SBTs are non-transferable, they permanently represent your unique identity, skills, and status. They cannot be sold, traded, or bought.
            </p>
          </div>
        </div>
        <div className="bg-[#111] px-4 py-2.5 rounded-lg border border-[#222] text-right shrink-0">
          <span className="text-[10px] text-[#555] block font-mono uppercase">Your Stats</span>
          <span className="text-xs font-bold text-[#10B981] font-mono">
            LVL {level} • {xp.toLocaleString()} XP • {reputation} REP
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-sans ${
            message.type === "success"
              ? "bg-[#10B981]/5 border-[#10B981]/25 text-[#10B981]"
              : "bg-red-500/5 border-red-500/25 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Grid of badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {ALL_BADGES.map((badge) => {
          // Check if user owns it
          const owned = isConnected && badgesAndAchievements.some((b) => b.id === badge.id);
          const userBalance = isConnected ? (badgesAndAchievements.find((b) => b.id === badge.id)?.balance || 0) : 0;
          
          // Get eligibility status
          const eligibility = getEligibilityInfo(badge.id);

          return (
            <div
              key={badge.id}
              className={`relative rounded-xl border p-5 flex flex-col justify-between space-y-4 transition ${
                owned
                  ? "bg-[#0E0E0E] border-[#10B981]/35 ring-1 ring-[#10B981]/10"
                  : eligibility.eligible
                  ? "bg-[#0E0E0E] border-yellow-500/35 ring-1 ring-yellow-500/10"
                  : "bg-[#0E0E0E]/40 border-[#1A1A1A]/60 opacity-60"
              }`}
            >
              {/* Status Ribbon */}
              <div className="flex items-center justify-between">
                <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                  badge.type === "badge"
                    ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/15"
                    : "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                }`}>
                  {badge.type}
                </span>

                {owned ? (
                  <span className="flex items-center gap-1 text-[10px] text-[#10B981] font-mono font-bold bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Minted & Active
                  </span>
                ) : eligibility.eligible ? (
                  <span className="flex items-center gap-1 text-[10px] text-yellow-500 font-mono font-bold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    Eligible to Claim
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-[#555] font-mono bg-[#111] px-2 py-0.5 rounded-full border border-[#222]">
                    <Lock className="w-3.5 h-3.5 text-[#555]" />
                    Locked
                  </span>
                )}
              </div>

              {/* Graphic Logo representation */}
              <div className="flex justify-center py-4 relative">
                {/* Glow ring under owned/eligible badge */}
                {owned && (
                  <div className="absolute inset-0 bg-[#10B981]/10 blur-xl rounded-full scale-75 animate-pulse" />
                )}
                {!owned && eligibility.eligible && (
                  <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full scale-75 animate-pulse" />
                )}
                <div className={`w-16 h-12 flex items-center justify-center rounded-xl bg-[#111] border ${
                  owned 
                    ? "border-[#10B981]/40 text-[#10B981]" 
                    : eligibility.eligible
                    ? "border-yellow-500/40 text-yellow-500"
                    : "border-[#222] text-[#555]"
                }`}>
                  <Award className={`w-8 h-8 ${owned || eligibility.eligible ? "animate-pulse" : ""}`} />
                </div>
              </div>

              {/* Text Info */}
              <div className="space-y-1.5 text-center">
                <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1">
                  {badge.name}
                  {badge.id === "1" && owned && (
                    <span className="text-[#10B981]" title="Verified Checkmark">✓</span>
                  )}
                </h3>
                <p className="text-[11px] text-[#888] leading-normal">{badge.description}</p>
              </div>

              {/* Action/Instructions */}
              <div className="pt-3 border-t border-[#1A1A1A] text-center">
                {owned ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#10B981] font-mono block">Owned Balance: {userBalance} SBT</span>
                    <a
                      href={`https://basescan.org/token/${CONTRACT_ADDRESSES.SoulboundReputationTokens}?a=${badge.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] text-[#888] hover:text-white font-bold transition"
                    >
                      Verify on Explorer
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                ) : eligibility.eligible ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#888] leading-snug">
                      🎉 Requirement met! Claim your Soulbound Token on-chain.
                    </p>
                    <button
                      onClick={() => handleMintBadge(badge.id)}
                      disabled={mintingId !== null}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      {mintingId === badge.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Minting SBT...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Mint Soulbound Token
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <div className="text-[10px] text-[#555] italic leading-snug">
                      🔒 {badge.howToUnlock}
                    </div>
                    {eligibility.reqMessage && (
                      <span className="text-[9px] text-[#666] font-mono block mt-1">
                        {eligibility.reqMessage} ({eligibility.currentMessage})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
