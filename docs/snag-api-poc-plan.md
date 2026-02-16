# Snag API POC - High-Level Plan

## Overview

**Objective:** Create a proof-of-concept demonstrating Snag API integration without wallet provider popups, focusing on querying user data via wallet address for social quests, points, and badges.

**Key Requirement:** Provide a wallet address directly (no Dynamic/wallet popup) and retrieve user quest data, total points, and badges.

---

## POC Scope

### Core Features

1. **Direct Wallet Address Input**
   - Simple input field to provide any wallet address
   - No wallet connection or signature required
   - No Dynamic or other wallet provider popups

2. **Social Quest Queries**
   - Query user's social quest completion status
   - View available social quests/rules
   - Check quest verification status (pending/completed/failed)

3. **Points Retrieval**
   - Query total points balance for a given wallet address
   - Display points breakdown by source (bets, referrals, quests)
   - Show leaderboard position (optional)

4. **Badge Retrieval**
   - List all badges awarded to a wallet address
   - Display badge metadata (name, description, image)
   - Show badge award timestamps

---

## Technical Architecture

### Stack

- **Backend:** Node.js/TypeScript (Express or similar)
- **API Client:** Axios/Fetch for Snag API calls
- **Frontend:** Simple HTML/React form for wallet input
- **Authentication:** Snag API Key (server-side only)

### Environment Setup

```bash
# Required Snag Credentials (from admin dashboard)
SNAG_API_KEY=<your-api-key>
SNAG_ORGANIZATION_ID=<your-org-id>
SNAG_WEBSITE_ID=<your-website-id>
SNAG_LOYALTY_CURRENCY_ID=<your-currency-id>

# Base URL
SNAG_BASE_URL=https://admin.snagsolutions.io  # Development
# OR
SNAG_BASE_URL=https://api.yourwebsite.com     # Production (custom domain)
```

---

## API Endpoints to Implement

### 1. Get User Points

**Snag Endpoint:** `GET /api/loyalty/accounts`

**Query Parameters:**
- `walletAddress` - User's wallet address
- `organizationId` - Your organization ID
- `websiteId` - Your website ID
- `loyaltyCurrencyId` - Currency ID
- `orderBy[amount]=desc` - Sort by points

**Response:**
```json
{
  "data": [
    {
      "id": "account-uuid",
      "userId": "user-uuid",
      "amount": 15000,  // Total points
      "user": {
        "walletAddress": "0x1234...",
        "displayName": "User123",
        "logoUrl": "https://...",
        "twitterUser": {...},
        "discordUser": {...}
      }
    }
  ]
}
```

**POC Implementation:**
```typescript
async function getUserPoints(walletAddress: string) {
  const response = await fetch(
    `${SNAG_BASE_URL}/api/loyalty/accounts?` +
    `walletAddress=${walletAddress}&` +
    `organizationId=${SNAG_ORGANIZATION_ID}&` +
    `websiteId=${SNAG_WEBSITE_ID}&` +
    `loyaltyCurrencyId=${SNAG_LOYALTY_CURRENCY_ID}`,
    {
      headers: {
        'x-api-key': SNAG_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
}
```

---

### 2. Get User Badges

**Snag Endpoint:** `GET /api/loyalty/badges`

**Query Parameters:**
- `organizationId` - Your organization ID
- `websiteId` - Your website ID
- `limit` - Results per page (optional)

**Note:** This returns ALL badges. Need to filter by wallet or check badge award status per user.

**Alternative Approach:** Use user metadata or badge award events if available via GraphQL/API.

**POC Implementation:**
```typescript
async function getUserBadges(walletAddress: string) {
  // Step 1: Get all badges
  const badges = await fetch(
    `${SNAG_BASE_URL}/api/loyalty/badges?` +
    `organizationId=${SNAG_ORGANIZATION_ID}&` +
    `websiteId=${SNAG_WEBSITE_ID}`,
    {
      headers: {
        'x-api-key': SNAG_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  // Step 2: Filter badges awarded to this wallet
  // (Implementation depends on Snag's badge award tracking API)
  // May need to query user metadata or separate badge award endpoint

  return await badges.json();
}
```

---

### 3. Get Social Quest Status

**Snag Endpoint:** `POST /api/loyalty/rules/status`

**Request Body:**
```json
{
  "walletAddress": "0x1234...",
  "ruleId": "rule-uuid"
}
```

