# Stream Auction Activity Wave

The Stream Auction Activity wave provides a public feed of auction events, creating transparency and community engagement around the auction ecosystem.

## Wave Overview

### Purpose
- Public visibility of all auction activity
- Community discussion space
- Real-time auction updates
- Historical record of auction events

### Wave Characteristics
- **Type**: Standard chat wave (ApiWaveType.Chat)
- **Access**: Public - anyone can view and participate
- **Content**: Mix of system posts and user discussion
- **Location**: Waves section with other chat waves

## System-Generated Posts

### 1. Redirect Announcement
**Posted In**: Original memes wave  
**Trigger**: Creator confirms redirect

```
┌─────────────────────────────────────┐
│ 🎯 Auction Redirect                 │
│                                    │
│ [Meme Preview Image]               │
│                                    │
│ @creator redirected "Meme Title"   │
│ to a 1/1 stream auction!           │
│                                    │
│ Original support: 150 votes        │
│ Average rating: 4.2                │
│                                    │
│ [View Auction →]                   │
└─────────────────────────────────────┘
```

**Purpose**:
- Notify wave participants of redirect
- Provide closure for voters
- Drive traffic to auction

### 2. Auction Started
**Posted In**: Stream Auction Activity wave  
**Trigger**: Auction goes live

```
┌─────────────────────────────────────┐
│ 🏁 New Auction Started              │
│                                    │
│ [Meme Thumbnail]                   │
│                                    │
│ "Meme Title" by @creator           │
│ Starting bid: 0.1 ETH              │
│ Duration: 24 hours                 │
│                                    │
│ [Place Bid →] [Set Reminder]       │
└─────────────────────────────────────┘
```

### 3. Significant Bid Activity
**Posted In**: Stream Auction Activity wave  
**Trigger**: Major bid milestones

```
┌─────────────────────────────────────┐
│ 💰 Bidding War!                     │
│                                    │
│ "Meme Title" reaches 5 ETH         │
│ 12 bids placed in last hour        │
│ Time remaining: 3h 45m             │
│                                    │
│ Current leader: @highbidder        │
│                                    │
│ [Join Bidding →]                   │
└─────────────────────────────────────┘
```

**Milestones**:
- First bid placed
- 10x starting price reached
- Rapid bidding detected
- New highest auction value

### 4. Auction Ending Soon
**Posted In**: Stream Auction Activity wave  
**Trigger**: 1 hour before end

```
┌─────────────────────────────────────┐
│ ⏰ Ending Soon!                     │
│                                    │
│ "Meme Title" auction               │
│ Current bid: 3.2 ETH               │
│ Ends in: 59 minutes                │
│                                    │
│ Don't miss out!                    │
│                                    │
│ [Place Final Bid →]                │
└─────────────────────────────────────┘
```

### 5. Auction Completed
**Posted In**: Stream Auction Activity wave  
**Trigger**: Auction ends

```
┌─────────────────────────────────────┐
│ 🔨 Auction Ended                    │
│                                    │
│ [Meme Thumbnail]                   │
│                                    │
│ "Meme Title" by @creator           │
│ Final price: 8.5 ETH               │
│ Winner: @collector                 │
│ Total bids: 23                     │
│                                    │
│ Congrats to all participants! 🎉    │
└─────────────────────────────────────┘
```

### 6. NFT Claimed
**Posted In**: Stream Auction Activity wave  
**Trigger**: Winner claims NFT

```
┌─────────────────────────────────────┐
│ ✅ NFT Claimed                      │
│                                    │
│ @collector claimed "Meme Title"    │
│ Transaction confirmed              │
│                                    │
│ [View on Etherscan →]              │
│ [View in Collection →]             │
└─────────────────────────────────────┘
```

## Community Interaction

### Discussion Features
- Reply to system posts
- Quote specific auctions
- Share opinions on bids
- Celebrate wins together

### User-Generated Content
Users can post about:
- Auction strategies
- Price predictions
- Creator support
- Collection goals

### Moderation
- Standard wave rules apply
- No bid manipulation
- No harassment of bidders
- Positive community focus

## Post Formatting

### Rich Media
- Meme preview images
- Current bid overlays
- Countdown timers
- Progress indicators

### Interactive Elements  
- Direct auction links
- One-click bid buttons
- Reminder settings
- Share functionality

### Information Hierarchy
1. Eye-catching headline
2. Visual preview
3. Key metrics
4. Clear CTA

## Technical Implementation

### Post Generation
```typescript
interface AuctionActivityPost {
  type: 'redirect' | 'start' | 'bid' | 'ending' | 'ended' | 'claimed';
  auctionId: string;
  content: string;
  mediaUrl?: string;
  metrics: {
    currentBid?: string;
    timeRemaining?: number;
    bidCount?: number;
    originalVotes?: number;
  };
  actions: {
    label: string;
    url: string;
  }[];
}
```

### Timing Logic
- Redirect: Immediate
- Start: When auction activates
- Bid milestones: Algorithm-based
- Ending: Exactly 1 hour prior
- Ended: At expiration
- Claimed: On transaction confirmation

### Wave Integration
- Uses existing wave infrastructure
- WebSocket for real-time updates
- Standard chat wave features
- Notification preferences respected

## Benefits

### For Users
- Never miss interesting auctions
- Track market activity
- Learn from community
- Celebrate successes

### For Creators
- Free promotion
- Community engagement
- Build anticipation
- Social proof

### For Platform
- Increased engagement
- Transparent marketplace
- Community building
- Activity metrics

## Future Enhancements

### Potential Features
- AI-generated summaries
- Price prediction games
- Leaderboards
- Weekly highlights

### Analytics Integration
- Popular auction types
- Pricing trends
- Engagement metrics
- Success patterns

---

[Back to user experience →](desktop/)  
[See notifications →](mobile/notifications.md)  
[Technical details →](../04-technical/api/webhooks.md#activity-wave)