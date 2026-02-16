import { snagClient } from './snagClient';
import { snagConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode, UserBadge } from '../types/app.types';
import {
  Badge,
  BadgesResponse,
  LoyaltyRule,
  LoyaltyRulesResponse,
  QuestStatusResponse,
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
   * Check badge rule completion status
   */
  private async checkBadgeRuleStatus(
    walletAddress: string,
    ruleId: string
  ): Promise<QuestStatusResponse> {
    try {
      const response = await snagClient.post<QuestStatusResponse>(
        '/api/loyalty/rules/status',
        {
          walletAddress,
          ruleId,
        }
      );
      return response;
    } catch (error: any) {
      logger.warn('Failed to check badge rule status', {
        walletAddress,
        ruleId,
        error: error.message,
      });
      return { status: 'failed' };
    }
  }

  /**
   * Get user-specific badges by checking badge rule completion status
   */
  async getUserBadges(walletAddress: string): Promise<UserBadge[]> {
    try {
      logger.debug('Fetching user badges', { walletAddress });

      // Get all badges and badge rules in parallel
      const [allBadges, badgeRules] = await Promise.all([
        this.getAllBadges(),
        this.getBadgeRules(),
      ]);

      if (badgeRules.length === 0) {
        logger.info('No badge rules found, returning empty badges');
        return [];
      }

      // Check completion status for each badge rule
      const statusChecks = badgeRules.map(rule =>
        this.checkBadgeRuleStatus(walletAddress, rule.id)
      );
      const statuses = await Promise.all(statusChecks);

      // Filter to completed badge rules and map to badges
      const userBadges: UserBadge[] = [];

      for (let i = 0; i < badgeRules.length; i++) {
        const rule = badgeRules[i];
        const status = statuses[i];

        if (status.status === 'completed' && rule.badgeId) {
          // Find the corresponding badge metadata
          const badge = allBadges.find(b => b.id === rule.badgeId);

          if (badge) {
            userBadges.push({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              imageUrl: badge.imageUrl,
              awardedAt: status.completedAt || new Date().toISOString(),
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
              awardedAt: status.completedAt || new Date().toISOString(),
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
