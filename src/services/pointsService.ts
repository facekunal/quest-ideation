import { snagClient } from './snagClient';
import { snagConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode, PointsData } from '../types/app.types';
import { LoyaltyAccountsResponse } from '../types/snag-api.types';

export class PointsService {
  /**
   * Get points balance for a wallet address
   */
  async getPointsByWallet(walletAddress: string): Promise<PointsData> {
    try {
      logger.debug('Fetching points for wallet', { walletAddress });

      const response = await snagClient.get<LoyaltyAccountsResponse>(
        '/api/loyalty/accounts',
        {
          walletAddress,
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
          loyaltyCurrencyId: snagConfig.loyaltyCurrencyId,
          orderBy: { amount: 'desc' },
        }
      );

      // Handle empty response (no points yet)
      if (!response.data || response.data.length === 0) {
        logger.info('No points found for wallet', { walletAddress });
        return {
          accountId: undefined,
          walletAddress,
          total: 0,
          userId: '',
          displayName: undefined,
        };
      }

      const account = response.data[0];

      const pointsData: PointsData = {
        accountId: account.id,
        walletAddress,
        total: account.amount || 0,
        userId: account.userId,
        displayName: account.user?.displayName,
      };

      logger.info('Points retrieved successfully', {
        walletAddress,
        total: pointsData.total,
      });

      return pointsData;
    } catch (error: any) {
      logger.error('Failed to fetch points', {
        walletAddress,
        error: error.message,
      });

      throw new AppError(
        ErrorCode.POINTS_FETCH_FAILED,
        `Failed to fetch points: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }
}

// Export singleton instance
export const pointsService = new PointsService();
