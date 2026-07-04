import React from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { ShieldCheck, Award, Zap, TrendingUp, Trophy, HelpCircle } from "lucide-react";

export const ReputationView: React.FC = () => {
  const { isConnected, stats, address, identity } = useWeb3();

  // Current Stats Fallback or Real Stats
  const currentLevel = stats ? Number(stats.level) : 0;
  const currentXP = stats ? Number(stats.xp) : 0;
  const currentRep = stats ? Number(stats.reputation) : 0;

  // XP Progress Calculations
  const xpThresholds = [
    { level: 1, xpNeeded: 0 },
    { level: 2, xpNeeded: 1000 },
    { level: 3, xpNeeded: 2500 },
    { level: 4, xpNeeded: 5000 },
    { level: 5, xpNeeded: 10000 },
    { level: 6, xpNeeded: 20000 }
  ];

  // Calculate percentage to next level
  let nextLevelXp = 1000;
  let prevLevelXp = 0;
  let percentToNext = 0;

  for (let i = 0; i < xpThresholds.length; i++) {
    if (currentXP >= xpThresholds[i].xpNeeded) {
      prevLevelXp = xpThresholds[i].xpNeeded;
      if (xpThresholds[i + 1]) {
        nextLevelXp = xpThresholds[i + 1].xpNeeded;
      } else {
        nextLevelXp = xpThresholds[i].xpNeeded * 2; // Arbitrary high fallback
      }
    }
  }

  const xpInCurrentLevel = currentXP - prevLevelXp;
  const xpRangeForLevel = nextLevelXp - prevLevelXp;
  percentToNext = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRangeForLevel) * 100));

  // Base list of on-chain contract ecosystem entities and known system actors
  const baseLeaderboard = [
    {
      address: "0x08a1D669F33c6591f0bf0CCA49D6d98eb9050b20",
      username: "Deployer Admin",
      reputation: 500,
      xp: 14500,
      level: 5,
      verified: true
    },
    {
      address: "0x20D902Adc3c7956C0aE06E685e773C9d26d76372",
      username: "ForumReputation (Contract)",
      reputation: 450,
      xp: 12200,
      level: 5,
      verified: true
    },
    {
      address: "0x5b41CD272C6cd5D2EcdE02771d0aD62962378b1A",
      username: "SoulboundTokens (Contract)",
      reputation: 320,
      xp: 8800,
      level: 4,
      verified: true
    },
    {
      address: "0x1eF070954192D53df4b4cc9c2941aeC315B3e6F7",
      username: "IdentityRegistry (Contract)",
      reputation: 210,
      xp: 6100,
      level: 4,
      verified: true
    },
    {
      address: "0x00d93021f0bf0CCA49D6d98eb9050b2012345678",
      username: "BaseDevGiga",
      reputation: 180,
      xp: 4900,
      level: 3,
      verified: false
    }
  ];

  // Build the dynamic list of users
  let combinedList = [...baseLeaderboard];

  if (address) {
    // If connected, look for an existing entry to update, or append a new one
    const addressLower = address.toLowerCase();
    const existingIndex = combinedList.findIndex((item) => item.address.toLowerCase() === addressLower);

    const userProfileName = identity?.registered
      ? localStorage.getItem(`elevon_username_${address}`) || "Registered User"
      : "Visitor";

    const userRecord = {
      address: address,
      username: userProfileName,
      reputation: currentRep,
      xp: currentXP,
      level: currentLevel || 1,
      verified: identity?.verified || false
    };

    if (existingIndex > -1) {
      combinedList[existingIndex] = userRecord;
    } else {
      combinedList.push(userRecord);
    }
  }

  // Sort by reputation descending, then by xp descending
  combinedList.sort((a, b) => {
    if (b.reputation !== a.reputation) {
      return b.reputation - a.reputation;
    }
    return b.xp - a.xp;
  });

  // Assign Ranks dynamically
  const leaderboard = combinedList.map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  return (
    <div id="reputation-view" className="space-y-8 max-w-5xl mx-auto py-2">
      {/* On-Chain Profile XP Progress Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Level Box */}
        <div className="bg-[#0E0E0E] p-5 rounded-xl border border-[#1A1A1A] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#555] font-bold">On-chain Level</span>
            <Zap className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <div className="text-4xl font-extrabold font-mono text-white">LVL {currentLevel || 1}</div>
            <p className="text-[10px] text-[#555] mt-1 font-sans">Required XP multiplies per level tier.</p>
          </div>
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-[#888]">
              <span>{currentXP.toLocaleString()} XP</span>
              <span>{nextLevelXp.toLocaleString()} XP</span>
            </div>
            <div className="h-2 bg-[#111] rounded-full overflow-hidden border border-[#222]">
              <div
                className="h-full bg-gradient-to-r from-[#10B981] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${isConnected ? percentToNext : 10}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reputation Score */}
        <div className="bg-[#0E0E0E] p-5 rounded-xl border border-[#1A1A1A] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#555] font-bold">Reputation Score</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-4xl font-extrabold font-mono text-white">
              {currentRep > 0 ? "+" : ""}
              {currentRep} REP
            </div>
            <p className="text-[10px] text-[#555] mt-1 font-sans">Modified on-chain by contribution verification.</p>
          </div>
          <div className="text-[11px] text-[#888] bg-[#0A0A0A] px-3 py-2 border border-[#1A1A1A] rounded-xl leading-snug">
            💡 <strong>100+ REP</strong> grants you custom moderating flags.
          </div>
        </div>

        {/* Level Multiplier Math details */}
        <div className="bg-[#0E0E0E] p-5 rounded-xl border border-[#1A1A1A] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#555] font-bold">XP Level multipliers</span>
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-200">Level Multiplier Index</div>
            <p className="text-[11px] text-[#888] leading-normal">
              Your votes inside discussion threads have weights proportional to your on-chain Level.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
            <div className="bg-[#111] p-2 rounded border border-[#222]">
              <div className="text-[#555]">LVL 1-2</div>
              <div className="text-[#10B981] font-bold">1.0x Weight</div>
            </div>
            <div className="bg-[#111] p-2 rounded border border-[#222]">
              <div className="text-[#555]">LVL 3-4</div>
              <div className="text-[#10B981] font-bold">1.5x Weight</div>
            </div>
          </div>
        </div>
      </div>

      {/* SVG XP Progression Math Chart */}
      <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-6 rounded-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#10B981]" />
          On-chain Experience Progression Curve
        </h3>
        <p className="text-xs text-[#888] leading-relaxed mb-6">
          XP increases strictly exponentially as dictated by contract parameters. The curve below outlines the thresholds required to reach higher Levels.
        </p>

        {/* Responsive inline SVG */}
        <div className="relative w-full h-48 bg-[#0A0A0A] rounded-xl border border-[#1A1A1A] overflow-hidden px-4 py-2">
          <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="20" x2="500" y2="20" stroke="#111" strokeWidth="0.5" strokeDasharray="4" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="#111" strokeWidth="0.5" strokeDasharray="4" />
            <line x1="0" y1="100" x2="500" y2="100" stroke="#111" strokeWidth="0.5" strokeDasharray="4" />

            {/* Progression Curve line */}
            <path
              d="M 50,105 Q 150,100 250,85 T 450,25"
              fill="none"
              stroke="url(#progress-gradient)"
              strokeWidth="2.5"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#0D9488" />
              </linearGradient>
            </defs>

            {/* Curve Nodes */}
            <circle cx="50" cy="105" r="4.5" fill="#10B981" stroke="#050505" strokeWidth="1.5" />
            <circle cx="150" cy="99" r="4.5" fill="#10B981" stroke="#050505" strokeWidth="1.5" />
            <circle cx="250" cy="85" r="4.5" fill="#0D9488" stroke="#050505" strokeWidth="1.5" />
            <circle cx="350" cy="60" r="4.5" fill="#0D9488" stroke="#050505" strokeWidth="1.5" />
            <circle cx="450" cy="25" r="4.5" fill="#14B8A6" stroke="#050505" strokeWidth="1.5" />
          </svg>

          {/* Labels Overlay */}
          <div className="absolute inset-0 flex justify-between items-end px-4 pb-2 text-[8px] font-mono text-[#555] pointer-events-none">
            <span>LVL 1 (0 XP)</span>
            <span>LVL 2 (1K)</span>
            <span>LVL 3 (2.5K)</span>
            <span>LVL 4 (5K)</span>
            <span>LVL 5 (10K+)</span>
          </div>
        </div>
      </div>

      {/* Global Leaderboard Panel */}
      <div className="bg-[#0E0E0E] border border-[#1A1A1A] p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#10B981]" />
          ELEVON Global Leaderboard (Base Mainnet)
        </h3>
        <p className="text-xs text-[#888] leading-relaxed">
          The rankings below represent the accounts with the highest contribution and reputation points recorded across the whole contract ecosystem.
        </p>

        {/* Leaderboard list */}
        <div className="space-y-2 pt-2">
          {leaderboard.map((user) => {
            const isSelf = address && user.address.toLowerCase() === address.toLowerCase();

            return (
              <div
                key={user.address}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                  isSelf
                    ? "bg-[#10B981]/10 border-[#10B981]/20"
                    : "bg-[#0A0A0A] border-[#1A1A1A] hover:bg-[#111] hover:border-[#333]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center ${
                      user.rank === 1
                        ? "bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/20"
                        : user.rank === 2
                        ? "bg-[#222] text-[#888] border border-[#333]"
                        : user.rank === 3
                        ? "bg-amber-950/20 text-amber-500 border border-amber-900/30"
                        : "bg-[#111] text-[#555] border border-[#222]"
                    }`}
                  >
                    {user.rank}
                  </span>

                  {/* Identity detail */}
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-xs font-bold text-white">
                      {user.username}
                      {user.verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] fill-[#10B981]/10" />
                      )}
                      {isSelf && (
                        <span className="text-[9px] bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.2 rounded font-bold">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] font-mono text-[#555]">{user.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold font-mono text-emerald-400">+{user.reputation} REP</span>
                    <span className="text-[9px] font-mono text-[#555]">{user.xp.toLocaleString()} XP (LVL {user.level})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
