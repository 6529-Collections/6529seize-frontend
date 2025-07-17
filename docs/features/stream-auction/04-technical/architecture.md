# Stream Auction Technical Architecture

This document provides a high-level overview of the technical architecture for the memes wave to stream auction integration.

## System Overview

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

## Component Architecture

### Frontend Components
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

### Backend Services
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

## Data Flow

### 1. Eligibility Detection Flow
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

### 2. Redirect Flow
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

### 3. Bidding Flow
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

## Database Design

### Core Tables
See [database schema](database/schema.md) for detailed structure:
- `stream_auction_eligibility` - Tracks drop eligibility
- `stream_auction_redirections` - Records redirect decisions
- `stream_auction_cache` - Caches blockchain state

### Relationships
```
drops (1) ─── (0..1) stream_auction_eligibility
  │
  └───── (0..1) stream_auction_redirections
                          │
                          └───── (0..1) blockchain_auctions
```

## Smart Contract Integration

### Required Contracts
```typescript
interface StreamContracts {
  STREAM_CORE: Address;      // Core stream functionality
  STREAM_MINTER: Address;    // Minting permissions
  STREAM_DROPS: Address;     // Drop creation
  STREAM_AUCTIONS: Address;  // Auction logic
  STREAM_ADMINS: Address;    // Admin functions
}
```

### Key Functions
- `mintDrop()` - Creates auction NFT
- `placeBid()` - Submits bid
- `claimAuction()` - Winner claims NFT
- `getAuctionState()` - Read current state

See [smart contract integration](smart-contracts/integration.md) for details.

## API Design

### RESTful Endpoints
See [API endpoints](api/endpoints.md) for full documentation:
- Eligibility checking
- Redirect process
- Auction browsing
- Bidding actions
- User dashboard

### WebSocket Events
Real-time updates for:
- Bid updates
- Auction status changes
- Countdown synchronization
- Notification delivery

## Caching Strategy

### Cache Layers
1. **CDN** - Static assets, images
2. **Redis** - API responses, session data
3. **Database** - Auction state cache
4. **Browser** - Local state management

### Cache Invalidation
- Bid events invalidate auction cache
- TTL-based expiry for listings
- WebSocket updates for real-time data
- Smart refresh on user actions

## Security Considerations

### Authentication
- Existing JWT-based auth
- Wallet signature for bids
- Rate limiting on sensitive endpoints
- CORS configuration for wallet apps

### Authorization
- Only drop authors can redirect
- Bidders must have sufficient balance
- Admin-only auction creation
- Public read, authenticated write

### Data Validation
- Strict input validation
- Bid amount verification
- Signature verification
- SQL injection prevention

## Performance Optimization

### Frontend
- Lazy loading auction images
- Virtual scrolling for large lists
- Optimistic UI updates
- Code splitting by route

### Backend
- Database query optimization
- Efficient eligibility checking
- Batch notification processing
- Connection pooling

### Blockchain
- Event-based state sync
- Minimal RPC calls
- Gas optimization
- Retry mechanisms

## Monitoring & Observability

### Metrics
- Eligibility check performance
- Redirect success rate
- Bid transaction success
- API response times

### Logging
- Structured logging (JSON)
- Correlation IDs
- Error tracking (Sentry)
- Audit trail for redirects

### Alerts
- Failed eligibility jobs
- High bid failure rate
- Contract interaction errors
- API degradation

---

[Next: Database schema →](database/schema.md)  
[See API design →](api/endpoints.md)  
[Back to concepts →](../01-concept/overview.md)