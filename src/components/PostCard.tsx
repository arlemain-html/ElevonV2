import React from "react";
import { Post } from "../types";
import { MessageSquare, ArrowBigUp, Bookmark, ShieldCheck, Tag } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onClick: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onBookmark, onClick }) => {
  const { address } = useWeb3();

  // Format short address if username is just address
  const formatAuthor = (author: string, authorName: string) => {
    if (authorName && authorName !== author) return authorName;
    return `${author.slice(0, 6)}...${author.slice(-4)}`;
  };

  const isAuthorSelf = address && address.toLowerCase() === post.author.toLowerCase();

  return (
    <div
      id={`post-card-${post.id}`}
      className="border border-[#1A1A1A] bg-[#0E0E0E] rounded-xl p-5 hover:border-[#333] hover:bg-[#111] transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden group"
      onClick={() => onClick(post)}
    >
      {/* Community banner accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981]/20 to-transparent group-hover:from-[#10B981] transition-all duration-300" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs text-[#888]">
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {/* Community Pill */}
          <span className="bg-[#111] text-[#10B981] px-2.5 py-0.5 rounded-full font-medium border border-[#222]">
            c/{post.communityId}
          </span>
          <span className="text-[#333]">•</span>
          {/* Author address/username */}
          <span className="flex items-center gap-1 font-mono text-[#E0E0E0] hover:text-white transition">
            {formatAuthor(post.author, post.authorName)}
            {post.authorVerified && (
              <ShieldCheck className="w-4 h-4 text-[#10B981] fill-[#10B981]/20" title="On-chain Verified Profile" />
            )}
          </span>
          {/* On-chain reputation badge */}
          <span className="bg-[#111] text-emerald-400 border border-[#222] px-1.5 py-0.5 rounded font-medium font-mono text-[10px]">
            {post.authorReputation} REP
          </span>
          {isAuthorSelf && (
            <span className="bg-[#1A1A1A] text-[#888] px-1.5 py-0.5 rounded text-[10px] border border-[#222]">
              You
            </span>
          )}
        </div>
        <span className="font-mono text-[#555] text-[10px]">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
          })}
        </span>
      </div>

      {/* Main Content */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#E0E0E0] group-hover:text-[#10B981] transition-colors duration-150 leading-snug mb-2 font-sans">
          {post.title}
        </h3>
        <p className="text-sm text-[#888] line-clamp-3 leading-relaxed whitespace-pre-line font-sans">
          {post.content}
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between border-t border-[#1A1A1A] pt-3 text-[#666]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          {/* Likes / Upvote */}
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-full border transition-all ${
              post.hasLiked
                ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                : "bg-[#111] text-[#666] border-[#222] hover:text-[#10B981] hover:border-[#10B981]/20 hover:bg-[#111]"
            }`}
          >
            <ArrowBigUp className={`w-4 h-4 ${post.hasLiked ? "fill-[#10B981]/20 text-[#10B981]" : ""}`} />
            <span>{post.likesCount}</span>
          </button>

          {/* Comments count indicator */}
          <div className="flex items-center gap-1.5 text-xs text-[#555] font-mono">
            <MessageSquare className="w-4 h-4 text-[#555]" />
            <span>{post.commentsCount} comments</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Icon */}
          <div className="flex items-center gap-1 text-[10px] bg-[#111] text-[#888] border border-[#222] px-2 py-1 rounded-full">
            <Tag className="w-3 h-3 text-[#555]" />
            <span>{post.category}</span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => onBookmark(post.id)}
            className={`p-1.5 rounded-full border transition-all ${
              post.hasBookmarked
                ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                : "bg-[#111] text-[#555] border-[#222] hover:text-[#10B981] hover:border-[#10B981]/20 hover:bg-[#111]"
            }`}
            title={post.hasBookmarked ? "Remove Bookmark" : "Bookmark Thread"}
          >
            <Bookmark className={`w-4 h-4 ${post.hasBookmarked ? "fill-[#10B981]/20 text-[#10B981]" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
