/**
 * API Client for Snag Loyalty POC
 */

const API_BASE_URL = window.location.origin;

/**
 * Fetch complete loyalty data for a wallet address
 */
async function fetchLoyaltyData(walletAddress) {
  const response = await fetch(
    `${API_BASE_URL}/api/loyalty/wallet/${walletAddress}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch loyalty data');
  }

  return await response.json();
}

/**
 * Fetch points only for a wallet address
 */
async function fetchPoints(walletAddress) {
  const response = await fetch(
    `${API_BASE_URL}/api/loyalty/points/${walletAddress}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch points');
  }

  return await response.json();
}

/**
 * Fetch badges only for a wallet address
 */
async function fetchBadges(walletAddress) {
  const response = await fetch(
    `${API_BASE_URL}/api/loyalty/badges/${walletAddress}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch badges');
  }

  return await response.json();
}

/**
 * Fetch quests with status for a wallet address
 */
async function fetchQuests(walletAddress) {
  const response = await fetch(
    `${API_BASE_URL}/api/loyalty/quests/${walletAddress}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch quests');
  }

  return await response.json();
}

/**
 * Fetch all available quest rules
 */
async function fetchAllQuests() {
  const response = await fetch(
    `${API_BASE_URL}/api/loyalty/quests`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch available quests');
  }

  return await response.json();
}

/**
 * Health check
 */
async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return await response.json();
}
