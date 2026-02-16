import { Request, Response, NextFunction } from 'express';
import { isValidWalletAddress } from '../utils/validators';
import { AppError, ErrorCode } from '../types/app.types';

/**
 * Middleware to validate wallet address parameter
 */
export function validateWalletParam(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    next(
      new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Wallet address parameter is required',
        400
      )
    );
    return;
  }

  if (!isValidWalletAddress(walletAddress)) {
    next(
      new AppError(
        ErrorCode.INVALID_WALLET,
        'Invalid wallet address format. Expected format: 0x followed by 40 hexadecimal characters',
        400
      )
    );
    return;
  }

  next();
}
