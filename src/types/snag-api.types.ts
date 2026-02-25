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
}

// Rule Groups (GET /api/loyalty/rule_groups)
export interface LoyaltyRuleGroupItem {
  id: string;
  sortId: number;
  loyaltyRule: LoyaltyRule;
  mediaUrl?: string | null;
}

export interface LoyaltyRuleGroup {
  id: string;
  name: string;
  isRequired: boolean;
  sortId: number;
  isCollapsible: boolean;
  subTitle?: string | null;
  loyaltyGroupItems: LoyaltyRuleGroupItem[];
}

export interface LoyaltyRuleGroupsResponse {
  data: LoyaltyRuleGroup[];
  hasNextPage?: boolean;
}

// Transaction Entries (GET /api/loyalty/transaction_entries)
export interface TransactionEntry {
  id: string;
  loyaltyTransaction?: {
    loyaltyRule?: {
      id: string;
    };
  };
}

export interface TransactionEntriesResponse {
  data: TransactionEntry[];
  hasNextPage?: boolean;
}

// Rule Statuses (GET /api/loyalty/rule_statuses)
export interface RuleStatus {
  id: string;
  loyaltyRuleId: string;
  userId: string;
  progress: number; // 0–100
  organizationId: string;
  websiteId: string;
}

export interface RuleStatusesResponse {
  data: RuleStatus[];
  hasNextPage?: boolean;
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
