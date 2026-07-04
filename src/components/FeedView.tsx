import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { CONTRACT_ADDRESSES } from "../blockchain/contracts";
import { Post, Comment } from "../types";
import { PostCard } from "./PostCard";
import {
  INITIAL_COMMUNITIES,
  getStoredPosts,
  saveStoredPosts,
  getStoredComments,
  saveStoredComments,
  getStoredBookmarks,
  saveStoredBookmarks
} from "../lib/supabase";
import { PenTool, ArrowLeft, Send, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Tag, Bookmark, Edit3, Trash2, RefreshCw } from "lucide-react";

interface FeedViewProps {
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  searchQuery: string;
  initialCommunityId?: string;
  onClearCommunityFilter?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ selectedPost, setSelectedPost, searchQuery, initialCommunityId, onClearCommunityFilter }) => {
  const { isConnected, address, identity, stats, registerProfile, txStatus, txHash, updateProfileHashOnChain, isCorrectNetwork, awardXP } = useWeb3();

  // State management for posts
  const [posts, setPosts] = useState<Post[]>(() => {
    const loadedPosts = getStoredPosts();
    const loadedBookmarks = getStoredBookmarks();
    // Inject current bookmarks status
    return loadedPosts.map((p: any) => ({
      ...p,
      hasBookmarked: loadedBookmarks.includes(p.id)
    }));
  });

  // State management for comments
  const [comments, setComments] = useState<Comment[]>(() => getStoredComments());

  // Navigation / filtering states
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCommunity, setSelectedCategoryCommunity] = useState<string>("All");

  // Sync initialCommunityId with selectedCommunity
  React.useEffect(() => {
    if (initialCommunityId) {
      setSelectedCategoryCommunity(initialCommunityId);
    }
  }, [initialCommunityId]);

  // Publishing form states
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCommunity, setNewPostCommunity] = useState("base-builders");
  const [newPostCategory, setNewPostCategory] = useState("Tech & Dev");
  const [publishError, setPublishError] = useState<string | null>(null);

  // New Comment state
  const [newCommentText, setNewCommentText] = useState("");

  // Edit selected post states
  const [isEditingSelectedPost, setIsEditingSelectedPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCommunity, setEditCommunity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Delete post state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);

  const handleLike = (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        const hasLiked = !p.hasLiked;
        return {
          ...p,
          hasLiked,
          likesCount: p.likesCount + (hasLiked ? 1 : -1)
        };
      }
      return p;
    });
    setPosts(updated);
    saveStoredPosts(updated);

    // Update active viewed post if matching
    if (selectedPost && selectedPost.id === id) {
      setSelectedPost({
        ...selectedPost,
        hasLiked: !selectedPost.hasLiked,
        likesCount: selectedPost.likesCount + (!selectedPost.hasLiked ? 1 : -1)
      });
    }
  };

  const handleBookmark = (id: string) => {
    const updatedBookmarks = getStoredBookmarks();
    let newBookmarks = [...updatedBookmarks];

    if (newBookmarks.includes(id)) {
      newBookmarks = newBookmarks.filter((bId) => bId !== id);
    } else {
      newBookmarks.push(id);
    }
    saveStoredBookmarks(newBookmarks);

    const updatedPosts = posts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          hasBookmarked: newBookmarks.includes(p.id),
          bookmarksCount: p.bookmarksCount + (newBookmarks.includes(p.id) ? 1 : -1)
        };
      }
      return p;
    });
    setPosts(updatedPosts);
    saveStoredPosts(updatedPosts);

    // Update active viewed post if matching
    if (selectedPost && selectedPost.id === id) {
      const isBookmarked = newBookmarks.includes(selectedPost.id);
      setSelectedPost({
        ...selectedPost,
        hasBookmarked: isBookmarked,
        bookmarksCount: selectedPost.bookmarksCount + (isBookmarked ? 1 : -1)
      });
    }
  };

  // Publish Thread logic
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setPublishError("Please fill out both the title and message content.");
      return;
    }

    // User must be registered on-chain
    if (!isConnected || !identity?.registered) {
      setPublishError("On-chain registration is required to publish threads.");
      return;
    }

    if (!isCorrectNetwork) {
      setPublishError("Please switch to Base Mainnet to publish threads on-chain.");
      return;
    }

    try {
      setActionLoading(true);
      setPublishError(null);

      // Generate off-chain metadata representational hash
      const postHashStr = JSON.stringify({
        title: newPostTitle,
        content: newPostContent,
        communityId: newPostCommunity,
        category: newPostCategory,
        author: address,
        createdAt: new Date().toISOString()
      });
      const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(postHashStr));

      // Call smart contract to record this post hash as user's latest identity profile hash
      const success = await updateProfileHashOnChain(hashBytes);
      if (!success) {
        throw new Error("On-chain registration transaction was rejected or failed.");
      }

      const newPost: Post = {
        id: `post-${Date.now()}`,
        title: newPostTitle,
        content: newPostContent,
        author: address || "0x0000000000000000000000000000000000000000",
        authorName: address ? `${address.slice(0, 8)}...` : "Anonymous",
        authorReputation: stats ? Number(stats.reputation) : 10,
        authorVerified: identity ? identity.verified : false,
        communityId: newPostCommunity,
        category: newPostCategory,
        createdAt: new Date().toISOString(),
        likesCount: 1,
        commentsCount: 0,
        bookmarksCount: 0,
        hasLiked: true
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      saveStoredPosts(updated);

      // Reset Form and clear active filters to ensure the post is immediately visible
      setNewPostTitle("");
      setNewPostContent("");
      setPublishError(null);
      setShowPublishForm(false);
      setSelectedCategory("All");
      setSelectedCategoryCommunity("All");
      if (onClearCommunityFilter) {
        onClearCommunityFilter();
      }

      // Award XP for successful on-chain post publishing!
      await awardXP(500, 10);
    } catch (err: any) {
      console.error(err);
      setPublishError(err.message || "An error occurred while publishing.");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Thread logic
  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;

    if (!editTitle.trim() || !editContent.trim()) {
      setEditError("Please fill out both the title and message content.");
      return;
    }

    // Access control validation: user must be the author of the post
    if (!address || address.toLowerCase() !== selectedPost.author.toLowerCase()) {
      setEditError("Access Denied: Only the author of this post can edit it.");
      return;
    }

    if (!isCorrectNetwork) {
      setEditError("Please switch to Base Mainnet to record edits on-chain.");
      return;
    }

    try {
      setActionLoading(true);
      setEditError(null);

      // Generate updated off-chain metadata representational hash
      const postHashStr = JSON.stringify({
        title: editTitle,
        content: editContent,
        communityId: editCommunity,
        category: editCategory,
        author: address,
        editedAt: Date.now()
      });
      const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(postHashStr));

      // Call smart contract to record this updated post hash as user's latest identity profile hash
      const success = await updateProfileHashOnChain(hashBytes);
      if (!success) {
        throw new Error("On-chain edit registration transaction was rejected or failed.");
      }

      // Update posts array
      const updatedPosts = posts.map((p) => {
        if (p.id === selectedPost.id) {
          return {
            ...p,
            title: editTitle,
            content: editContent,
            communityId: editCommunity,
            category: editCategory
          };
        }
        return p;
      });

      setPosts(updatedPosts);
      saveStoredPosts(updatedPosts);

      // Update currently selected post state
      const updatedSelected: Post = {
        ...selectedPost,
        title: editTitle,
        content: editContent,
        communityId: editCommunity,
        category: editCategory
      };
      setSelectedPost(updatedSelected);

      setIsEditingSelectedPost(false);
      setEditError(null);
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || "An error occurred while saving edits.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Thread logic
  const handleDeletePost = async () => {
    if (!selectedPost) return;

    // Access control validation: user must be the author of the post
    if (!address || address.toLowerCase() !== selectedPost.author.toLowerCase()) {
      alert("Access Denied: Only the author of this post can delete it.");
      return;
    }

    if (!isCorrectNetwork) {
      alert("Please switch to Base Mainnet to record deletions on-chain.");
      return;
    }

    try {
      setActionLoading(true);

      // Record on-chain removal: update profile hash to a representational non-empty 'DELETED' hash
      const deletedHash = ethers.keccak256(ethers.toUtf8Bytes("DELETED"));
      const success = await updateProfileHashOnChain(deletedHash);
      if (!success) {
        throw new Error("On-chain deletion registration transaction was rejected or failed.");
      }

      // Filter out deleted post from posts array
      const updatedPosts = posts.filter((p) => p.id !== selectedPost.id);
      setPosts(updatedPosts);
      saveStoredPosts(updatedPosts);

      // Clear from bookmarks if bookmarked
      const updatedBookmarks = getStoredBookmarks().filter((id) => id !== selectedPost.id);
      saveStoredBookmarks(updatedBookmarks);

      // Return back to main feed
      setSelectedPost(null);
      setIsConfirmingDelete(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during deletion.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Comment logic
  const handlePublishComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedPost) return;

    if (!isConnected || !identity?.registered) {
      alert("On-chain registration is required to submit comments.");
      return;
    }

    if (!isCorrectNetwork) {
      alert("Please switch to Base Mainnet to record comments on-chain.");
      return;
    }

    try {
      setActionLoading(true);

      const commentHashStr = JSON.stringify({
        postId: selectedPost.id,
        content: newCommentText,
        author: address,
        createdAt: new Date().toISOString()
      });
      const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(commentHashStr));

      const success = await updateProfileHashOnChain(hashBytes);
      if (!success) {
        throw new Error("On-chain comment publication failed or was rejected.");
      }

      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        postId: selectedPost.id,
        author: address || "0x0000000000000000000000000000000000000000",
        authorName: address ? `${address.slice(0, 8)}...` : "GuestContributer",
        authorReputation: stats ? Number(stats.reputation) : 10,
        authorVerified: identity ? identity.verified : false,
        content: newCommentText,
        createdAt: new Date().toISOString()
      };

      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      saveStoredComments(updatedComments);

      // Increment commentsCount of current post
      const updatedPosts = posts.map((p) => {
        if (p.id === selectedPost.id) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1
          };
        }
        return p;
      });
      setPosts(updatedPosts);
      saveStoredPosts(updatedPosts);

      // Update active viewed post count
      setSelectedPost({
        ...selectedPost,
        commentsCount: selectedPost.commentsCount + 1
      });

      setNewCommentText("");

      // Award XP for comment
      await awardXP(200, 5);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while publishing comment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Posts
  const filteredPosts = posts.filter((post) => {
    // Search filter
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;

    // Community filter
    const matchesCommunity = selectedCommunity === "All" || post.communityId === selectedCommunity;

    return matchesSearch && matchesCategory && matchesCommunity;
  });

  // Unique categories
  const categories = ["All", "General", "Tech & Dev", "DAO & Governance", "NFTs & Art", "Market Discussion"];

  return (
    <div id="feed-container" className="space-y-6 max-w-5xl mx-auto py-2">
      {!selectedPost ? (
        <>
          {/* Top filtering controls / post launch button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0A0A]/50 p-4 rounded-xl border border-[#1A1A1A]">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filters */}
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedCategory === cat
                      ? "bg-[#1A1A1A] text-white border border-[#333]"
                      : "bg-[#0E0E0E] text-[#888] border border-transparent hover:text-white hover:bg-[#111]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setPublishError(null);
                setShowPublishForm(!showPublishForm);
              }}
              className="bg-[#10B981] hover:brightness-110 text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap self-start md:self-auto"
            >
              <PenTool className="w-3.5 h-3.5" />
              Publish Thread
            </button>
          </div>

          {/* Form to publish a thread */}
          {showPublishForm && (
            <div className="border border-[#1A1A1A] bg-[#0E0E0E] rounded-xl p-5 shadow-inner relative">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#10B981]" />
                Draft On-chain Verified Thread
              </h3>

              {!isConnected ? (
                <div className="bg-[#111] border border-[#222] p-4 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">Wallet Disconnected</p>
                    <p className="text-[11px] text-[#888]">
                      Connect your MetaMask/Web3 wallet first to verify your author address and reputation score.
                    </p>
                  </div>
                </div>
              ) : !identity?.registered ? (
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-500">Identity Not Registered On-Chain</p>
                      <p className="text-[11px] text-[#888] leading-relaxed">
                        By security protocol, ELEVON gates post publication on an active on-chain registration. Your wallet address `{address.slice(0, 10)}...` must register in the `ForumIdentityRegistry` before publishing.
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#111] p-2 border border-[#222] rounded font-mono text-[10px] text-[#555]">
                    Registry Address: {CONTRACT_ADDRESSES.ForumIdentityRegistry}
                  </div>
                  <div className="text-xs text-amber-500">
                    💡 Go to your **Profile Tab** and click &ldquo;Register Identity&rdquo; to execute the registration transaction.
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePublishPost} className="space-y-4">
                  {publishError && (
                    <div className="bg-rose-500/10 text-rose-400 text-xs p-3 rounded-lg border border-rose-500/20 font-medium">
                      {publishError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Target Community</label>
                      <select
                        value={newPostCommunity}
                        onChange={(e) => setNewPostCommunity(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-[#10B981]"
                      >
                        {INITIAL_COMMUNITIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            c/{c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Category tag</label>
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-[#10B981]"
                      >
                        {categories.filter((cat) => cat !== "All").map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Thread Title</label>
                    <input
                      type="text"
                      placeholder="Give your post a concise, clear title"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full bg-[#111] border border-[#222] text-sm rounded-lg p-3 text-slate-200 placeholder:text-[#555] focus:outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Message content (Markdown fully supported)</label>
                    <textarea
                      rows={5}
                      placeholder="Share your thoughts, Solidity snips, or Base DeFi alpha..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-[#111] border border-[#222] text-sm rounded-lg p-3 text-slate-200 placeholder:text-[#555] focus:outline-none focus:border-[#10B981] font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPublishForm(false)}
                      className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] px-4 py-2 rounded-full text-xs text-[#888] font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#10B981] hover:brightness-110 text-black px-5 py-2 rounded-full text-xs font-bold"
                    >
                      Publish to Feed
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Posts Feed Grid */}
          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onClick={setSelectedPost}
                />
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-[#1A1A1A] rounded-2xl bg-[#0E0E0E]/50">
                <p className="text-sm text-[#555]">No active threads found matching your filters.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Detailed Thread View */
        <div id="thread-detailed-view" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => {
                setSelectedPost(null);
                setIsEditingSelectedPost(false);
                setIsConfirmingDelete(false);
              }}
              className="inline-flex items-center gap-2 text-xs text-[#888] hover:text-white transition px-3 py-1.5 rounded-full border border-[#222] bg-[#111] self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to feed
            </button>

            {address && selectedPost.author.toLowerCase() === address.toLowerCase() && (
              <div className="flex items-center gap-2">
                {!isEditingSelectedPost && !isConfirmingDelete && (
                  <>
                    <button
                      onClick={() => {
                        setEditTitle(selectedPost.title);
                        setEditContent(selectedPost.content);
                        setEditCommunity(selectedPost.communityId);
                        setEditCategory(selectedPost.category);
                        setEditError(null);
                        setIsEditingSelectedPost(true);
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#111] hover:bg-[#1A1A1A] text-xs text-amber-500 font-semibold px-3 py-1.5 rounded-lg border border-[#222] transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Thread
                    </button>
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="inline-flex items-center gap-1.5 bg-[#111] hover:bg-rose-950/20 hover:text-rose-400 text-xs text-rose-500 font-semibold px-3 py-1.5 rounded-lg border border-[#222] transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Thread
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Confirm delete panel */}
          {isConfirmingDelete && (
            <div className="bg-rose-950/10 border border-rose-900/30 p-5 rounded-xl space-y-4 font-sans">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-400">Confirm Thread Deletion</h4>
                  <p className="text-xs text-[#888] leading-relaxed">
                    Are you absolutely sure you want to delete &ldquo;{selectedPost.title}&rdquo;? By proceeding, you will invoke an actual Base Mainnet blockchain transaction to clear this post's representational hash in the registry contract. This action is permanent.
                  </p>
                </div>
              </div>

              <div className="bg-[#111] p-3 border border-[#222] rounded font-mono text-[10px] text-[#555]">
                On-Chain Action: <code className="text-rose-400 font-bold">updateProfileHash(keccak256(&quot;DELETED&quot;))</code>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={actionLoading}
                  className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] px-4 py-2 rounded-full text-xs text-[#888] font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    "Confirm & Delete On-chain"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Edit post form panel */}
          {isEditingSelectedPost && (
            <div className="border border-[#1A1A1A] bg-[#0E0E0E] rounded-xl p-5 shadow-inner space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                Edit On-Chain Verified Thread
              </h3>

              <form onSubmit={handleEditPost} className="space-y-4">
                {editError && (
                  <div className="bg-rose-500/10 text-rose-400 text-xs p-3 rounded-lg border border-rose-500/20 font-medium">
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Target Community</label>
                    <select
                      value={editCommunity}
                      onChange={(e) => setEditCommunity(e.target.value)}
                      className="w-full bg-[#111] border border-[#222] text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-[#10B981]"
                    >
                      {INITIAL_COMMUNITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          c/{c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Category tag</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-[#111] border border-[#222] text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-[#10B981]"
                    >
                      {categories.filter((cat) => cat !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Thread Title</label>
                  <input
                    type="text"
                    placeholder="Give your post a concise, clear title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] text-sm rounded-lg p-3 text-slate-200 placeholder:text-[#555] focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#555] mb-1">Message content (Markdown fully supported)</label>
                  <textarea
                    rows={5}
                    placeholder="Share your thoughts, Solidity snips, or Base DeFi alpha..."
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] text-sm rounded-lg p-3 text-slate-200 placeholder:text-[#555] focus:outline-none focus:border-[#10B981] font-sans leading-relaxed"
                  />
                </div>

                <div className="bg-[#111] p-3 border border-[#222] rounded font-mono text-[10px] text-[#555]">
                  This edit will execute an on-chain transaction: <code className="text-amber-500 font-bold">updateProfileHash(newHash)</code> to register the edited thread proof on-chain.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSelectedPost(false)}
                    disabled={actionLoading}
                    className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] px-4 py-2 rounded-full text-xs text-[#888] font-bold font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#10B981] hover:brightness-110 text-black px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 font-sans"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Broadcasting...
                      </>
                    ) : (
                      "Save On-chain Edits"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Main Thread Card */}
          {!isEditingSelectedPost && !isConfirmingDelete && (
            <div className="border border-[#1A1A1A] bg-[#0E0E0E] p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs text-[#888]">
                <span className="bg-[#111] text-[#10B981] px-2.5 py-0.5 rounded-full font-medium border border-[#222]">
                  c/{selectedPost.communityId}
                </span>
                <span className="text-[#333]">•</span>
                <span className="flex items-center gap-1 font-mono text-[#E0E0E0]">
                  {selectedPost.author}
                  {selectedPost.authorVerified && (
                    <ShieldCheck className="w-4 h-4 text-[#10B981] fill-[#10B981]/10" />
                  )}
                </span>
                <span className="bg-[#111] text-emerald-400 border border-[#222] px-1.5 py-0.5 rounded font-medium font-mono text-[10px]">
                  {selectedPost.authorReputation} REP
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug font-sans">
                {selectedPost.title}
              </h2>

              <p className="text-[#888] whitespace-pre-line text-sm leading-relaxed border-l-2 border-[#222] pl-4 py-1">
                {selectedPost.content}
              </p>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-[#1A1A1A] pt-4 text-[#666]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-2 rounded-full border transition-all ${
                      selectedPost.hasLiked
                        ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                        : "bg-[#111] text-[#666] border-[#222] hover:text-[#10B981] hover:border-[#10B981]/20 hover:bg-[#111]"
                    }`}
                  >
                    <ArrowLeft className={`w-4 h-4 rotate-90 ${selectedPost.hasLiked ? "text-[#10B981]" : ""}`} />
                    <span>{selectedPost.likesCount} upvotes</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs text-[#555] bg-[#111] border border-[#222] px-2.5 py-1.5 rounded-full">
                    <Tag className="w-3.5 h-3.5 text-[#555]" />
                    <span>{selectedPost.category}</span>
                  </span>
                  
                  <button
                    onClick={() => handleBookmark(selectedPost.id)}
                    className={`p-2 rounded-full border transition-all ${
                      selectedPost.hasBookmarked
                        ? "bg-emerald-500/10 text-[#10B981] border-[#10B981]/20"
                        : "bg-[#111] text-[#555] border-[#222] hover:text-[#10B981] hover:border-[#10B981]/20"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${selectedPost.hasBookmarked ? "fill-[#10B981]/20" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Comments ({selectedPost.commentsCount})</h3>

            {/* Comment Form */}
            {isConnected ? (
              <form onSubmit={handlePublishComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Join the discussion... write a comment"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-[#111] border border-[#222] text-sm rounded-xl p-3 text-slate-200 placeholder:text-[#555] focus:outline-none focus:border-[#10B981]"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="bg-[#10B981] hover:brightness-110 disabled:opacity-40 text-black px-4 rounded-full transition flex items-center justify-center font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="text-center py-4 bg-[#0E0E0E] border border-[#1A1A1A] rounded-xl text-xs text-[#555]">
                You must connect your Web3 wallet to comment.
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 pl-2 border-l border-[#1A1A1A]">
              {comments.filter((c) => c.postId === selectedPost.id).length > 0 ? (
                comments
                  .filter((c) => c.postId === selectedPost.id)
                  .map((comment) => (
                    <div key={comment.id} className="bg-[#0E0E0E]/50 border border-[#1A1A1A] p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-300 font-semibold text-[11px]">
                            {comment.authorName}
                          </span>
                          {comment.authorVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] fill-[#10B981]/10" />
                          )}
                          <span className="bg-[#111] text-emerald-400 border border-[#222] px-1 py-0.2 rounded font-mono text-[9px]">
                            {comment.authorReputation} REP
                          </span>
                        </div>
                        <span className="text-[10px] text-[#555] font-mono">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#888] leading-relaxed font-sans">{comment.content}</p>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-xs text-[#555]">
                  No comments yet. Be the first to start the conversation!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