**Response:**
```json
{
  "status": "completed" | "failed" | "pending",
  "completedAt": "2026-02-16T12:00:00Z"
}
```

**POC Implementation:**
```typescript
async function checkQuestStatus(walletAddress: string, ruleId: string) {
  const response = await fetch(
    `${SNAG_BASE_URL}/api/loyalty/rules/status`,
    {
      method: 'POST',
      headers: {
        'x-api-key': SNAG_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress,
        ruleId
      })
    }
  );
  return await response.json();
}
```

---

### 4. List Available Social Quests

**Approach:** Query available loyalty rules/quests for the organization.

**Note:** Specific endpoint for listing rules not documented - may need to:
- Use GraphQL API if available
- Query via Hasura/admin dashboard
- Hard-code quest IDs for POC

**POC Approach:**
```typescript
// Hard-coded quest list for POC
const DEMO_QUESTS = [
  {
    id: 'quest-1',
    name: 'Follow on Twitter',
    type: 'TWITTER_FOLLOW',
    points: 100
  },
  {
    id: 'quest-2',
    name: 'Join Discord Server',
    type: 'DISCORD_JOIN',
    points: 150
  },
  {
    id: 'quest-3',
    name: 'Repost on X',
    type: 'TWITTER_REPOST',
    points: 50
  }
];
```

---

## POC User Flow

### Step-by-Step Flow

