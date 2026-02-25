# Snag API POC

A proof-of-concept demonstrating Snag API integration for querying user loyalty data (points, badges, social quests) by wallet address without wallet provider popups.

## Features

✅ **Direct Wallet Input** - Query loyalty data by entering any wallet address
✅ **Auto-Create Users** - Automatically creates Snag users if wallet doesn't exist
✅ **Points Display** - Shows total loyalty points balance
✅ **Badges** - Displays earned badges with award timestamps
✅ **Social Quests** - Lists all quests with completion status
✅ **Dynamic Quest Rules** - Fetches quest rules from Snag API (not hard-coded)
✅ **Leaderboard** - Displays top accounts by points with pagination
✅ **Error Handling** - Graceful degradation with partial data display

## Tech Stack

- **Backend:** Node.js 18+ with TypeScript, Express
- **Frontend:** Simple HTML + Vanilla JavaScript (no build step)
- **API:** Snag Solutions Loyalty API
- **HTTP Client:** Native fetch with retry logic

## Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm/yarn
- Snag API credentials (API key, organization ID, website ID, etc.)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd quest-ideation
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your Snag API credentials:
   ```env
   SNAG_API_KEY=your-api-key-here
   SNAG_ORGANIZATION_ID=your-org-id-here
   SNAG_WEBSITE_ID=your-website-id-here
   SNAG_LOYALTY_CURRENCY_ID=your-currency-id-here
   SNAG_DEFAULT_USER_GROUP_ID=your-default-group-id-here
   ```

   **Where to find these values:**
   - Log into your Snag admin dashboard
   - Navigate to Settings → API Keys
   - Copy the required IDs from your organization settings

## Usage

### Development Mode

Start the development server with auto-reload:

```bash
pnpm dev
```

The server will start at `http://localhost:3000`

### Production Mode

Build and run in production:

```bash
pnpm build
pnpm start
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/api/loyalty/wallet/:walletAddress` | GET | Get all loyalty data (points + badges + quests) |
| `/api/loyalty/points/:walletAddress` | GET | Get points only |
| `/api/loyalty/badges/:walletAddress` | GET | Get badges only |
| `/api/loyalty/quests/:walletAddress` | GET | Get quests with status |
| `/api/loyalty/quests` | GET | Get all available quest rules |
| `/api/loyalty/leaderboard` | GET | Get leaderboard entries sorted by points |
| `/api/loyalty/leaderboard/rank/:accountId` | GET | Get rank for a specific loyalty account |

### Example API Calls

**Get complete loyalty data:**
```bash
curl http://localhost:3000/api/loyalty/wallet/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Get points only:**
```bash
curl http://localhost:3000/api/loyalty/points/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Health check:**
```bash
curl http://localhost:3000/health
```

## Project Structure

```
snag-api-poc/
├── src/
│   ├── config/
│   │   └── snag.config.ts           # Environment variables & configuration
│   ├── types/
│   │   ├── snag-api.types.ts        # Snag API request/response types
│   │   └── app.types.ts             # Application domain types
│   ├── services/
│   │   ├── snagClient.ts            # HTTP client with auth & retries
│   │   ├── userService.ts           # User lookup & auto-creation
│   │   ├── pointsService.ts         # Points queries
│   │   ├── badgeService.ts          # Badge queries
│   │   └── questService.ts          # Quest rules & status
│   ├── controllers/
│   │   └── loyaltyController.ts     # Request handlers
│   ├── middleware/
│   │   ├── errorHandler.ts          # Global error handling
│   │   └── requestValidator.ts      # Input validation
│   ├── utils/
│   │   ├── logger.ts                # Logging utility
│   │   └── validators.ts            # Wallet address validation
│   ├── routes/
│   │   └── api.routes.ts            # API route definitions
│   └── server.ts                    # Express app entry point
├── public/
│   ├── index.html                   # Frontend UI
│   ├── css/
│   │   └── styles.css               # Styling
│   └── js/
│       ├── app.js                   # Main app logic
│       └── api-client.js            # Backend API calls
├── .env.example                     # Environment template
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
└── README.md                        # This file
```

## How It Works

### User Flow

1. **User enters wallet address** in the input field
2. **Frontend validates** the wallet format (0x + 40 hex chars)
3. **Backend receives request** and validates again
4. **User auto-creation:** If wallet doesn't exist in Snag, a new user is created
5. **Parallel data fetching:**
   - Points from `/api/loyalty/accounts`
   - Badges via badge-type loyalty rules
   - Quests from `/api/loyalty/rules` with status checks
6. **Response aggregation:** All data combined into single response
7. **Frontend renders** points, badges, and quests with status icons

### Auto-Create Users

The POC automatically creates Snag users if they don't exist:

```typescript
// 1. Check if user exists by wallet address
const user = await getUserByWallet(walletAddress);

// 2. If not found, create new user
if (!user) {
  const newUser = await createUser(walletAddress);
}
```

This uses the following Snag API endpoints:
- `GET /api/users/metadatas` - Check if user exists
- `POST /api/users/metadatas` - Create new user

### Quest Status Checking

Quests are fetched dynamically (not hard-coded):

