# Stream Auction Technical Architecture

Here's how all the pieces fit together to make stream auctions work.

## The Big Picture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Memes Wave UI     │────▶│    Backend API      │────▶│  Smart Contracts    │
│                     │     │                     │     │                     │
│ • Eligibility Badge │     │ • Eligibility Check│     │ • Stream Drops      │
│ • Redirect Modal    │     │ • Redirect Process │     │ • Stream Auctions   │
│ • Vote Display      │     │ • Auction Creation │     │ • Stream Minter     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
           │                           │                           │
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ Collections/Auction │     │     Database        │     │    Blockchain       │
│       UI            │     │                     │     │                     │
│ • Browse Auctions   │     │ • Eligibility Table │     │ • Auction State     │
│ • Bidding Interface │     │ • Redirect Table    │     │ • Bid History       │
│ • My Bids View      │     │ • Cached Auction    │     │ • NFT Ownership     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## How We Organize the Code

### Frontend Structure
```
src/
├── components/
│   ├── waves/
│   │   ├── StreamEligibilityBadge.tsx
│   │   ├── StreamRedirectModal.tsx
│   │   └── WaveDropStreamStatus.tsx
│   ├── auctions/
│   │   ├── StreamAuctionCard.tsx
│   │   ├── StreamAuctionList.tsx
│   │   ├── StreamAuctionDetails.tsx
│   │   ├── StreamBiddingInterface.tsx
│   │   └── StreamMyBids.tsx
│   └── notifications/
│       ├── StreamAuctionNotifications.tsx
│       └── StreamAuctionActivity.tsx
├── hooks/
│   ├── useStreamEligibility.ts
│   ├── useStreamAuctions.ts
│   ├── useStreamBidding.ts
│   └── useStreamNotifications.ts
└── pages/
    └── collections/
        └── stream-auctions/
            ├── index.tsx
            ├── [tokenId].tsx
            └── my-bids.tsx
```

### Backend Structure
```
api/
├── controllers/
│   ├── streamAuctionController.ts
│   ├── streamEligibilityController.ts
│   └── streamRedirectController.ts
├── services/
│   ├── StreamEligibilityService.ts
│   ├── StreamRedirectService.ts
│   ├── StreamAuctionService.ts
│   └── StreamNotificationService.ts
├── jobs/
│   ├── checkEligibility.ts
│   ├── syncAuctionState.ts
│   └── processNotifications.ts
└── models/
    ├── StreamAuctionEligibility.ts
    ├── StreamAuctionRedirect.ts
    └── StreamAuctionCache.ts
```

## How Data Moves Through the System

### Checking if a Meme is Eligible
```
User Posts Meme
     │
     ▼
Receives Votes
     │
     ▼
Hourly Job Checks Metrics
     │
     ▼
Eligibility Achieved?
     │
     ├─ Yes → Update DB → Show Badge → Notify User
     │
     └─ No → Continue Monitoring
```

### When Someone Redirects to Auction
```
User Clicks Redirect
     │
     ▼
Show Confirmation Modal
     │
     ▼
User Confirms
     │
     ▼
Backend Process:
├─ Remove from Leaderboard
├─ Refund Voter TDH
├─ Create Pending Auction
├─ Post to Wave
└─ Trigger Manual Process
     │
     ▼
Team Contact & Verification
     │
     ▼
Create Blockchain Auction
```

### Placing a Bid
```
User Places Bid
     │
     ▼
Validate Bid Amount
     │
     ▼
Sign Transaction
     │
     ▼
Smart Contract:
├─ Verify Bid Valid
├─ Refund Previous Bidder
├─ Update Highest Bid
└─ Emit Events
     │
     ▼
Update UI State
     │
     ▼
Send Notifications
```

## Database Structure

We use three main tables (see [database schema](database/schema.md) for details):
- `stream_auction_eligibility` - Which memes can be auctioned
- `stream_auction_redirections` - Who redirected what
- `stream_auction_cache` - Local copy of blockchain data

### How They Connect
```
drops (1) ─── (0..1) stream_auction_eligibility
  │
  └───── (0..1) stream_auction_redirections
                          │
                          └───── (0..1) blockchain_auctions
```

## Smart Contracts We Use

We interact with several Stream contracts:
- **STREAM_CORE** - The main Stream contract
- **STREAM_MINTER** - Handles minting permissions
- **STREAM_DROPS** - Creates the drops
- **STREAM_AUCTIONS** - Runs the actual auctions
- **STREAM_ADMINS** - Admin controls

Main functions we call:
- `mintDrop()` - Creates the auction NFT
- `placeBid()` - Submits a bid
- `getAuctionState()` - Checks current status

See [smart contract integration](smart-contracts/integration.md) for the technical details.

## API Structure

Our REST API handles (see [API endpoints](api/endpoints.md) for details):
- Checking if memes are eligible
- Processing redirects
- Browsing auctions
- Placing bids
- User dashboard data

WebSockets keep everything real-time:
- Live bid updates
- Auction status changes
- Synchronized countdowns
- Instant notifications

## Making It Fast

We cache at multiple levels:
1. **CDN** - Images and static files
2. **Redis** - API responses and sessions
3. **Database** - Copy of blockchain state
4. **Browser** - Local data

When things change:
- New bids clear the auction cache
- Listings expire after a set time
- WebSockets push updates instantly
- User actions trigger smart refreshes

## Keeping It Secure

**Who can do what**:
- You must be the meme creator to redirect
- Bidders need enough ETH in their wallet
- Only admins can create auctions
- Anyone can view, but you need to be logged in to act

**How we verify**:
- JWT tokens for regular auth
- Wallet signatures for bids
- Rate limiting to prevent spam
- Input validation on everything
- SQL injection protection

## Making It Perform

**Frontend tricks**:
- Load images only when needed
- Virtual scrolling for long lists
- Update UI optimistically
- Split code by page

**Backend optimization**:
- Fast database queries
- Efficient eligibility checks
- Process notifications in batches
- Reuse database connections

**Blockchain efficiency**:
- Listen to events instead of polling
- Minimize blockchain calls
- Optimize gas usage
- Retry failed transactions

## Monitoring Everything

**What we track**:
- How fast eligibility checks run
- Success rate of redirects
- How many bids go through
- API response times

**How we log**:
- JSON format for easy parsing
- Correlation IDs to trace requests
- Sentry for error tracking
- Full audit trail for redirects

**When we get alerted**:
- Eligibility job failures
- Too many failed bids
- Contract errors
- Slow API responses

---

[Next: Database schema →](database/schema.md)  
[See API design →](api/endpoints.md)  
[Back to concepts →](../01-concept/overview.md)