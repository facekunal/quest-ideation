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

/**
 * Fetch leaderboard entries sorted by points descending
 */
async function fetchLeaderboard({ limit = 20, startingAfter, loyaltyCurrencyId } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));

  if (startingAfter) {
    params.set('startingAfter', startingAfter);
  }

  if (loyaltyCurrencyId) {
    params.set('loyaltyCurrencyId', loyaltyCurrencyId);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/loyalty/leaderboard?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch leaderboard');
  }

  return await response.json();
}

/**
 * Fetch a specific account rank
 */
async function fetchAccountRank(accountId) {
  const response = await fetch(
    `${API_BASE_URL}/api/loyalty/leaderboard/rank/${accountId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch account rank');
  }

  return await response.json();
}
