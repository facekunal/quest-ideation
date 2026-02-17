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
    walletAddress: string;
    displayName?: string;
    logoUrl?: string;
    twitterUser?: {
      id: string;
      username: string;
    };
    discordUser?: {
      id: string;
      username: string;
    };
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
  rewardType?: 'points' | 'badge';
  amount?: number;
  badgeId?: string;
  organizationId: string;
  websiteId: string;
  metadata?: Record<string, any>;
}

export interface LoyaltyRulesResponse {
  data: LoyaltyRule[];
}

export interface QuestStatusRequest {
  walletAddress: string;
  ruleId: string;
}

export interface QuestStatusResponse {
  status: 'completed' | 'pending' | 'failed';
  completedAt?: string;
}

// Badge Types
export interface Badge {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  organizationId: string;
  websiteId: string;
  createdAt?: string;
}

export interface BadgesResponse {
  data: Badge[];
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
