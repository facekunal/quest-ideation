// Application Domain Types

export interface PointsData {
  accountId?: string;
  walletAddress: string;
  total: number;
  userId: string;
  displayName?: string;
}

export interface LeaderboardEntry {
  accountId: string;
  userId: string;
  walletAddress: string;
  username?: string;
  amount: number;
  rank?: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  hasNextPage: boolean;
  limit: number;
  startingAfter?: string;
  loyaltyCurrencyId?: string;
}

export interface AccountRankData {
  accountId: string;
  rank: number | string;
}

export interface UserBadge {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  awardedAt: string;
}

export interface QuestWithStatus {
  id: string;
  name: string;
  description?: string;
  type: string;
  points: number;
  status: 'completed' | 'pending' | 'failed' | 'unknown';
  completedAt?: string;
  frequency?: string;
  streakCount?: number;
  resetAt?: string;
  nextStreakMilestone?: number;
  nextStreakBonus?: number;
}

export interface LoyaltyData {
  walletAddress: string;
  user: {
    id: string;
    displayName?: string;
  };
  points: {
    total: number;
  };
  badges: UserBadge[];
  quests: QuestWithStatus[];
}

export interface PartialLoyaltyData {
  walletAddress: string;
  user?: {
    id: string;
    displayName?: string;
  };
  points?: {
    total: number;
  };
  pointsError?: string | null;
  badges?: UserBadge[];
  badgesError?: string | null;
  quests?: QuestWithStatus[];
  questsError?: string | null;
}

// Error Types
export enum ErrorCode {
  // Client Errors (4xx)
  INVALID_WALLET = 'INVALID_WALLET',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Server Errors (5xx)
  SNAG_API_ERROR = 'SNAG_API_ERROR',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Service-specific
  POINTS_FETCH_FAILED = 'POINTS_FETCH_FAILED',
  BADGES_FETCH_FAILED = 'BADGES_FETCH_FAILED',
  QUESTS_FETCH_FAILED = 'QUESTS_FETCH_FAILED',

  // Configuration
  CONFIG_ERROR = 'CONFIG_ERROR',
  API_KEY_INVALID = 'API_KEY_INVALID',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
