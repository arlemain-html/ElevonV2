// ELEVON Social dApp TypeScript Definitions

export interface OnChainIdentity {
  registered: boolean;
  verified: boolean;
  profileHash: string; // bytes32 hex
  registeredAt: number;
  updatedAt: number;
}

export interface OnChainStats {
  xp: bigint;
  reputation: bigint;
  level: bigint;
  actionCount: bigint;
}

export interface UserProfile {
  address: string;
  username: string;
  bio: string;
  avatarUrl: string;
  onChainIdentity?: OnChainIdentity;
  onChainStats?: OnChainStats;
  badges: BadgeOrAchievement[];
  achievements: BadgeOrAchievement[];
}

export interface BadgeOrAchievement {
  id: string;
  name: string;
  description: string;
  image: string;
  metadataURI: string;
  active: boolean;
  balance: number;
  type: "badge" | "achievement";
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorName: string;
  authorReputation: number;
  authorVerified: boolean;
  communityId: string;
  category: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorName: string;
  authorReputation: number;
  authorVerified: boolean;
  content: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  postsCount: number;
  bannerColor: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "reputation" | "achievement";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

export enum CommunityRole {
  None = 0,
  Member = 1,
  Contributor = 2,
  Moderator = 3,
  Admin = 4
}
