import React, { useState } from "react";
import { INITIAL_COMMUNITIES } from "../lib/supabase";
import { ShieldAlert, Users, MessageSquare, ArrowRight, Tag } from "lucide-react";

interface CommunitiesViewProps {
  onSelectCommunity: (communityId: string) => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({ onSelectCommunity }) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(() => {
    const joined = localStorage.getItem("elevon_joined_communities");
    return joined ? JSON.parse(joined) : ["base-builders", "elevon-dao"]; // Default joined
  });

  const categories = ["All", "Tech & Dev", "DAO & Governance", "NFTs & Art", "Market Discussion"];

  const handleToggleJoin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (joinedCommunities.includes(id)) {
      updated = joinedCommunities.filter((cId) => cId !== id);
    } else {
      updated = [...joinedCommunities, id];
    }
    setJoinedCommunities(updated);
    localStorage.setItem("elevon_joined_communities", JSON.stringify(updated));
  };

  const filteredCommunities = INITIAL_COMMUNITIES.filter(
    (c) => activeCategory === "All" || c.category === activeCategory
  );

  return (
    <div id="communities-view" className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Description header */}
      <div className="bg-[#0A0A0A] p-5 rounded-xl border border-[#1A1A1A] flex items-start gap-4">
        <div className="p-3 bg-[#10B981]/5 text-[#10B981] border border-[#10B981]/15 rounded-xl shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Browse Guilds</h2>
          <p className="text-xs text-[#888] leading-relaxed">
            Guilds are specialized community pools focusing on builders, developers, creators, or stakers. Joining a community lets you post threads inside, view curated content, and unlock customized soulbound achievements.
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap pb-3 border-b border-[#1A1A1A]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeCategory === cat
                ? "bg-[#1A1A1A] text-white border border-[#333]"
                : "bg-[#0E0E0E] text-[#888] border border-transparent hover:text-white hover:bg-[#111]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCommunities.map((community) => {
          const isJoined = joinedCommunities.includes(community.id);
          
          return (
            <div
              key={community.id}
              onClick={() => onSelectCommunity(community.id)}
              className="group border border-[#1A1A1A] bg-[#0E0E0E] hover:border-[#333] rounded-xl overflow-hidden transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
            >
              {/* Card Banner */}
              <div className={`h-12 bg-gradient-to-r ${community.bannerColor} relative opacity-85 group-hover:opacity-100 transition-opacity`}>
                <div className="absolute top-3 left-4 text-[10px] uppercase font-bold text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 font-mono">
                  {community.category}
                </div>
              </div>

              {/* Card Info */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#10B981] transition-colors">
                    c/{community.name}
                  </h3>
                  <p className="text-xs text-[#888] leading-relaxed">
                    {community.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#555] pt-3 border-t border-[#111]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#555]" />
                    {community.memberCount.toLocaleString()} builders
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#555]" />
                    {community.postsCount} threads
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 bg-[#0A0A0A] border-t border-[#1A1A1A] flex items-center justify-between">
                <button
                  onClick={(e) => handleToggleJoin(community.id, e)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${
                    isJoined
                      ? "bg-[#111] text-[#888] border-[#222] hover:bg-rose-950/15 hover:text-rose-400 hover:border-rose-900/30"
                      : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/15 hover:bg-[#10B981] hover:text-black"
                  }`}
                >
                  {isJoined ? "Leave Guild" : "Join Guild"}
                </button>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] group-hover:translate-x-0.5 transition-transform duration-150">
                  Enter Guild
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