```
1. User opens POC web page
   ↓
2. User enters wallet address in input field (e.g., 0x1234...)
   ↓
3. Click "Query User Data" button
   ↓
4. Backend makes parallel API calls:
   - GET /api/loyalty/accounts (points)
   - GET /api/loyalty/badges (badges)
   - POST /api/loyalty/rules/status (for each demo quest)
   ↓
5. Display results:
   ┌─────────────────────────────────────┐
   │ Wallet: 0x1234...                   │
   │ Total Points: 15,000                │
   │ Leaderboard Rank: #42               │
   │                                     │
   │ Badges:                             │
   │ - Early Adopter 🏆                  │
   │ - Social Butterfly 🦋               │
   │                                     │
   │ Social Quests:                      │
   │ ✅ Follow on Twitter (100 pts)      │
   │ ✅ Join Discord (150 pts)           │
   │ ⏳ Repost on X (50 pts) - Pending   │
   │ ❌ Daily Check-in (25 pts)          │
   └─────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Setup (1-2 hours)

1. **Environment Configuration**
   - Create Snag account and obtain API credentials
   - Set up development environment variables
   - Test API connectivity with basic request

2. **Project Scaffolding**
   - Initialize Node.js/TypeScript project
   - Install dependencies (express, axios, dotenv)
   - Create basic Express server

### Phase 2: API Integration (2-3 hours)

1. **Implement Points Query**
   - Create `/api/points/:walletAddress` endpoint
   - Call Snag loyalty accounts API
   - Parse and format response

2. **Implement Badge Query**
   - Create `/api/badges/:walletAddress` endpoint
   - Query Snag badges API
   - Filter/map user-specific badges

3. **Implement Quest Status Query**
   - Create `/api/quests/:walletAddress` endpoint
   - Query multiple quest statuses in parallel
   - Aggregate completion data

### Phase 3: Frontend (1-2 hours)

1. **Create Simple UI**
   - Input field for wallet address
   - Submit button
   - Display sections for points, badges, quests

2. **API Integration**
   - Fetch data on submit
   - Display loading states
   - Handle errors gracefully

### Phase 4: Testing & Refinement (1 hour)

1. **Test Scenarios**
   - Query wallet with data
   - Query wallet with no data
   - Invalid wallet address
   - API errors

2. **Documentation**
   - Add README with setup instructions
   - Document API endpoints
   - Include example requests/responses

---

## Sample Code Structure

```
snag-poc/
├── src/
│   ├── config/
│   │   └── snag.config.ts          # Snag API configuration
│   ├── services/
│   │   ├── snagClient.ts           # Snag API client wrapper
│   │   ├── pointsService.ts        # Points query logic
│   │   ├── badgeService.ts         # Badge query logic
│   │   └── questService.ts         # Quest status logic
│   ├── routes/
│   │   └── api.routes.ts           # API endpoints
│   ├── types/
│   │   └── snag.types.ts           # TypeScript interfaces
│   └── server.ts                   # Express app
├── public/
│   ├── index.html                  # Simple UI
│   └── app.js                      # Frontend logic
├── .env.example                    # Environment template
├── package.json
└── README.md
```

---

## Expected Outputs

### 1. Points Response Example

```json
{
  "walletAddress": "0x1234...",
  "totalPoints": 15000,
  "breakdown": {
    "fromBets": 10000,
    "fromReferrals": 3000,
    "fromQuests": 2000
  },
  "leaderboardRank": 42
}
```

### 2. Badges Response Example

```json
{
  "walletAddress": "0x1234...",
  "badges": [
    {
      "id": "badge-1",
      "name": "Early Adopter",
      "description": "Joined during beta",
      "imageUrl": "https://...",
      "awardedAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "badge-2",
      "name": "Social Butterfly",
      "description": "Completed 10 social quests",
      "imageUrl": "https://...",
      "awardedAt": "2026-02-10T14:30:00Z"
    }
  ]
}
```

### 3. Quests Response Example

```json
{
  "walletAddress": "0x1234...",
  "quests": [
    {
      "id": "quest-1",
      "name": "Follow on Twitter",
      "type": "TWITTER_FOLLOW",
      "points": 100,
      "status": "completed",
      "completedAt": "2026-02-01T08:00:00Z"
    },
    {
      "id": "quest-2",
      "name": "Join Discord",
      "type": "DISCORD_JOIN",
      "points": 150,
      "status": "completed",
      "completedAt": "2026-02-05T12:00:00Z"
    },
    {
      "id": "quest-3",
      "name": "Repost on X",
      "type": "TWITTER_REPOST",
      "points": 50,
      "status": "pending",
      "completedAt": null
    }
  ]
}
```

---

## Success Criteria

### Must Have

✅ Input wallet address without any wallet provider popup
✅ Retrieve and display total points for wallet
✅ Retrieve and display badges for wallet
✅ Retrieve and display social quest status for wallet
✅ Handle API errors gracefully
✅ Clear documentation of setup and usage

### Nice to Have

⭐ Leaderboard ranking display
⭐ Points breakdown by source
⭐ Quest completion history timeline
⭐ Badge gallery view with images
⭐ Real-time quest verification polling

---

## Limitations & Assumptions

### Known Limitations

1. **Read-Only Queries**
   - POC only queries data, does not complete quests
   - No wallet signature required (view-only)

2. **Quest Completion**
   - Cannot trigger quest completion via API (requires user action)
   - Can only check completion status

3. **Badge Awards**
   - Cannot award badges via POC (admin/automated only)
   - Can only view awarded badges

4. **Rate Limits**
   - Development URL has rate limiting
   - May need production URL for extensive testing

### Assumptions

- Snag account already created with API key
- Organization and website already configured
- Some demo quests and badges already exist
- Test wallet addresses have some data

---

## Next Steps After POC

### Integration Path

1. **Add Wallet Authentication**
   - Integrate Dynamic for actual wallet connection
   - Generate signatures for quest completion
   - Secure API calls with user authentication

2. **Quest Completion Flow**
   - Allow users to complete quests via API
   - Implement verification polling
   - Award points/badges on completion

3. **User Registration**
   - Auto-register new wallets via POST /api/users/metadatas
   - Create Snag user profiles on first interaction
   - Map internal user IDs to Snag wallet addresses

4. **Production Deployment**
   - Set up custom domain for Snag API
   - Configure production environment variables
   - Implement proper error handling and logging

---

## References

- [Snag API Introduction](https://docs.snagsolutions.io/api-reference/introduction)
- [User Authentication Overview](https://docs.snagsolutions.io/user-auth/auth-overview)
- [Verifying Rule Completion](https://docs.snagsolutions.io/loyalty/verifying-rule-completion)
- [Getting Started with Loyalty](https://docs.snagsolutions.io/recipes/getting-started-loyalty)
- [Available Loyalty Rules](https://docs.snagsolutions.io/loyalty/available-loyalty-rules)

---

## Time Estimate

**Total POC Development Time:** 6-8 hours

- Setup & Configuration: 1-2 hours
- API Integration: 2-3 hours
- Frontend Development: 1-2 hours
- Testing & Documentation: 1 hour

**Prerequisites:** Snag account, API credentials, basic TypeScript/Node.js knowledge