```typescript
// 1. Fetch all active quest rules + completed statuses in parallel
const [rules, statusResponse] = await Promise.all([
  snagClient.get('/api/loyalty/rules', { organizationId, websiteId, isActive: true }),
  snagClient.get('/api/loyalty/rules/status', { userId, organizationId, websiteId }),
]);

// 2. Build set of completed rule IDs
const completedRuleIds = new Set(statusResponse.data.map(e => e.loyaltyRuleId));

// 3. Combine rule metadata + status
const quests = rules.map(rule => ({
  ...rule,
  status: completedRuleIds.has(rule.id) ? 'completed' : 'pending',
}));
```

### Badge Filtering

Badges are filtered by checking badge-type loyalty rules:

```typescript
// 1. Fetch badges, badge rules, and completed statuses in parallel
const [allBadges, badgeRules, statusResponse] = await Promise.all([
  snagClient.get('/api/loyalty/badges'),
  snagClient.get('/api/loyalty/rules', { rewardType: 'badge' }),
  snagClient.get('/api/loyalty/rules/status', { userId, organizationId, websiteId }),
]);

// 2. Filter to completed badge rules and map to badge metadata
const completedRuleIds = new Set(statusResponse.data.map(e => e.loyaltyRuleId));
const userBadges = badgeRules
  .filter(rule => completedRuleIds.has(rule.id) && rule.badgeId)
  .map(rule => allBadges.find(b => b.id === rule.badgeId));
```

## Error Handling

The POC implements graceful error handling:

- **Partial Data Display:** If one service fails (e.g., badges), other data (points, quests) is still shown
- **Retry Logic:** Snag API calls retry up to 2 times on 5xx errors with exponential backoff
- **User-Friendly Messages:** Clear error messages displayed to users
- **Validation:** Wallet addresses validated on both client and server

## Caching

Quest rules are cached for 5 minutes to reduce API calls:

```typescript
// Cache configuration in .env
CACHE_QUEST_RULES_TTL=300  # 5 minutes
CACHE_ENABLED=true
```

## Limitations

### Current Limitations

1. **Read-Only:** POC only queries data, does not complete quests or award badges
2. **No Wallet Signature:** Direct wallet input, no authentication required
3. **Points Breakdown:** API doesn't provide breakdown by source (bets/referrals/quests)
4. **Badge Awards:** Relies on badge-type loyalty rules (may not cover all badge scenarios)

### User Group ID

The `SNAG_DEFAULT_USER_GROUP_ID` may not be required. If you encounter errors during user creation:

1. Check your Snag dashboard for available user groups
2. Try omitting the field (set to empty string)
3. Contact Snag support for the correct default group ID

## Testing

### Manual Testing Checklist

- [ ] Start server successfully
- [ ] Health check returns 200 OK
- [ ] Query existing wallet with data
- [ ] Query new wallet (auto-creates user)
- [ ] Invalid wallet format shows error
- [ ] Points display correctly
- [ ] Badges render with dates
- [ ] Quests show correct status icons
- [ ] Partial failures show available data
- [ ] No console errors

### Test with Sample Wallets

Replace with actual wallet addresses from your Snag instance:

```bash
# Existing wallet with data
curl http://localhost:3000/api/loyalty/wallet/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# New wallet (will be auto-created)
curl http://localhost:3000/api/loyalty/wallet/0x1234567890123456789012345678901234567890
```

## Troubleshooting

### Common Issues

**"Missing required environment variables"**
- Ensure all required variables are set in `.env`
- Check that `.env` file exists (copy from `.env.example`)

**"Invalid Snag API key"**
- Verify API key in Snag dashboard
- Ensure key has proper permissions

**"User creation failed"**
- Check `SNAG_DEFAULT_USER_GROUP_ID` value
- Try setting it to your organization ID
- Contact Snag support for correct group ID

**"Quest rules not loading"**
- Verify your Snag instance has active loyalty rules
- Check organization and website IDs are correct
- Review server logs for API errors

### Enable Debug Logging

Set log level to debug in `.env`:

```env
LOG_LEVEL=debug
```

This will show detailed logs of all Snag API calls and responses.

## Future Enhancements

Potential improvements beyond the POC scope:

- [ ] Add Dynamic wallet authentication
- [ ] Implement quest completion triggers
- [ ] Add leaderboard ranking
- [ ] Show points breakdown by source
- [ ] Real-time quest verification polling
- [ ] Badge gallery with images
- [ ] Quest completion history timeline
- [ ] User profile management

## References

- [Snag API Documentation](https://docs.snagsolutions.io/api-reference/introduction)
- [User Metadata Endpoints](https://docs.snagsolutions.io/api-reference/identity/get-user-metadata)
- [Loyalty Rules](https://docs.snagsolutions.io/loyalty/available-loyalty-rules)
- [Verifying Rule Completion](https://docs.snagsolutions.io/loyalty/verifying-rule-completion)

## License

MIT

## Support

For issues or questions:
- Review the [Snag API Documentation](https://docs.snagsolutions.io)
- Check server logs with `LOG_LEVEL=debug`
- Contact Snag support for API-related issues
