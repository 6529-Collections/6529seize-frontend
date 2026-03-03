# My Stream Integration

This document covers how stream auctions integrate into the personal "My Stream" dashboard, providing users with a centralized view of their auction activity.

## Overview

The My Stream page gets enhanced with auction-specific sections, allowing users to track their auctions as creators, their bids as collectors, and discover new opportunities.

## Dashboard Sections

### For Creators

**Active Auctions Section**

Shows all current auctions created by the user:

```typescript
interface CreatorAuctionCard {
  auction: StreamAuction;
  currentBid: number;
  bidCount: number;
  timeRemaining: string;
  watchers: number;
}

<MyStreamSection title="Your Active Auctions">
  {activeAuctions.map(auction => (
    <CreatorAuctionCard key={auction.id} auction={auction} />
  ))}
</MyStreamSection>
```

**Eligible Memes Section**

Displays memes that can be converted to auctions:

```typescript
<MyStreamSection title="Ready for Auction">
  <EligibleMemesGrid>
    {eligibleMemes.map(meme => (
      <EligibleMemeCard 
        meme={meme}
        onRedirect={() => handleRedirect(meme.id)}
      />
    ))}
  </EligibleMemesGrid>
</MyStreamSection>
```

**Auction History**

Past auctions with results:

```typescript
interface AuctionHistoryItem {
  auction: CompletedAuction;
  finalPrice: number;
  winner: User;
  completedAt: Date;
}
```

### For Bidders

**Active Bids Section**

Track all auctions where user has placed bids:

```typescript
<MyStreamSection title="Your Bids">
  <BidsList>
    {activeBids.map(bid => (
      <BidCard
        bid={bid}
        isWinning={bid.is_highest}
        showQuickBid={!bid.is_highest}
      />
    ))}
  </BidsList>
</MyStreamSection>
```

**Watched Auctions**

Auctions user is monitoring:

```typescript
<WatchedAuctions>
  {watchedAuctions.map(auction => (
    <WatchedAuctionCard
      auction={auction}
      onUnwatch={() => unwatchAuction(auction.id)}
    />
  ))}
</WatchedAuctions>
```

## Activity Feed Integration

### Auction Events in Feed

New activity types in the main feed:

```typescript
const AUCTION_ACTIVITY_TYPES = {
  auction_created: {
    icon: 'gavel',
    template: '{user} created a new auction for "{title}"'
  },
  auction_bid: {
    icon: 'trending-up',
    template: '{user} bid {amount} ETH on "{title}"'
  },
  auction_won: {
    icon: 'trophy',
    template: '{user} won "{title}" for {amount} ETH'
  }
};
```

### Feed Filtering

New filter options:

```typescript
<FeedFilters>
  <FilterChip active={filters.auctions} onClick={() => toggleFilter('auctions')}>
    Auctions
  </FilterChip>
  <FilterChip active={filters.bids} onClick={() => toggleFilter('bids')}>
    My Bids
  </FilterChip>
</FeedFilters>
```

## Quick Actions

### Floating Action Menu

Quick auction actions from My Stream:

```typescript
<FloatingActionButton>
  <Action icon="add" label="Create Auction" onClick={openCreateModal} />
  <Action icon="search" label="Browse Auctions" href="/collections?type=auction" />
  <Action icon="stats" label="Auction Stats" onClick={showStats} />
</FloatingActionButton>
```

### Inline Actions

Direct actions on auction cards:

```typescript
<AuctionCardActions>
  <Button size="sm" onClick={() => placeBid(auction.id)}>
    Place Bid
  </Button>
  <Button size="sm" variant="ghost" onClick={() => shareAuction(auction.id)}>
    Share
  </Button>
  <IconButton icon="bookmark" onClick={() => watchAuction(auction.id)} />
</AuctionCardActions>
```

## Stats & Analytics

### Personal Auction Dashboard

```typescript
interface AuctionStats {
  // As creator
  totalAuctions: number;
  activeAuctions: number;
  totalEarned: number;
  averagePrice: number;
  successRate: number;
  
  // As bidder
  totalBids: number;
  auctionsWon: number;
  totalSpent: number;
  winRate: number;
}

<AuctionStatsCard stats={userAuctionStats} />
```

### Trend Charts

Visual representation of auction activity:

```typescript
<AuctionTrendsChart>
  <MetricChart 
    data={auctionPriceHistory}
    title="Average Sale Price"
    period="30d"
  />
  <MetricChart
    data={bidActivityHistory}
    title="Bidding Activity"
    period="30d"
  />
</AuctionTrendsChart>
```

## Personalization

### Recommendations

Suggested auctions based on user activity:

```typescript
const getAuctionRecommendations = async (userId: string) => {
  const userPreferences = await getUserPreferences(userId);
  const bidHistory = await getUserBidHistory(userId);
  
  return recommendAuctions({
    interests: userPreferences.interests,
    priceRange: calculatePreferredPriceRange(bidHistory),
    creators: extractPreferredCreators(bidHistory)
  });
};
```

### Smart Notifications

Contextual alerts in My Stream:

```typescript
<SmartAlerts>
  {alerts.map(alert => {
    switch(alert.type) {
      case 'price_drop':
        return <PriceDropAlert auction={alert.auction} />;
      case 'ending_soon':
        return <EndingSoonAlert auction={alert.auction} />;
      case 'new_from_favorite':
        return <FavoriteCreatorAlert creator={alert.creator} />;
    }
  })}
</SmartAlerts>
```

## Mobile Optimization

### Swipe Actions

Mobile-friendly gestures:

```typescript
<SwipeableAuctionCard
  onSwipeLeft={() => dismissAuction(auction.id)}
  onSwipeRight={() => watchAuction(auction.id)}
>
  <AuctionPreview auction={auction} />
</SwipeableAuctionCard>
```

### Bottom Sheet Details

Quick auction details without navigation:

```typescript
<BottomSheet>
  <AuctionQuickView 
    auction={selectedAuction}
    onBid={() => openBidModal(selectedAuction)}
    onClose={() => setSelectedAuction(null)}
  />
</BottomSheet>
```

## Performance Considerations

### Data Loading Strategy

Efficient data fetching:

```typescript
// Parallel loading of different sections
const loadMyStreamData = async (userId: string) => {
  const [
    activeAuctions,
    activeBids,
    eligibleMemes,
    recommendations
  ] = await Promise.all([
    getActiveAuctionsByCreator(userId),
    getActiveBidsByUser(userId),
    getEligibleMemes(userId),
    getAuctionRecommendations(userId)
  ]);
  
  return { activeAuctions, activeBids, eligibleMemes, recommendations };
};
```

### Real-time Updates

WebSocket subscriptions for live data:

```typescript
useEffect(() => {
  const subscriptions = [
    subscribeToUserAuctions(userId),
    subscribeToUserBids(userId),
    subscribeToWatchedAuctions(watchedIds)
  ];
  
  return () => subscriptions.forEach(sub => sub.unsubscribe());
}, [userId, watchedIds]);
```

## Integration Points

### With Existing Features

- **TDH Integration**: Show TDH requirements/earnings
- **Profile Stats**: Update profile with auction metrics
- **Achievements**: New auction-related achievements
- **Social Features**: Share auctions to social feeds

---

[Back to Notifications ←](notifications.md)  
[Next: Implementation phases →](../06-implementation/phases.md)  
[See My Stream UI →](../03-user-experience/desktop/my-stream-integration.md)