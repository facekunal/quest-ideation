import { snagClient } from './snagClient';
import { snagConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode, UserBadge } from '../types/app.types';
import {
  Badge,
  BadgesResponse,
  LoyaltyRule,
  LoyaltyRulesResponse,
  QuestStatusBatchResponse,
} from '../types/snag-api.types';

export class BadgeService {
  /**
   * Get all available badges
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      const response = await snagClient.get<BadgesResponse>(
        '/api/loyalty/badges',
        {
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
          limit: 100,
        }
      );

      return response.data || [];
    } catch (error: any) {
      logger.error('Failed to fetch all badges', { error: error.message });
      throw new AppError(
        ErrorCode.BADGES_FETCH_FAILED,
        `Failed to fetch badges: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }

  /**
   * Get badge-type loyalty rules
   */
  private async getBadgeRules(): Promise<LoyaltyRule[]> {
    try {
      const response = await snagClient.get<LoyaltyRulesResponse>(
        '/api/loyalty/rules',
        {
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
          isActive: true,
          limit: 100,
        }
      );

      // Filter rules that have badge rewards
      const badgeRules = (response.data || []).filter(
        rule => rule.rewardType === 'badge' && rule.badgeId
      );

      logger.debug('Badge rules retrieved', { count: badgeRules.length });
      return badgeRules;
    } catch (error: any) {
      logger.warn('Failed to fetch badge rules', { error: error.message });
      return [];
    }
  }

  /**
   * Get user-specific badges by checking badge rule completion status
   */
  async getUserBadges(walletAddress: string, userId: string): Promise<UserBadge[]> {
    try {
      logger.debug('Fetching user badges', { walletAddress });

      // Get all badges, badge rules, and completion statuses in parallel
      const [allBadges, badgeRules, statusResponse] = await Promise.all([
        this.getAllBadges(),
        this.getBadgeRules(),
        snagClient.get<QuestStatusBatchResponse>('/api/loyalty/rules/status', {
          userId,
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
        }),
      ]);

      if (badgeRules.length === 0) {
        logger.info('No badge rules found, returning empty badges');
        return [];
      }

      const completedRuleIds = new Set(
        statusResponse.data.map(e => e.loyaltyRuleId)
      );

      // Filter to completed badge rules and map to badges
      const userBadges: UserBadge[] = [];

      for (const rule of badgeRules) {
        if (completedRuleIds.has(rule.id) && rule.badgeId) {
          // Find the corresponding badge metadata
          const badge = allBadges.find(b => b.id === rule.badgeId);

          if (badge) {
            userBadges.push({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              imageUrl: badge.imageUrl,
              awardedAt: new Date().toISOString(),
            });
          } else {
            // Badge metadata not found, use rule info
            logger.warn('Badge metadata not found for rule', {
              ruleId: rule.id,
              badgeId: rule.badgeId,
            });
            userBadges.push({
              id: rule.badgeId,
              name: rule.name,
              description: rule.description,
              imageUrl: undefined,
              awardedAt: new Date().toISOString(),
            });
          }
        }
      }

      logger.info('User badges retrieved successfully', {
        walletAddress,
        count: userBadges.length,
      });

      return userBadges;
    } catch (error: any) {
      logger.error('Failed to get user badges', {
        walletAddress,
        error: error.message,
      });

      throw new AppError(
        ErrorCode.BADGES_FETCH_FAILED,
        `Failed to fetch user badges: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }
}

// Export singleton instance
export const badgeService = new BadgeService();
