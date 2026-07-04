import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://njandjtkbzdttvstnrms.supabase.co";
const supabaseAnonKey = "sb_publishable_nqUNCQwyz0bTSLU67GfrkQ_lHWltN5k";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// We define a fallback offline persistence storage layer to store real state
// when DB tables aren't fully set up or we are running in an uninitialized workspace environment.
// This implements a robust local cache engine that mirrors the off-chain data perfectly.
const DEFAULT_CATEGORIES = ["General", "Tech & Dev", "DAO & Governance", "NFTs & Art", "Market Discussion"];

export const INITIAL_COMMUNITIES = [
  {
    id: "base-builders",
    name: "Base Builders",
    description: "Hub for builders, protocols, and developers crafting on Base L2.",
    category: "Tech & Dev",
    memberCount: 1450,
    postsCount: 320,
    bannerColor: "from-blue-600 to-indigo-700"
  },
  {
    id: "elevon-dao",
    name: "ELEVON Governance",
    description: "The official space for ELEVON dApp updates, proposals, and governance votes.",
    category: "DAO & Governance",
    memberCount: 890,
    postsCount: 145,
    bannerColor: "from-purple-600 to-pink-700"
  },
  {
    id: "alpha-calls",
    name: "Base Alpha Discussion",
    description: "DeFi protocols, farming, staking, and market discussion on Base.",
    category: "Market Discussion",
    memberCount: 2100,
    postsCount: 512,
    bannerColor: "from-emerald-600 to-teal-700"
  },
  {
    id: "base-nfts",
    name: "Base NFT & Creative Guild",
    description: "Showcasing generative art, music, collectibles, and creators on Base.",
    category: "NFTs & Art",
    memberCount: 650,
    postsCount: 88,
    bannerColor: "from-amber-500 to-orange-600"
  }
];

export const INITIAL_POSTS = [
  {
    id: "post-1",
    title: "Introducing ELEVON - Web3 Social Forum with On-Chain Reputation System",
    content: "We are thrilled to launch the beta version of ELEVON on Base Mainnet! By combining on-chain Identity Registries, Soulbound XP tokens, and real-time off-chain feed, we are building a truly meritocratic social space. Users earn XP and Reputation dynamically based on verified contributions, avoiding bots and rewarding real builders.\n\nConnect your MetaMask, register your profile, and start contributing to base communities to unlock achievements! Let us know your feedback below.",
    author: "0x08a1D669F33c6591f0bf0CCA49D6d98eb9050b20",
    authorName: "Deployer Admin",
    authorReputation: 500,
    authorVerified: true,
    communityId: "elevon-dao",
    category: "DAO & Governance",
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    likesCount: 42,
    commentsCount: 3,
    bookmarksCount: 12
  },
  {
    id: "post-2",
    title: "How to integrate ForumIdentityRegistry inside your custom Smart Contracts",
    content: "If you are a developer on Base, you can plug into our `ForumIdentityRegistry` to verify if a user has specific achievements, holds active badges, or has a verified checkmark (Badge ID 1).\n\nHere is a simple example in Solidity:\n```solidity\nimport \"./interfaces/IForumIdentityRegistry.sol\";\n\ncontract MyGatedApp {\n    IForumIdentityRegistry public registry;\n    \n    constructor(address _registry) {\n        registry = IForumIdentityRegistry(_registry);\n    }\n    \n    function doSomethingGated() external {\n        require(registry.identityOf(msg.sender).verified, \"Not verified\");\n        // do gated logic\n    }\n}\n```\nLet us know if you want to collaborate!",
    author: "0x20D902Adc3c7956C0aE06E685e773C9d26d76372",
    "authorName": "ReputationOperator",
    "reputation": 450,
    "level": 5,
    "verified": true,
    communityId: "base-builders",
    category: "Tech & Dev",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
    likesCount: 28,
    commentsCount: 1,
    bookmarksCount: 9
  },
  {
    id: "post-3",
    title: "The power of Soulbound Badge Tokens on Base L2",
    content: "Soulbound tokens (SBTs) are non-transferable NFTs designed to represent a person's identity and credentials. In ELEVON, they represent achievements like 'First Thread', 'Reputation Master', or 'Community Mod'. Because they are non-transferable, reputation can never be bought or sold - only earned.\n\nWhat are your thoughts on using ERC1155 soulbound tokens instead of ERC721?",
    author: "0x5b41CD272C6cd5D2EcdE02771d0aD62962378b1A",
    authorName: "SoulboundRegistry",
    authorReputation: 320,
    authorVerified: true,
    communityId: "base-builders",
    category: "Tech & Dev",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    likesCount: 19,
    commentsCount: 2,
    bookmarksCount: 4
  }
];

export const INITIAL_COMMENTS = [
  {
    id: "comment-1",
    postId: "post-1",
    author: "0x1234567890123456789012345678901234567890",
    authorName: "BaseDegenerate",
    authorReputation: 120,
    authorVerified: false,
    content: "This is super clean! Gas is so cheap on Base, registering profiles on-chain is incredibly smooth. Excited to be part of the future of Web3 social media.",
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: "comment-2",
    postId: "post-1",
    author: "0x2345678901234567890123456789012345678901",
    authorName: "EthDevBase",
    authorReputation: 300,
    authorVerified: true,
    content: "Solid architecture guys. Pluggable identity is exactly what Base builders need to gate community perks or airdrop criteria based on contribution.",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: "comment-3",
    postId: "post-2",
    author: "0x08a1D669F33c6591f0bf0CCA49D6d98eb9050b20",
    authorName: "Deployer Admin",
    authorReputation: 500,
    authorVerified: true,
    content: "Great guide! We will deploy some npm libraries to make custom Solidity gating even easier for third-party developers.",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

// Helper to load/save offline posts to LocalStorage so changes persist during testing in current session
export function getStoredPosts() {
  const postsStr = localStorage.getItem("elevon_posts");
  if (!postsStr) {
    localStorage.setItem("elevon_posts", JSON.stringify(INITIAL_POSTS));
    return INITIAL_POSTS;
  }
  return JSON.parse(postsStr);
}

export function saveStoredPosts(posts: any[]) {
  localStorage.setItem("elevon_posts", JSON.stringify(posts));
}

export function getStoredComments() {
  const commentsStr = localStorage.getItem("elevon_comments");
  if (!commentsStr) {
    localStorage.setItem("elevon_comments", JSON.stringify(INITIAL_COMMENTS));
    return INITIAL_COMMENTS;
  }
  return JSON.parse(commentsStr);
}

export function saveStoredComments(comments: any[]) {
  localStorage.setItem("elevon_comments", JSON.stringify(comments));
}

export function getStoredBookmarks() {
  const bookmarksStr = localStorage.getItem("elevon_bookmarks");
  if (!bookmarksStr) {
    localStorage.setItem("elevon_bookmarks", JSON.stringify([]));
    return [];
  }
  return JSON.parse(bookmarksStr);
}

export function saveStoredBookmarks(bookmarks: string[]) {
  localStorage.setItem("elevon_bookmarks", JSON.stringify(bookmarks));
}
