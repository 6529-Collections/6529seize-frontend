# User Journey: Meme to Auction

This document walks through the complete user journey from posting a meme to completing an auction sale.

## Journey Overview

```
Post Meme → Receive Votes → Become Eligible → Redirect Decision → Auction Active → Final Sale
```

## Detailed Steps

### 1. Initial Submission
**User**: Creator  
**Action**: Posts a meme to the wave  
**Experience**: Standard meme submission process, no changes

### 2. Community Voting Phase
**Users**: Community members  
**Action**: Vote on the meme (1-5 rating)  
**What's Happening**: System tracks voting metrics in background

### 3. Eligibility Achievement
**Trigger**: Meme reaches voting threshold  
**Visual Change**: "Stream Eligible" badge appears on the meme card  
**Notification**: Creator receives alert about eligibility

```
┌─────────────────────────────────────┐
│ [Meme Content]           [🎯 Stream]│
│                         [Eligible] │
│                                     │
│ Votes: 150 | Avg: 4.2              │
└─────────────────────────────────────┘
```

### 4. Redirect Decision Point
**User**: Creator only  
**Options**: 
- Continue in leaderboard competition
- Redirect to stream auction

**Key Information Shown**:
- What happens to votes (refunded)
- Auction parameters (price, duration)
- This decision is permanent

### 5. Redirect Confirmation
**User**: Creator  
**Action**: Confirms redirect decision  
**System Actions**:
- Immediately removes meme from leaderboard
- Refunds all voter TDH
- Creates pending auction entry
- Posts announcement in original wave

### 6. Manual Verification
**Timeline**: 1-3 business days  
**Process**: Team member contacts creator via DM  
**Purpose**: Verify content and finalize auction setup

### 7. Auction Goes Live
**Visible To**: Everyone  
**Where**: Collections > Stream Auctions  
**Initial State**:
- Starting price: 0.1 ETH (set by contract)
- Duration: 24 hours (set by contract)
- Open for bidding

### 8. Bidding Activity
**Users**: Any collector  
**Actions**:
- Place bids (must exceed current by minimum increment)
- Monitor auction status
- Receive notifications when outbid

**Creator Experience**:
- Sees bid notifications
- Can interact with bidders
- Watches price potentially increase

### 9. Auction Conclusion
**Duration**: 24 hours after start  
**Winner**: Highest bidder  
**Notifications**:
- Winner notified to claim
- Creator notified of final price

### 10. NFT Claim
**User**: Auction winner  
**Action**: Claims NFT through auction interface  
**Result**: 1/1 NFT transferred to winner's wallet

## Alternative Paths

### Path A: Choose Not to Redirect
If creator doesn't redirect when eligible:
- Meme stays in leaderboard competition
- Eligible badge remains visible
- Can still redirect later (no deadline)

### Path B: Don't Reach Eligibility
If meme doesn't hit thresholds:
- Continues in normal wave lifecycle
- May still win leaderboard through other metrics
- No auction option available

## Key Decision Points

### For Creators
1. **When Eligible**: Redirect now or wait?
2. **Why Redirect**: Monetization vs. leaderboard glory?
3. **Timing**: Best time to capture value?

### For Collectors
1. **Discovery**: How to find auctions?
2. **Bidding**: How much to bid?
3. **Competition**: Monitor other bidders?

## User Mental Models

Different users approach this feature differently:

- **"The Monetizer"**: Sees eligibility, immediately redirects for profit
- **"The Competitor"**: Stays in leaderboard unless clearly not winning  
- **"The Artist"**: Redirects quality pieces worthy of 1/1 status
- **"The Strategist"**: Times redirect based on community interest

---

[Next: Understand user motivations →](motivations.md)  
[Back to overview →](overview.md)  
[See technical implementation →](../04-technical/architecture.md)