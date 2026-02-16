import { snagClient } from './snagClient';
import { snagConfig, cacheConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode, QuestWithStatus } from '../types/app.types';
import {
  LoyaltyRule,
  LoyaltyRulesResponse,
  QuestStatusRequest,
  QuestStatusResponse,
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
   * Check quest completion status for a specific wallet and rule
   */
  async getQuestStatus(
    walletAddress: string,
    ruleId: string
  ): Promise<QuestStatusResponse> {
    try {
      const requestBody: QuestStatusRequest = {
        walletAddress,
        ruleId,
      };

      const response = await snagClient.post<QuestStatusResponse>(
        '/api/loyalty/rules/status',
        requestBody
      );

      return response;
    } catch (error: any) {
      logger.warn('Failed to check quest status', {
        walletAddress,
        ruleId,
        error: error.message,
      });

      // Return unknown status rather than failing entire request
      return {
        status: 'failed',
        completedAt: undefined,
      };
    }
  }

  /**
   * Get all quests with completion status for a wallet
   */
  async getQuestsWithStatus(walletAddress: string): Promise<QuestWithStatus[]> {
    try {
      // Get all quest rules
      const rules = await this.getAllQuestRules();

      if (rules.length === 0) {
        logger.info('No quest rules available');
        return [];
      }

      // Check status for each quest in parallel
      logger.debug('Checking quest statuses in parallel', {
        walletAddress,
        questCount: rules.length,
      });

      const statusPromises = rules.map(rule =>
        this.getQuestStatus(walletAddress, rule.id)
      );

      const statuses = await Promise.all(statusPromises);

      // Combine rule metadata with status
      const questsWithStatus: QuestWithStatus[] = rules.map((rule, index) => {
        const status = statuses[index];

        return {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          points: rule.amount || 0,
          status: status.status,
          completedAt: status.completedAt,
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
