# Auction Discovery & Browsing

This document covers how users find and browse stream auctions throughout the platform.

## Primary Access Point

### Collections Section Integration
**URL**: `/collections/stream-auctions`  
**Navigation**: Collections dropdown → Stream Auctions

Stream auctions appear as a new collection type alongside:
- The Memes
- Gradient
- NextGen
- **Stream Auctions** (NEW)

## Main Auction Listing Page

### Page Layout
```
┌─────────────────────────────────────────┐
│ Stream Auctions                         │
│ ─────────────────────────────────────── │
│ [Active] [Upcoming] [Collection] [My Bids]│
│                                         │
│ Filters: [Price Range] [Ending Soon] [↓]│
│ ─────────────────────────────────────── │
│                                         │
│ Active Auctions (12)                    │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │NFT  │ │NFT  │ │NFT  │ │NFT  │      │
│ │1.2Ξ │ │0.8Ξ │ │2.1Ξ │ │0.5Ξ │      │
│ │2h   │ │5h   │ │23h  │ │45m  │      │
│ │ 👑  │ │     │ │     │ │ ⚡  │      │
│ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                         │
│ [Load More]                             │
└─────────────────────────────────────────┘
```

### Category Tabs

#### Active Auctions
- Currently accepting bids
- Sorted by ending soonest by default
- Shows current bid and time remaining
- Indicators for user's bid status

#### Upcoming Auctions  
- In pending/preparation state
- Shows "Coming Soon" messaging
- Creator contact in progress
- Builds anticipation

#### Collection
- Completed auctions
- Shows final sale price
- Winner information (if public)
- Historical record

#### My Bids
- User's active participations
- Quick access to auctions they're involved in
- Status indicators (winning/outbid)
- One-click rebid actions

## Auction Card Design

### Standard Auction Card
```
┌─────────────────────┐
│ [Meme Image/Preview]│
│                     │
│ Current Bid: 1.2 ETH│
│ Time Left: 2h 15m   │
│ Bidders: 7          │
│                     │
│ by @creator         │
│ ─────────────────── │
│ [Place Bid]    👑   │
└─────────────────────┘
```

### Card Elements
- **Image**: Full meme preview
- **Current Bid**: Live-updated
- **Time Remaining**: Countdown timer
- **Bid Count**: Social proof
- **Creator**: Link to profile
- **Status Icons**:
  - 👑 You're winning
  - ⚡ Ending soon (<1hr)
  - 🔥 Hot (many bids)

## Filtering & Sorting

### Filter Options
- **Price Range**: Min/max current bid
- **Time Remaining**: Ending within X hours
- **Creator**: Specific creators
- **Status**: Has bids / No bids
- **Category**: From specific waves

### Sort Options  
- Ending Soon (default for active)
- Price: Low to High
- Price: High to Low
- Recently Added
- Most Bids

## Search Integration

### Search Functionality
- Search by creator name
- Search by meme text content
- Search by auction ID
- Filters maintain during search

### Search Results Display
- Highlights matching terms
- Shows category (active/upcoming/ended)
- Direct link to auction page

## Individual Auction Page

### Page Structure
```
┌─────────────────────────────────────────┐
│ ← Back to Auctions                      │
│                                         │
│ ┌─────────────┐  Meme Title            │
│ │             │  by @creator            │
│ │   [Meme]    │                        │
│ │             │  Current Bid: 2.5 ETH  │
│ └─────────────┘  Time Left: 1h 23m     │
│                                         │
│ Bid History               Your Status   │
│ ─────────────            ────────────  │
│ 2.5 ETH - @user1         🔴 Outbid     │
│ 2.2 ETH - @you           Last: 2.2 ETH │
│ 2.0 ETH - @user2                       │
│                          [Bid 2.8 ETH]  │
│                                         │
│ Description                             │
│ ─────────────────────────────────────── │
│ [Original meme context and metadata]    │
│                                         │
│ Stats                                   │
│ ─────────────────────────────────────── │
│ Original Votes: 187                     │
│ Average Rating: 4.3                     │
│ Wave: Memes Wave #42                    │
└─────────────────────────────────────────┘
```

### Key Sections
1. **Hero Section**: Large meme display
2. **Auction Status**: Current bid, time, quick bid
3. **Bid History**: Recent bids (limited)
4. **User Status**: Your participation
5. **Metadata**: Original wave context
6. **Action Area**: Bidding interface

## Discovery Features

### Homepage Integration
**Location**: Index page  
**Section**: "Live Stream Auctions"
**Format**: Horizontal carousel

Shows 6-8 active auctions with:
- Ending soon priority
- Mix of price ranges
- "View All" link

### Related Auctions
On individual auction pages:
- More from this creator
- Similar price range
- Ending at similar times
- From same wave

### Activity Feed Integration
Stream Auction Activity wave shows:
- New auctions going live
- Significant bid activity
- Auctions ending soon
- Final results

## Mobile Responsive Design

### Grid Adjustments
- 4 columns → 2 columns (tablet)
- 2 columns → 1 column (mobile)
- Card info condensed
- Touch-friendly tap targets

### Simplified Filters
- Collapsible filter panel
- Most-used filters visible
- Others in dropdown
- Applied filters shown as chips

---

[Next: Bidding interface →](bidding-interface.md)  
[Back to wave changes →](memes-wave-changes.md)  
[See mobile version →](../mobile/overview.md)