/**
 * Main Application Logic
 */

// Application state
let currentWallet = null;
let loyaltyData = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
  const form = document.getElementById('wallet-form');
  form.addEventListener('submit', handleWalletSubmit);

  console.log('Snag Loyalty POC initialized');
}

/**
 * Handle wallet form submission
 */
async function handleWalletSubmit(event) {
  event.preventDefault();

  const walletInput = document.getElementById('wallet-input');
  const walletAddress = walletInput.value.trim();

  // Validate wallet address format
  if (!isValidWalletAddress(walletAddress)) {
    showError('Invalid wallet address format. Expected: 0x followed by 40 hex characters');
    return;
  }

  // Clear previous results
  hideError();
  hideResults();

  // Show loading state
  showLoading();

  try {
    // Fetch loyalty data from backend
    console.log('Fetching loyalty data for:', walletAddress);
    const data = await fetchLoyaltyData(walletAddress);

    // Store and render
    currentWallet = walletAddress;
    loyaltyData = data;

    console.log('Loyalty data received:', data);
    renderLoyaltyData(data);

  } catch (error) {
    console.error('Error fetching loyalty data:', error);
    showError(error.message || 'Failed to fetch loyalty data. Please try again.');
  } finally {
    hideLoading();
  }
}

/**
 * Render complete loyalty data
 */
function renderLoyaltyData(data) {
  // Update wallet address display
  document.getElementById('wallet-address').textContent = shortenAddress(data.walletAddress);

  // Render each section
  renderPoints(data.points);
  renderBadges(data.badges);
  renderQuests(data.quests);

  // Show results container
  showResults();
}

/**
 * Render points section
 */
function renderPoints(points) {
  const totalPoints = points?.total || 0;
  document.getElementById('total-points').textContent = totalPoints.toLocaleString();
}

/**
 * Render badges section
 */
function renderBadges(badges) {
  const container = document.getElementById('badges-container');
  const countElement = document.getElementById('badges-count');

  container.innerHTML = '';
  countElement.textContent = badges.length;

  if (badges.length === 0) {
    container.innerHTML = '<p class="empty-state">No badges earned yet</p>';
    return;
  }

  badges.forEach(badge => {
    const badgeCard = createBadgeCard(badge);
    container.appendChild(badgeCard);
  });
}

/**
 * Create badge card element
 */
function createBadgeCard(badge) {
  const card = document.createElement('div');
  card.className = 'badge-card';

  const iconHtml = badge.imageUrl
    ? `<img src="${badge.imageUrl}" alt="${badge.name}">`
    : '🏅';

  card.innerHTML = `
    <div class="badge-icon">${iconHtml}</div>
    <div class="badge-info">
      <h4>${escapeHtml(badge.name)}</h4>
      ${badge.description ? `<p>${escapeHtml(badge.description)}</p>` : ''}
      <span class="badge-date">Earned: ${formatDate(badge.awardedAt)}</span>
    </div>
  `;

  return card;
}

/**
 * Render quests section
 */
function renderQuests(quests) {
  const container = document.getElementById('quests-container');
  const countElement = document.getElementById('quests-count');

  container.innerHTML = '';
  countElement.textContent = quests.length;

  if (quests.length === 0) {
    container.innerHTML = '<p class="empty-state">No quests available</p>';
    return;
  }

  quests.forEach(quest => {
    const questItem = createQuestItem(quest);
    container.appendChild(questItem);
  });
}

/**
 * Create quest item element
 */
function createQuestItem(quest) {
  const item = document.createElement('div');
  item.className = `quest-item quest-${quest.status}`;

  const statusIcon = getStatusIcon(quest.status);
  const statusText = getStatusText(quest);

  item.innerHTML = `
    <div class="quest-header">
      <div style="display: flex; align-items: center; flex: 1;">
        <span class="quest-icon">${statusIcon}</span>
        <span class="quest-name">${escapeHtml(quest.name)}</span>
      </div>
      <span class="quest-points">+${quest.points} pts</span>
    </div>
    ${quest.description ? `<div class="quest-description">${escapeHtml(quest.description)}</div>` : ''}
    <div class="quest-status">${statusText}</div>
  `;

  return item;
}

/**
 * Get status icon for quest
 */
function getStatusIcon(status) {
  const icons = {
    completed: '✅',
    pending: '⏳',
    failed: '❌',
    unknown: '❓'
  };
  return icons[status] || '❓';
}

/**
 * Get status text for quest
 */
function getStatusText(quest) {
  if (quest.status === 'completed' && quest.completedAt) {
    return `Completed: ${formatDate(quest.completedAt)}`;
  }

  const statusLabels = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Not Started',
    unknown: 'Unknown Status'
  };

  return `Status: ${statusLabels[quest.status] || 'Unknown'}`;
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoString) {
  if (!isoString) return 'N/A';

  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Shorten wallet address for display
 */
function shortenAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate wallet address format
 */
function isValidWalletAddress(address) {
  // Basic Ethereum address validation
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show error message
 */
function showError(message) {
  const errorContainer = document.getElementById('error-container');
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';

  // Auto-hide after 8 seconds
  setTimeout(() => {
    hideError();
  }, 8000);
}

/**
 * Hide error message
 */
function hideError() {
  const errorContainer = document.getElementById('error-container');
  errorContainer.style.display = 'none';
}

/**
 * Show loading state
 */
function showLoading() {
  const loadingContainer = document.getElementById('loading-container');
  loadingContainer.style.display = 'block';

  // Disable submit button
  const button = document.getElementById('query-button');
  button.disabled = true;
}

/**
 * Hide loading state
 */
function hideLoading() {
  const loadingContainer = document.getElementById('loading-container');
  loadingContainer.style.display = 'none';

  // Enable submit button
  const button = document.getElementById('query-button');
  button.disabled = false;
}

/**
 * Show results
 */
function showResults() {
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.style.display = 'block';
}

/**
 * Hide results
 */
function hideResults() {
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.style.display = 'none';
}
