import { snagClient } from './snagClient';
import { snagConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode } from '../types/app.types';
import {
  UserMetadata,
  CreateUserMetadataRequest,
  SnagApiResponse,
} from '../types/snag-api.types';
import { randomUUID } from 'crypto';

export class UserService {
  /**
   * Get user metadata by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<UserMetadata | null> {
    try {
      const response = await snagClient.get<SnagApiResponse<UserMetadata[]>>(
        '/api/users/metadatas',
        {
          walletAddress,
          organizationId: snagConfig.organizationId,
          websiteId: snagConfig.websiteId,
        }
      );

      if (response.data && response.data.length > 0) {
        logger.info('User found', { walletAddress, userId: response.data[0].userId });
        return response.data[0];
      }

      logger.info('User not found', { walletAddress });
      return null;
    } catch (error: any) {
      logger.error('Failed to get user by wallet', {
        walletAddress,
        error: error.message,
      });
      throw new AppError(
        ErrorCode.SNAG_API_ERROR,
        `Failed to fetch user: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }

  /**
   * Create a new user with wallet address
   */
  async createUser(walletAddress: string): Promise<UserMetadata> {
    try {
      const userId = randomUUID();
      const userGroupId = snagConfig.defaultUserGroupId || snagConfig.organizationId;

      logger.info('Creating new user', { walletAddress, userId, userGroupId });

      const requestBody: CreateUserMetadataRequest = {
        userId,
        walletAddress,
        isBlocked: false,
        userGroupId,
        websiteId: snagConfig.websiteId,
        organizationId: snagConfig.organizationId,
      };

      const response = await snagClient.post<UserMetadata>(
        '/api/users/metadatas',
        requestBody
      );

      logger.info('User created successfully', {
        walletAddress,
        userId: response.userId,
      });

      return response;
    } catch (error: any) {
      logger.error('Failed to create user', {
        walletAddress,
        error: error.message,
      });

      throw new AppError(
        ErrorCode.USER_CREATION_FAILED,
        `Failed to create user: ${error.message}`,
        error.statusCode || 500,
        error
      );
    }
  }

  /**
   * Ensure user exists - check if user exists, create if not
   * Handles race conditions where user might be created between check and create
   */
  async ensureUserExists(walletAddress: string): Promise<UserMetadata> {
    // First, check if user exists
    let user = await this.getUserByWallet(walletAddress);

    if (user) {
      return user;
    }

    // User doesn't exist, try to create
    try {
      user = await this.createUser(walletAddress);
      return user;
    } catch (error: any) {
      // Handle race condition: user might have been created between check and create
      if (error.statusCode === 400 || error.statusCode === 409) {
        logger.warn('Race condition detected, retrying user lookup', {
          walletAddress,
        });

        // Retry getting the user
        user = await this.getUserByWallet(walletAddress);
        if (user) {
          return user;
        }
      }

      // If we still don't have a user, throw the error
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
