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
│   │   ├── StreamEligibilityBadge.tsx    # Shows "eligible for auction" indicator
│   │   ├── StreamRedirectModal.tsx       # Confirmation dialog to redirect meme
│   │   ├── WaveDropStreamStatus.tsx      # Replaces vote UI after redirect
│   │   └── StreamAuctionSystemPosts.tsx  # System-generated wave posts
│   ├── auctions/
│   │   ├── StreamAuctionCard.tsx         # Individual auction preview card
│   │   ├── StreamAuctionList.tsx         # Grid/list of auction cards
│   │   ├── StreamAuctionDetails.tsx      # Full auction page container
│   │   ├── StreamBiddingInterface.tsx    # Bid placement UI with amount picker
│   │   └── StreamMyBids.tsx              # User's bid history dashboard
│   └── notifications/
│       └── StreamAuctionNotifications.tsx # Personal notifications (outbid alerts, etc)
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

## Component Responsibilities

Understanding what each component does prevents confusion:

### Wave Components

**StreamEligibilityBadge.tsx**
- **When**: Appears when meme hits voting threshold
- **Where**: Top-right corner of meme card in wave
- **What**: Shows "🎯 Stream Eligible" badge
- **For creators**: Clickable, opens redirect modal
- **For others**: View-only indicator
- **States**: Hidden → Eligible → Clicked

**StreamRedirectModal.tsx**
- **When**: Creator clicks eligibility badge
- **Where**: Modal overlay
- **What**: Confirmation dialog with warnings
- **Actions**: Cancel or confirm redirect
- **Shows**: What happens, timeline, can't undo

**WaveDropStreamStatus.tsx**
- **When**: AFTER meme is redirected
- **Where**: Replaces entire voting section
- **What**: Shows auction status + link
- **States**: Pending → Live → Ended
- **Shows**: "🔄 Redirected to Auction", original votes

**StreamAuctionSystemPosts.tsx**
- **What**: Creates automated system posts in waves
- **Where**: Posts to Stream Auction Activity wave
- **When**: Auction events (redirect, start, bids, end)
- **Format**: Rich posts with previews and action buttons
- **Purpose**: Keep community informed of auction activity

### Quick Component Reference

| Component | Purpose | Appears When | User Interaction |
|-----------|---------|--------------|------------------|
| StreamEligibilityBadge | Shows meme can be auctioned | Votes hit threshold | Creator: Click to redirect<br>Others: View only |
| StreamRedirectModal | Confirm auction redirect | Creator clicks badge | Confirm or cancel |
| WaveDropStreamStatus | Shows auction status | After redirect done | Click to view auction |

### Auction Components (Post-Redirect)

**StreamAuctionCard.tsx**
- **What**: Compact auction preview (like a product card)
- **Shows**: Image, current bid, time left, bid count
- **Where**: Browse pages, collections, search results
- **Actions**: Click to view full auction

**StreamAuctionList.tsx**
- **What**: Container for multiple auction cards
- **Features**: Filtering (active/ended), sorting (price/time)
- **Where**: /collections/stream-auctions page
- **Handles**: Grid/list view toggle, pagination

**StreamAuctionDetails.tsx**
- **What**: Full auction page wrapper
- **Contains**: NFT details, bid history, description
- **Children**: StreamBiddingInterface, countdown timer
- **Where**: /collections/stream-auctions/[tokenId]

**StreamBiddingInterface.tsx**
- **What**: The actual bid placement component
- **Features**: Quick bid buttons, custom amount input
- **States**: Idle → Expanded → Confirming → Processing
- **Shows**: Current bid, min bid, wallet balance check
- **Handles**: Bid validation, wallet signing, error states

**StreamMyBids.tsx**
- **What**: Personal bidding dashboard
- **Shows**: Active bids, outbid notifications, won auctions
- **Where**: /collections/stream-auctions/my-bids
- **Features**: Filter by status, bid history

### Notification Component

