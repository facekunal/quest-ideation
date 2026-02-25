// Snag API Request/Response Types

// User Metadata Types
export interface UserMetadata {
  id: string; // metadata ID
  userId: string;
  walletAddress: string;
  displayName?: string;
  logoUrl?: string;
  isBlocked: boolean;
  userGroupId: string | null;
  websiteId: string;
  organizationId: string;
  user?: {
    id: string;
    walletAddress: string;
  };
  twitterUser?: {
    id: string;
    username: string;
  };
  discordUser?: {
    id: string;
    username: string;
  };
}

export interface CreateUserMetadataRequest {
  userId: string;
  walletAddress: string;
  isBlocked: boolean;
  userGroupId: string;
  websiteId: string;
  organizationId: string;
  displayName?: string;
}

// Loyalty Account Types
export interface LoyaltyAccount {
  id: string;
  userId: string;
  amount: number;
  loyaltyCurrencyId: string;
  user: {
    id?: string;
    walletAddress: string;
    userMetadata?: Array<{
      telegramUsername?: string;
      twitterUser?: string;
      discordUser?: string;
      displayName?: string;
      logoUrl?: string;
    }>;
  };
}

export interface LoyaltyAccountsResponse {
  data: LoyaltyAccount[];
  hasNextPage?: boolean;
}

export interface LoyaltyAccountRankResponse {
  data: {
    rank: number | string;
  };
}

// Quest/Loyalty Rule Types
export interface LoyaltyRule {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  amount?: number;
  organizationId: string;
  websiteId: string;
  frequency?: string;
  interval?: string;
  metadata?: {
    enableStreaks?: boolean;
    streakArray?: Array<{ streakMilestone: number; streakAmount: number }>;
    [key: string]: any;
  };
  loyaltyAccountStreaks?: Array<{
    streakCount: number;
    expiresAt: string;
  }>;
}

export interface LoyaltyRulesResponse {
  data: LoyaltyRule[];
}

export interface CompletedQuestEntry {
  loyaltyRuleId: string;
  userId: string;
  status: 'completed';
  message?: string;
}

export interface QuestStatusBatchResponse {
  data: CompletedQuestEntry[];
}

// Generic Snag API Response
export interface SnagApiResponse<T> {
  data: T;
}

export interface SnagApiError {
  message: string;
  statusCode?: number;
  code?: string;
}
