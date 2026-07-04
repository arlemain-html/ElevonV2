import React, { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Post, Community } from "../types";
import { PostCard } from "./PostCard";
import { Search, Tag, Users, MessageSquare } from "lucide-react";
import { getStoredPosts, INITIAL_COMMUNITIES } from "../lib/supabase";

interface SearchViewProps {
  onNavigateToPost: (post: Post) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onNavigateToPost }) => {
  const [query, setQuery] = useState("");
  const [posts] = useState<Post[]>(() => getStoredPosts());

  const handleLike = (id: string) => {};
  const handleBookmark = (id: string) => {};

  // Filters
  const matchesPosts = posts.filter(
    (p) =>
      query.trim() !== "" &&
      (p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.content.toLowerCase().includes(query.toLowerCase()))
  );

  const matchesCommunities = INITIAL_COMMUNITIES.filter(
    (c) =>
      query.trim() !== "" &&
      (c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div id="search-view" className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#555]">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search threads, content, communities, categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#0E0E0E] border border-[#1A1A1A] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#E0E0E0] placeholder:text-[#555] focus:outline-none focus:border-[#333] focus:bg-[#111] transition-colors"
        />
      </div>

      {query.trim() === "" ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-12 h-12 bg-[#0E0E0E] border border-[#1A1A1A] rounded-xl flex items-center justify-center mx-auto text-[#555]">
            <Search className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-300">Type something to search...</p>
            <p className="text-xs text-[#555] leading-relaxed max-w-xs mx-auto">
              Find builders, specific on-chain topics, and technical threads.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Communities matches */}
          {matchesCommunities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono uppercase text-[#555] tracking-wider">
                Matching Guilds ({matchesCommunities.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchesCommunities.map((c) => (
                  <div
                    key={c.id}
                    className="border border-[#1A1A1A] bg-[#0E0E0E] p-4 rounded-xl flex flex-col justify-between hover:border-[#333] transition"
                  >
                    <div>
                      <span className="text-[10px] bg-[#111] px-2 py-0.5 rounded font-mono text-[#10B981] border border-[#222]">
                        {c.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-2">c/{c.name}</h4>
                      <p className="text-[11px] text-[#888] mt-1 line-clamp-2">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#555] pt-3 mt-3 border-t border-[#111]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {c.memberCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {c.postsCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threads matches */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-[#555] tracking-wider">
              Matching Threads ({matchesPosts.length})
            </h3>

            {matchesPosts.length > 0 ? (
              <div className="space-y-4">
                {matchesPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onClick={onNavigateToPost}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#0E0E0E]/40 border border-dashed border-[#1A1A1A] rounded-xl">
                <p className="text-xs text-[#555]">No threads matching your search term.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