**StreamAuctionNotifications.tsx**
- **What**: Personal notification integration
- **Where**: Main app notification system/dropdown
- **Types**: Outbid alerts, auction won, ending soon
- **Features**: One-notification rule for outbids
- **Integrates**: With existing notification preferences
- **Purpose**: Private alerts to specific users

### Component Lifecycle

```
Meme Posted → Gets Votes → Hits Threshold
     │              │              │
     │              │              ▼
     │              │    StreamEligibilityBadge
     │              │         appears
     │              │              │
     │              │              ▼
     │              │      Creator clicks badge
     │              │              │
     │              │              ▼
     │              │    StreamRedirectModal
     │              │         opens
     │              │              │
     │              │              ▼
     │              │      Confirms redirect
     │              │              │
     │              ▼              ▼
     │         Badge + Modal → WaveDropStreamStatus
     │            removed         replaces UI
     │                               │
     ▼                               ▼
Regular voting          Shows auction progress
continues               Links to auction page
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

**Authentication & verification**:
- JWT tokens for session management
- EIP-712 signatures for bid authorization
- Multi-sig requirements for admin actions
- Time-locked operations for critical changes

**Smart contract security**:
- Reentrancy guards on all payment functions
- Circuit breakers for emergency pause
- Formal verification of auction logic

## When Things Go Wrong

We've built in several layers of error handling because auctions involve real money and we can't afford to lose data.

**Redirect failures**:
- If auction creation fails while in pending state, it stays pending
- Admin manually investigates and resolves the issue
- Creator gets notified about the status
- No automatic rollback since redirect is permanent

**Bid transaction issues**:
- Failed bids show clear error messages to users
- Users can retry with adjusted gas if needed
- Wallet connection errors trigger graceful reconnection flows

**System failures**:
- WebSocket disconnections trigger automatic reconnection
- Database connections recover from network issues
- Failed background jobs are logged for investigation

**Recovery strategies**:
- All critical operations are idempotent - safe to retry
- State changes happen in database transactions
- Blockchain operations have corresponding rollback procedures
- Manual intervention tools for admins when automation fails

## Managing Complex State

The auction system coordinates real-time data across multiple users, so state management is critical.

**Frontend state architecture**:
- Auction state managed through React Context
- Optimistic updates show bid changes instantly
- WebSocket events update context to sync everyone
- Tanstack Query handles server state with smart caching

**State synchronization**:
- Bid updates use optimistic UI then reconcile with blockchain
- Auction timers sync to server time to prevent drift
- Local storage persists draft bids across sessions
- Conflict resolution favors blockchain as source of truth

**Performance considerations**:
- Selective re-renders using React.memo and useMemo
- Virtual lists for browsing many auctions
- Debounced search and filter operations
- Lazy loading for auction images and metadata

## Testing Strategy

We test at multiple levels to ensure auction integrity.

**Local development**:
- Mock contracts for testing bid flows without ETH
- Fixture data for various auction states
- Time manipulation for testing auction endings
- Network condition simulation for error cases

**Test environments**:
- Sepolia testnet for end-to-end blockchain testing
- Staging environment with test ETH faucet
- Load testing for high-traffic auction scenarios
- Chaos engineering to test failure recovery

**Test coverage**:
- Unit tests for eligibility calculations
- Integration tests for redirect flows
- E2E tests for critical user journeys
- Smart contract tests using Hardhat

**Continuous testing**:
- Automated tests run on every PR
- Nightly regression suite
- Performance benchmarks tracked over time
- Security audits for contract changes

## Rolling Out Changes Safely

Since auctions involve real money, our deployment process prioritizes safety.

**Deployment strategy**:
- Test thoroughly on staging environment first
- Database migrations run before code deploys
- Feature flags for gradual rollout
- Deploy to production after staging validation

**Release coordination**:
- No deploys during active high-value auctions
- Maintenance windows communicated in advance
- Read-only mode for critical updates
- On-call engineer during every deploy

**Version management**:
- Frontend and backend versions must stay compatible
- API versioning for breaking changes
- Contract upgrades follow careful governance
- Client-side feature detection for graceful degradation

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