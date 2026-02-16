import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { pointsService } from '../services/pointsService';
import { badgeService } from '../services/badgeService';
import { questService } from '../services/questService';
import { logger } from '../utils/logger';
import { validateWalletAddress } from '../utils/validators';
import { LoyaltyData } from '../types/app.types';

export class LoyaltyController {
  /**
   * Get complete loyalty data for a wallet address
   * GET /api/loyalty/wallet/:walletAddress
   */
  async getWalletLoyaltyData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { walletAddress } = req.params;
      validateWalletAddress(walletAddress);

      logger.info('Fetching loyalty data for wallet', { walletAddress });

      // Ensure user exists (auto-create if needed)
      const user = await userService.ensureUserExists(walletAddress);

      // Fetch all loyalty data in parallel
      const results = await Promise.allSettled([
        pointsService.getPointsByWallet(walletAddress),
        badgeService.getUserBadges(walletAddress),
        questService.getQuestsWithStatus(walletAddress),
      ]);

      const [pointsResult, badgesResult, questsResult] = results;

      // Build response with partial data support
      const response: LoyaltyData = {
        walletAddress,
        user: {
          id: user.userId,
          displayName: user.displayName,
        },
        points: {
          total: pointsResult.status === 'fulfilled' ? pointsResult.value.total : 0,
        },
        badges: badgesResult.status === 'fulfilled' ? badgesResult.value : [],
        quests: questsResult.status === 'fulfilled' ? questsResult.value : [],
      };

      // Log any partial failures
      if (pointsResult.status === 'rejected') {
        logger.warn('Failed to fetch points', { error: pointsResult.reason });
      }
      if (badgesResult.status === 'rejected') {
        logger.warn('Failed to fetch badges', { error: badgesResult.reason });
      }
      if (questsResult.status === 'rejected') {
        logger.warn('Failed to fetch quests', { error: questsResult.reason });
      }

      logger.info('Loyalty data retrieved successfully', {
        walletAddress,
        points: response.points.total,
        badges: response.badges.length,
        quests: response.quests.length,
      });

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get points only for a wallet address
   * GET /api/loyalty/points/:walletAddress
   */
  async getPoints(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { walletAddress } = req.params;
      validateWalletAddress(walletAddress);

      // Ensure user exists first
      await userService.ensureUserExists(walletAddress);

      const points = await pointsService.getPointsByWallet(walletAddress);
      res.json(points);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get badges only for a wallet address
   * GET /api/loyalty/badges/:walletAddress
   */
  async getBadges(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { walletAddress } = req.params;
      validateWalletAddress(walletAddress);

      // Ensure user exists first
      await userService.ensureUserExists(walletAddress);

      const badges = await badgeService.getUserBadges(walletAddress);
      res.json({ walletAddress, badges });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quests with status for a wallet address
   * GET /api/loyalty/quests/:walletAddress
   */
  async getQuests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { walletAddress } = req.params;
      validateWalletAddress(walletAddress);

      // Ensure user exists first
      await userService.ensureUserExists(walletAddress);

      const quests = await questService.getQuestsWithStatus(walletAddress);
      res.json({ walletAddress, quests });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available quest rules (no wallet needed)
   * GET /api/loyalty/quests
   */
  async getAllQuests(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const quests = await questService.getAllQuestRules();
      res.json({ quests });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  health(_req: Request, res: Response): void {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'snag-api-poc',
    });
  }
}

// Export singleton instance
export const loyaltyController = new LoyaltyController();
