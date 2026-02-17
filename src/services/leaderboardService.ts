import { snagConfig } from '../config/snag.config';
import { AccountRankData, AppError, ErrorCode, LeaderboardData, LeaderboardEntry } from '../types/app.types';
import { LoyaltyAccountRankResponse, LoyaltyAccountsResponse } from '../types/snag-api.types';
import { logger } from '../utils/logger';
import { snagClient } from './snagClient';

export class LeaderboardService {
  async getLeaderboard(params: {
    limit?: number;
    startingAfter?: string;
    loyaltyCurrencyId?: string;
  }): Promise<LeaderboardData> {
    try {
      const limit = this.normalizeLimit(params.limit);

      const response = await snagClient.get<LoyaltyAccountsResponse>(
        '/api/loyalty/accounts',
        {
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
          loyaltyCurrencyId: params.loyaltyCurrencyId || snagConfig.loyaltyCurrencyId,
          limit,
          startingAfter: params.startingAfter,
          orderBy: { amount: 'desc' },
        }
      );

      const entries: LeaderboardEntry[] = (response.data || []).map((account, index) => {
        const meta = account.user?.userMetadata?.[0];
        return {
          accountId: account.id,
          userId: account.userId,
          walletAddress: account.user?.walletAddress,
          username: meta?.telegramUsername
            || meta?.twitterUser
            || meta?.discordUser
            || undefined,
          amount: account.amount || 0,
          rank: index + 1,
        };
      });

      return {
        entries,
        hasNextPage: Boolean(response.hasNextPage),
        limit,
        startingAfter: params.startingAfter,
        loyaltyCurrencyId: params.loyaltyCurrencyId,
      };
    } catch (error: any) {
      logger.error('Failed to fetch leaderboard', {
        error: error.message,
        params,
      });

      throw new AppError(
        ErrorCode.SNAG_API_ERROR,
        `Failed to fetch leaderboard: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }

  async getAccountRank(accountId: string): Promise<AccountRankData> {
    try {
      const response = await snagClient.get<LoyaltyAccountRankResponse>(
        `/api/loyalty/accounts/${accountId}/rank`,
        {
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
        }
      );

      return {
        accountId,
        rank: response.data?.rank ?? 'N/A',
      };
    } catch (error: any) {
      logger.error('Failed to fetch account rank', {
        error: error.message,
        accountId,
      });

      throw new AppError(
        ErrorCode.SNAG_API_ERROR,
        `Failed to fetch rank: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit)) {
      return 20;
    }

    return Math.min(Math.max(limit, 1), 1000);
  }
}

export const leaderboardService = new LeaderboardService();
