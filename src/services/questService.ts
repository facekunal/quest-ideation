import { snagClient } from './snagClient';
import { snagConfig, cacheConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode, QuestWithStatus } from '../types/app.types';
import {
  LoyaltyRule,
  LoyaltyRuleGroupsResponse,
  TransactionEntriesResponse,
} from '../types/snag-api.types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class QuestService {
  private questRulesCache: CacheEntry<LoyaltyRule[]> | null = null;

  /**
   * Get all active quest rules from Snag API via rule_groups (with caching)
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

    // Fetch from API via rule_groups (rules are embedded in loyaltyGroupItems)
    try {
      logger.debug('Fetching quest rules from Snag API via rule_groups');

      const rules: LoyaltyRule[] = [];
      let startingAfter: string | undefined;

      do {
        const response = await snagClient.get<LoyaltyRuleGroupsResponse>(
          '/api/loyalty/rule_groups',
          {
            organizationId: snagConfig.organizationId,
            websiteId: snagConfig.websiteId,
            limit: 100,
            ...(startingAfter ? { startingAfter } : {}),
          }
        );

        const groups = response.data || [];

        for (const group of groups) {
          for (const item of group.loyaltyGroupItems || []) {
            if (item.loyaltyRule) {
              rules.push(item.loyaltyRule);
            }
          }
        }

        startingAfter = response.hasNextPage && groups.length > 0
          ? groups[groups.length - 1].id
          : undefined;
      } while (startingAfter);

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
      logger.info('QuestService: getQuestsWithStatus for ', walletAddress)
      // Fetch quest rules first (cached after first call), then check completion status
      const rules = await this.getAllQuestRules();

      if (rules.length === 0) {
        logger.info('No quest rules available');
        return [];
      }

      const statusResponse = await snagClient.get<TransactionEntriesResponse>('/api/loyalty/transaction_entries', {
        userId,
        organizationId: snagConfig.organizationId,
        websiteId: snagConfig.websiteId,
        userCompletedLoyaltyRuleId: rules.map(r => r.id),
        limit: 100,
      });

      // Build a set of completed rule IDs for O(1) lookup
      // Presence of a transaction entry for a rule ID means the user completed it
      const completedRuleIds = new Set(
        statusResponse.data
          .map((e) => e.loyaltyTransaction?.loyaltyRule?.id)
          .filter((id): id is string => Boolean(id))
      );

      logger.debug('Quest statuses fetched', {
        walletAddress,
        total: rules.length,
        completed: completedRuleIds.size,
      });

      // Combine rule metadata with status
      const questsWithStatus: QuestWithStatus[] = rules.map(rule => {
        return {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          points: rule.amount || 0,
          status: completedRuleIds.has(rule.id) ? 'completed' : 'pending',
          frequency: rule.frequency,
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
