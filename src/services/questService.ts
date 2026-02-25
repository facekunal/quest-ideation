import { snagClient } from './snagClient';
import { snagConfig, cacheConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode, QuestWithStatus } from '../types/app.types';
import {
  LoyaltyRule,
  LoyaltyRulesResponse,
  QuestStatusBatchResponse,
} from '../types/snag-api.types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class QuestService {
  private questRulesCache: CacheEntry<LoyaltyRule[]> | null = null;

  /**
   * Get all active quest rules from Snag API (with caching)
   */
  async getAllQuestRules(): Promise<LoyaltyRule[]> {
    // Check cache first
    if (cacheConfig.enabled && this.questRulesCache) {
      const age = Date.now() - this.questRulesCache.timestamp;
      const ttlMs = cacheConfig.questRulesTTL * 1000;

      if (age < ttlMs) {
        logger.debug('Returning cached quest rules', {
          age: Math.floor(age / 1000),
          ttl: cacheConfig.questRulesTTL,
        });
        return this.questRulesCache.data;
      }
    }

    // Fetch from API
    try {
      logger.debug('Fetching quest rules from Snag API');

      const response = await snagClient.get<LoyaltyRulesResponse>(
        '/api/loyalty/rules',
        {
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
          isActive: true,
          limit: 100,
        }
      );

      const rules = response.data || [];

      logger.info('Quest rules fetched successfully', { count: rules.length });

      // Update cache
      if (cacheConfig.enabled) {
        this.questRulesCache = {
          data: rules,
          timestamp: Date.now(),
        };
      }

      return rules;
    } catch (error: any) {
      logger.error('Failed to fetch quest rules', { error: error.message });

      // Return cached data if available on error
      if (this.questRulesCache) {
        logger.warn('Returning stale cached quest rules due to fetch error');
        return this.questRulesCache.data;
      }

      throw new AppError(
        ErrorCode.QUESTS_FETCH_FAILED,
        `Failed to fetch quest rules: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }

  /**
   * Get all quests with completion status for a wallet
   */
  async getQuestsWithStatus(walletAddress: string, userId: string): Promise<QuestWithStatus[]> {
    try {
      // Fetch all quest rules and completed statuses in parallel
      const [rules, statusResponse] = await Promise.all([
        this.getAllQuestRules(),
        snagClient.get<QuestStatusBatchResponse>('/api/loyalty/rules/status', {
          userId,
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
        }),
      ]);

      if (rules.length === 0) {
        logger.info('No quest rules available');
        return [];
      }

      // Build a set of completed rule IDs for O(1) lookup
      const completedRuleIds = new Set(
        statusResponse.data.map(e => e.loyaltyRuleId)
      );

      logger.debug('Quest statuses fetched', {
        walletAddress,
        total: rules.length,
        completed: completedRuleIds.size,
      });

      // Combine rule metadata with status
      const questsWithStatus: QuestWithStatus[] = rules.map(rule => {
        const streak = rule.loyaltyAccountStreaks?.[0];
        const enableStreaks = rule.metadata?.enableStreaks;
        const streakArray = rule.metadata?.streakArray || [];
        const currentCount = streak?.streakCount ?? 0;
        const nextMilestone = streakArray
          .filter(s => s.streakMilestone > currentCount)
          .sort((a, b) => a.streakMilestone - b.streakMilestone)[0];

        return {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          points: rule.amount || 0,
          status: completedRuleIds.has(rule.id) ? 'completed' : 'pending',
          frequency: rule.frequency,
          streakCount: enableStreaks && streak && streak.streakCount > 0 ? streak.streakCount : undefined,
          resetAt: streak?.expiresAt,
          nextStreakMilestone: nextMilestone?.streakMilestone,
          nextStreakBonus: nextMilestone ? nextMilestone.streakAmount / 1_000_000 : undefined,
        };
      });

      logger.info('Quests with status retrieved successfully', {
        walletAddress,
        total: questsWithStatus.length,
        completed: questsWithStatus.filter(q => q.status === 'completed').length,
      });

      return questsWithStatus;
    } catch (error: any) {
      logger.error('Failed to get quests with status', {
        walletAddress,
        error: error.message,
      });

      throw new AppError(
        ErrorCode.QUESTS_FETCH_FAILED,
        `Failed to fetch quests: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }

  /**
   * Clear the quest rules cache (useful for testing)
   */
  clearCache(): void {
    this.questRulesCache = null;
    logger.debug('Quest rules cache cleared');
  }
}

// Export singleton instance
export const questService = new QuestService();
