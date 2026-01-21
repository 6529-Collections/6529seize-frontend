# Collections Integration

This document covers how stream auctions integrate into the existing collections browsing experience.

## Overview

Stream auctions appear in collections pages as active auctions, allowing collectors to discover and bid on 1/1 NFTs created from popular memes. The integration is seamless - auctions show up alongside regular collection items.

## Main Collections Page

### Auction Section

**Location**: `/collections`

A new "Active Auctions" section appears at the top when auctions are live:

```typescript
// Collections page structure
<CollectionsPage>
  <StreamAuctionBanner />      // Shows if active auctions exist
  <ActiveStreamAuctions />     // Grid of current auctions
  <CollectionCategories />     // Regular collections below
</CollectionsPage>
```

### Auction Cards

Each auction displays as a card showing:
- Preview image/video
- Current bid and bidder
- Time remaining
- Quick bid button
- Creator info

```typescript
interface StreamAuctionCard {
  auction: StreamAuction;
  onQuickBid: () => void;
  onViewDetails: () => void;
}
```

## Individual Collection Pages

### Collection Header Update

When viewing a specific collection that contains stream auctions:

```typescript
// Add auction count to collection stats
<CollectionStats>
  <Stat label="Items" value={collection.item_count} />
  <Stat label="Owners" value={collection.owner_count} />
  <Stat label="Active Auctions" value={collection.auction_count} />
</CollectionStats>
```

### Mixed Grid Display

Auctions appear inline with regular NFTs but with distinct styling:

```typescript
// Grid item rendering
{items.map(item => 
  item.type === 'auction' ? (
    <StreamAuctionGridItem key={item.id} auction={item} />
  ) : (
    <NFTGridItem key={item.id} nft={item} />
  )
)}
```

## Filtering & Sorting

### New Filter Options

Add auction-specific filters to collections:

```typescript
const AUCTION_FILTERS = {
  status: ['active', 'ending_soon', 'no_bids'],
  priceRange: ['under_1_eth', '1_to_10_eth', 'over_10_eth'],
  timeLeft: ['under_1h', '1h_to_24h', 'over_24h']
};
```

### Sort Options

Extended sort dropdown:
- Price: Low to High (includes current bid)
- Price: High to Low
- Ending Soon
- Most Bids
- Recently Listed

## Search Integration

### Auction Search

Auctions are searchable by:
- Original meme title
- Creator name/handle
- Collection tags
- Auction ID

```typescript
// Search implementation
const searchAuctions = async (query: string) => {
  return await api.searchStreamAuctions({
    q: query,
    status: 'active',
    collections: selectedCollections
  });
};
```

## Collection Analytics

### Auction Metrics

New metrics in collection analytics:
- Total auctions completed
- Average auction price
- Auction success rate
- Top auction items

```typescript
interface CollectionAuctionStats {
  total_auctions: number;
  active_auctions: number;
  total_volume: number;
  average_price: number;
  success_rate: number;
}
```

## Creator Profile Integration

### Creator's Auctions Tab

On creator profiles, show auction history:

```typescript
<CreatorTabs>
  <Tab label="Created" />
  <Tab label="Collected" />
  <Tab label="Stream Auctions" count={auctionCount} />
</CreatorTabs>
```

### Auction History

Display both active and completed auctions:
- Thumbnail and title
- Final/current price
- Winner (if completed)
- Date and duration

## Mobile Considerations

### Responsive Auction Cards

Auction cards adapt to mobile:
- Stacked layout on small screens
- Prominent bid button
- Simplified time display
- Swipe for more details

### Quick Actions

Mobile-optimized actions:
```typescript
<MobileAuctionCard>
  <SwipeableActions>
    <Action icon="bid" label="Quick Bid" primary />
    <Action icon="watch" label="Watch" />
    <Action icon="share" label="Share" />
  </SwipeableActions>
</MobileAuctionCard>
```

## Performance Optimization

### Lazy Loading

Auctions load separately from regular items:
```typescript
// Parallel data fetching
const [nfts, auctions] = await Promise.all([
  fetchCollectionNFTs(collectionId),
  fetchActiveAuctions(collectionId)
]);
```

### Real-time Updates

WebSocket connection for live auction data:
```typescript
useEffect(() => {
  const ws = subscribeToAuctions(visibleAuctionIds);
  
  ws.on('bid_update', (data) => {
    updateAuctionData(data.auctionId, data);
  });
  
  return () => ws.close();
}, [visibleAuctionIds]);
```

## Error Handling

### Auction Load Failures

Graceful degradation when auctions can't load:
```typescript
if (auctionLoadError) {
  return <CollectionsPage showAuctions={false} />;
}
```

### Bid Error Recovery

Clear error messages for failed bids:
- Insufficient funds
- Auction ended
- Outbid while bidding
- Network issues

---

[Next: Notifications integration →](notifications.md)  
[Back to Memes Wave integration ←](memes-wave.md)  
[See collections UI →](../03-user-experience/desktop/collections-integration.md)