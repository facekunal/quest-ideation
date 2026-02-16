import dotenv from 'dotenv';

dotenv.config();

export const snagConfig = {
  baseUrl: process.env.SNAG_BASE_URL || 'https://admin.snagsolutions.io',
  apiKey: process.env.SNAG_API_KEY || '',
  organizationId: process.env.SNAG_ORGANIZATION_ID || '',
  websiteId: process.env.SNAG_WEBSITE_ID || '',
  loyaltyCurrencyId: process.env.SNAG_LOYALTY_CURRENCY_ID || '',
  defaultUserGroupId: process.env.SNAG_DEFAULT_USER_GROUP_ID || '',
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export const cacheConfig = {
  questRulesTTL: parseInt(process.env.CACHE_QUEST_RULES_TTL || '300', 10),
  enabled: process.env.CACHE_ENABLED === 'true',
};

// Validate required configuration
export function validateConfig(): void {
  const required = [
    'SNAG_API_KEY',
    'SNAG_ORGANIZATION_ID',
    'SNAG_WEBSITE_ID',
    'SNAG_LOYALTY_CURRENCY_ID',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }
}
