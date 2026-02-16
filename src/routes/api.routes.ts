import { Router } from 'express';
import { loyaltyController } from '../controllers/loyaltyController';
import { validateWalletParam } from '../middleware/requestValidator';

const router = Router();

// Health check
router.get('/health', loyaltyController.health.bind(loyaltyController));

// Loyalty endpoints
router.get(
  '/api/loyalty/wallet/:walletAddress',
  validateWalletParam,
  loyaltyController.getWalletLoyaltyData.bind(loyaltyController)
);

router.get(
  '/api/loyalty/points/:walletAddress',
  validateWalletParam,
  loyaltyController.getPoints.bind(loyaltyController)
);

router.get(
  '/api/loyalty/badges/:walletAddress',
  validateWalletParam,
  loyaltyController.getBadges.bind(loyaltyController)
);

router.get(
  '/api/loyalty/quests/:walletAddress',
  validateWalletParam,
  loyaltyController.getQuests.bind(loyaltyController)
);

router.get(
  '/api/loyalty/quests',
  loyaltyController.getAllQuests.bind(loyaltyController)
);

export default router;
