# Memes Wave to Stream Auction Integration - Feature Specification

## Overview

This feature allows successful memes wave submissions to be redirected to the Stream Auction system for 1/1 NFT auctions. When a submission maintains a certain voting average over a specified period, the poster can elect to mint their submission as a 1/1 NFT auction instead of remaining in the traditional memes wave leaderboard.

## User Motivations & Mental Models

Understanding why creators choose to redirect to stream auctions is crucial for designing effective UI and messaging. Through analysis, several distinct mental models emerge:

**Personal Monetization**: "I want to monetize this successful meme" - Users see the financial opportunity and want to capitalize on their content's success.

**Alternative Path**: "I want to try something different" - Users are curious about the auction mechanism as an alternative to traditional leaderboard competition.

**Community Interest**: "There's strong community interest in owning this as a 1/1" - Users recognize that community members specifically want to own their content as a unique collectible rather than as part of a broader edition.

**Quality Recognition**: "This content deserves to be preserved as a unique piece" - Users view the auction as a way to honor exceptional content that transcends typical meme lifecycle.

These different motivations affect how users perceive the redirect decision and what information they need to make it confidently. The UI design accommodates these varying mental models by emphasizing both the achievement aspect (crossing the threshold) and the community opportunity aspect (enabling 1/1 ownership).

## Core Requirements

### Eligibility Criteria

**Voting Threshold**: A submission becomes eligible for stream auction when it maintains sufficient voting metrics over a specified time period. The exact vote count, rating average, and time duration will be determined based on analysis of existing memes wave data and user behavior patterns to ensure optimal balance between accessibility and quality.

### User Flow

1. **Submission**: User submits to memes wave normally
2. **Voting**: Submission receives votes from community
3. **Eligibility**: System tracks voting metrics and flags eligible submissions
4. **Notification**: User sees they're eligible for stream auction
5. **Choice**: User decides to redirect to stream auction OR stay in leaderboard
6. **Redirect Announcement**: System posts in original memes wave about redirect with auction link
7. **Auction Setup**: If redirected, submission is minted as 1/1 NFT auction
8. **Leaderboard Removal**: Original submission is removed from memes wave leaderboard
9. **Auction Activity Feed**: System generates posts in Stream Auction Activity wave for auction events (start, new bids, end, claim)

## Technical Architecture

### Backend Changes

#### New Database Schema

```sql
-- Track stream auction eligibility
CREATE TABLE stream_auction_eligibility (
    id SERIAL PRIMARY KEY,
    drop_id VARCHAR(255) NOT NULL,
    wave_id VARCHAR(255) NOT NULL,
    is_eligible BOOLEAN DEFAULT FALSE,
    eligibility_achieved_at TIMESTAMP,
    votes_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track stream auction redirections
CREATE TABLE stream_auction_redirections (
    id SERIAL PRIMARY KEY,
    drop_id VARCHAR(255) NOT NULL,
    wave_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    redirected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stream_token_id INTEGER, -- NULL until minted
    status VARCHAR(50) DEFAULT 'pending', -- pending, minted, auction_active, auction_ended, claimed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drop_id, wave_id) -- Ensure one redirect per drop
    -- Note: pending auctions visible in main auction list for community transparency
);
```

#### New API Endpoints

```typescript
// Check if drop is eligible for stream auction
GET /api/waves/{waveId}/drops/{dropId}/stream-eligibility

// Redirect drop to stream auction
POST /api/waves/{waveId}/drops/{dropId}/redirect-to-stream
{
  // No parameters needed - contract has fixed values
  // starting_price: Retrieved from contract configuration
  // auction_duration: Retrieved from contract configuration
}

// Get stream auction data for redirected drop
GET /api/waves/{waveId}/drops/{dropId}/stream-auction

// List all stream auctions (active, collection, upcoming)
GET /api/stream-auctions
Query params:
  - status: active | collection | upcoming
  - page: number
  - limit: number
  - sort: price | end_time | created_at

// Get user's active bids
GET /api/stream-auctions/my-bids
Query params:
  - status: active | won | collection
  - page: number
  - limit: number
```

### Frontend Changes

#### New Components

1. **StreamEligibilityIndicator** - Shows on drop cards when eligible
2. **StreamRedirectModal** - Modal for confirming redirect with auction parameters
3. **StreamAuctionCard** - Display active/ended stream auctions with bid status indicators
4. **StreamAuctionList** - List view of all stream auctions
5. **StreamAuctionDetails** - Detailed view of single auction
6. **StreamAuctionParticipation** - Bidding interface
7. **StreamMyBids** - User's active bids dashboard
8. **StreamBidStatusIndicator** - Shows if user is current highest bidder

#### UI/UX Design Questions

**DECIDED**: 
- **Eligibility Indicator Placement**: Badge positioned in top right corner of drop card
- **Dual-State Badge Behavior**: Shows "Stream Eligible" for all viewers, becomes actionable for drop author with distinct visual treatment
- **Author Decision Authority**: Only drop author can redirect to auction, others see informational indicator only
- **Auction parameters (starting price, duration)**: Contract-level configuration (see Decided Requirements section)
- **Redirect Confirmation Modal**: Clear, transparent process explanation focusing on what happens next
- **Modal Content**: Immediate consequences, next steps, timeline, auction parameters, and specific team contact
- **Philosophy**: Present facts without pressure - users make informed decisions with full transparency

## User Interface Flows

### 1. Eligibility Detection

The eligibility indicator uses a badge positioned in the top right corner of the drop card. This placement ensures visibility without interfering with the main content or voting interactions. The badge serves dual purposes: informational for general viewers and actionable for the drop author.

```
Memes Wave Drop Card:
┌─────────────────────────────────────┐
│ [Drop Content]           [🎯 Stream]│
│                         [Eligible] │
│                                     │
│ [Voting Interface]                  │
│ [Vote Count] [Average Rating]       │
└─────────────────────────────────────┘

For Drop Author (actionable):
┌─────────────────────────────────────┐
│ [Drop Content]         [🎯 Stream]  │
│                       [Eligible]   │
│                       [Redirect]   │
│ [Voting Interface]                  │
│ [Vote Count] [Average Rating]       │
└─────────────────────────────────────┘
```

**Badge Behavior**:
- **For all viewers**: Shows "Stream Eligible" with subtle styling
- **For drop author**: Becomes clickable with distinct visual treatment (border, slight highlight)
- **Positioning**: Top right corner to avoid interference with content and voting
- **Persistent display**: Remains visible indefinitely once eligibility is achieved

### 2. Redirect Flow

The redirect confirmation modal provides complete transparency about the process, allowing users to make informed decisions without pressure. The modal focuses on clear communication of what happens next rather than persuasion.

```
User clicks "Redirect to Stream" button:
┌─────────────────────────────────────┐
│ Redirect to Stream Auction          │
│ ─────────────────────────────────── │
│ What happens immediately:            │
│ • Your drop is removed from         │
│   the leaderboard                   │
│ • Voters receive TDH refunds        │
│ • Your auction enters pending state │
│ ─────────────────────────────────── │
│ Next steps:                         │
│ • @username (profile link) will     │
│   contact you via DM                │
│ • Timeline: 1-3 business days       │
│ • They'll finalize auction setup    │
│ ─────────────────────────────────── │
│ Auction parameters:                 │
│ • Starting Price: 0.1 ETH           │
│ • Duration: 24 hours                │
│ • Set by contract (consistent)      │
│ ─────────────────────────────────── │
│ [Cancel] [Confirm Redirect]         │
└─────────────────────────────────────┘
```

**Modal Design Principles**:
- **Transparency**: Clear explanation of immediate and future consequences
- **No pressure**: Facts-only presentation, user makes informed choice
- **Specific contact**: Named team member with profile link to prevent social engineering
- **Timeline clarity**: Realistic expectations about manual process timing
- **Parameter visibility**: Contract-controlled auction settings displayed

### 3. Stream Auction Discovery

#### Integration Points

**Collections Section**:
- Stream auctions are a new collection type within the Collections navigation
- Accessible via Collections dropdown or direct URL: `/collections/stream-auctions`
- Fits naturally alongside existing collections (The Memes, Gradient, NextGen, etc.)
- Uses familiar collections browsing experience with filtering and sorting

**Index Page**:
- New section: "Live Stream Auctions" (primary discovery mechanism)
- Carousel of active auctions
- Link to full stream auction collection page

**Navigation Structure**:
- Main collections page: `/collections/stream-auctions`

**Primary Categories** (mutually exclusive):
- **Active** - Current auctions accepting bids
- **Upcoming** - Auctions being prepared for launch
- **Collection** - Completed auctions (minted NFTs)

**Cross-Category Filters** (apply within any category):
- Price range (starting price for Active/Upcoming, final price for Collection)
- Creator/author
- Time-based filters:
  - Active: Time remaining
  - Upcoming: Expected launch timeframe
  - Collection: Completion date

**User-Specific Views**:
- "My Bids" - User's auction participation across all categories
- "My Auctions" - Auctions user created across all categories

## Stream Auction Activity Wave

### Purpose
The Stream Auction Activity wave provides a public feed of auction events and activity, allowing community members to follow the auction ecosystem in real-time. This is a standard chat wave where the system automatically posts about auction events, and users can discuss around those posts.

### Wave Characteristics
- **Wave Type**: Standard chat wave (ApiWaveType.Chat)
- **Content**: System-generated posts about auction events with normal chat functionality
- **Interaction**: Full chat wave functionality - users can reply, quote, and discuss auction posts
- **Visibility**: Public chat wave that anyone can follow and engage with

### System-Generated Posts

**Redirect Announcement**:
- Posted in original memes wave when user chooses to redirect
- Content: Drop preview, redirect notification, link to auction in Collections
- Purpose: Provides closure to memes wave followers about redirected content

**Auction Activity Posts** (in Stream Auction Activity wave):
- **Auction Start**: "Auction for [Drop Title] has begun" with starting price, duration, auction link
- **New Bid**: "New bid of [Amount] ETH on [Drop Title]" with previous bid, current high bid, time remaining, bidder handle (if public)
- **Auction End**: "Auction for [Drop Title] has ended" with final price, winner, claim instructions
- **Claim Complete**: "NFT for [Drop Title] has been claimed by [Winner]" with final transaction details

### Post Content Format
Each auction activity post includes:
- **Auction Link**: Direct link to auction page in Collections section
- **Current Status**: Bid amount, time remaining, auction phase
- **Context**: Drop preview thumbnail, title, original author
- **Actionable Info**: Relevant buttons/links for viewing auction or placing bids
- **Community Data**: Bidder handles (if public), participation metrics

### Community Engagement
- Standard chat wave functionality allows discussion around auction events
- Users can reply, quote, and react to auction milestone posts
- Creates community space for auction-related conversation separate from personal notifications
- Provides transparency and social proof for auction ecosystem activity

## Stream Auction Page Structure

### Page Hierarchy

```
/collections/stream-auctions/
├── index.tsx (main auction listing)
├── [tokenId].tsx (individual auction details)
├── my-bids.tsx (user's active bids)
├── components/
│   ├── StreamAuctionCard.tsx
│   ├── StreamAuctionList.tsx
│   ├── StreamAuctionDetails.tsx
│   ├── StreamBiddingInterface.tsx
│   ├── StreamAuctionFilters.tsx
│   ├── StreamMyBids.tsx
│   └── StreamBidStatusIndicator.tsx
└── hooks/
    ├── useStreamAuctions.ts
    ├── useStreamAuction.ts
    ├── useStreamBidding.ts
    └── useMyBids.ts
```

### Main Auction Listing

```
Stream Auctions Page:
┌─────────────────────────────────────┐
│ [All] [My Bids] [Filters] [Sort]    │
│ ─────────────────────────────────── │
│ Active (12)                         │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ NFT │ │ NFT │ │ NFT │           │
│ │ $1.2│ │ $0.8│ │ $2.1│           │
│ │ 2h  │ │ 5h  │ │ 1d  │           │
│ │ 👑  │ │     │ │     │           │
│ └─────┘ └─────┘ └─────┘           │
│ ─────────────────────────────────── │
│ Upcoming (3)                        │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ NFT │ │ NFT │ │ NFT │           │
│ │SOON │ │SOON │ │SOON │           │
│ │ ⏳  │ │ ⏳  │ │ ⏳  │           │
│ └─────┘ └─────┘ └─────┘           │
│ ─────────────────────────────────── │
│ Collection (24)                     │
│ [Show More]                         │
└─────────────────────────────────────┘

Legend:
👑 = You're the highest bidder
⏳ = Auction setup in progress (team will contact author)
SOON = Upcoming auction being prepared
```

## Integration with Existing Systems

### Memes Wave Integration

**Modified Components**:
- **WaveDropsAll** - Add eligibility indicator badge to drop cards
- **WaveDropQuote** - Show stream auction status and link if drop has been redirected
- **WaveDropActions** - Add new action button "Redirect to Stream" for eligible drops (only visible to drop author)
- **WaveLeaderboard** - Remove redirected drops from leaderboard display and voting competition

**New Hooks**:
- **useStreamEligibility** - Check if drop is eligible
- **useStreamRedirect** - Handle redirect process
- **useStreamAuctionData** - Get auction data for redirected drops
- **useMyBids** - Get user's active bids and bid status
- **useBidStatus** - Check if user is highest bidder on specific auction

### Stream Auction Activity Wave Integration

**Wave Infrastructure**:
- **Wave Type**: Standard chat wave (ApiWaveType.Chat) with system-generated posts
- **Location**: Standard Waves section alongside other chat waves
- **Access**: Public chat wave available for following and discussion

**System Posting Mechanism**:
- **Redirect Posts**: Automated posts in original memes wave when redirects occur
- **Auction Activity Posts**: Automated posts in Stream Auction Activity wave for all auction events
- **Real-time Updates**: WebSocket integration for live auction event posting
- **Post Templates**: Standardized formats for different auction event types

**Integration Components**:
- **StreamAuctionWavePosting** - System service for generating auction activity posts in chat wave
- **useWaveAuctionIntegration** - Hook for managing wave-auction data flow
- **WaveAuctionPost** - Component for displaying auction activity posts in chat wave feed
- **AuctionEventProcessor** - Backend service for converting auction events to chat wave posts

### My Stream Integration

**Natural Feed Integration**:
- My Stream shows user's auction activity as part of their personal feed
- Auction events are treated as normal user activities alongside wave participation
- Links to auctions in Collections section for full auction management

**Feed Activity Types**:
- **Drop Redirected**: "You redirected [Drop Title] to stream auction" with link to auction
- **Auction Started**: "Your auction for [Drop Title] is now live" with current bid status
- **Auction Bid Received**: "New bid on your auction [Drop Title]: 1.2 ETH" 
- **Auction Won**: "You won the auction for [Drop Title] - 2.5 ETH"
- **Auction Ended**: "Your auction for [Drop Title] ended - final bid: 3.1 ETH"

**User Experience**:
- Auction activity appears chronologically with other user activities
- Each auction post links to the auction page in Collections
- Shows relevant auction context (current bid, time remaining, etc.)
- Maintains continuity between memes wave participation and auction outcomes

## Bid Tracking & Status Indicators

### User Bid Status
Users need clear visibility into their auction participation:

**Bid Status Types**:
- **Highest Bidder**: User's bid is currently winning (👑 crown icon)
- **Won**: User won the auction (🏆 trophy icon)
- **Lost**: User lost the auction (no special indicator)

**Note**: There is only one active bid per auction. When a user is outbid, their ETH is automatically refunded and they no longer have an active bid on that auction.

### My Bids Dashboard
**Page**: `/stream-auctions/my-bids`

**Features**:
- List of all auctions where user is currently the highest bidder
- List of auctions user has won
- List of auctions user has lost (participated in but didn't win)
- Real-time status updates (highest bidder, won, lost)
- Quick action buttons (increase bid, claim won auctions)
- Filtering by status (active, won, collection)
- Sorting by end time, bid amount, auction activity

### Bid Status Indicators
**Location**: On auction cards throughout the application

**Visual Indicators**:
- **Crown (👑)**: User is highest bidder
- **Trophy (🏆)**: User won the auction
- **None**: User has no active bid on this auction

### Real-time Updates
**Requirements**:
- Immediate status updates when outbid (user loses highest bidder status)
- Push notifications when outbid (ETH automatically refunded)
- Live auction countdown timers
- Automatic refresh when auction ends

## Technical Implementation Details

### Smart Contract Integration

**Contract Addresses Required**:
```typescript
const STREAM_CONTRACTS = {
  STREAM_CORE: "0x...",
  STREAM_MINTER: "0x...",
  STREAM_DROPS: "0x...",
  STREAM_AUCTIONS: "0x...",
  STREAM_ADMINS: "0x..."
};
```

**Required Functions**:
```typescript
// Create auction (backend only, requires tdhSigner)
async function createStreamAuction(
  poster: string,
  tokenData: string,
  collectionId: number,
  startingPrice: string,
  endTimestamp: number
): Promise<number> // returns tokenId

// Participate in auction (frontend)
async function placeBid(tokenId: number, bidAmount: string): Promise<void>

// Claim auction (frontend)
async function claimAuction(tokenId: number): Promise<void>

// Get auction state (frontend)
async function getAuctionState(tokenId: number): Promise<AuctionState>
```

### Data Flow

1. **Eligibility Check**: Scheduled job checks voting metrics for all memes wave drops
2. **User Notification**: Frontend polls for eligibility status
3. **Redirect Process**: User confirms redirect → immediate leaderboard removal → pending state in auctions
4. **Manual Processing**: Designated team member contacts author via DM to finalize auction setup
5. **Auction Creation**: Backend calls StreamDrops.mintDrop() with tdhSigner after manual verification
6. **UI Updates**: Auction status updates from pending to active

## Decision Status System

**Status Types:**
- `UNKNOWN` - Needs exploration and decision
- `DEFERRED` - Decision postponed with reason and fallback
- `DECIDED` - Resolved with implementation details

## Decided Requirements

### Auction Parameter Control
**Status**: DECIDED  
**Decision**: Contract-level configuration - starting price and duration are set at the smart contract level by contract admins  
**Rationale**: Ensures consistency across all auctions and eliminates user decision complexity during redirect flow  
**Implementation**: 
- Starting price: Configured in smart contract (e.g., 0.1 ETH fixed)
- Duration: Configured in smart contract (e.g., 24 hours fixed)
- No user input required during redirect process
- Contract admins can update parameters for future auctions if needed

## Deferred Decisions

### Voting Thresholds
**Status**: DEFERRED  
**Reason**: Requires analysis of existing memes wave data and user behavior patterns to establish optimal thresholds  
**Timeline**: Phase 2 - after initial implementation and data collection  
**Fallback**: Use conservative baseline of 100 votes over 7 days with 3.5+ average rating  
**Dependencies**: Need historical voting data analysis and A/B testing framework  
**Options Considered**: Various vote count and time period combinations from original analysis  

### Eligibility Timing
**Status**: DEFERRED  
**Reason**: Timing parameters depend on voting threshold decisions and user behavior analysis  
**Timeline**: Phase 2 - concurrent with voting threshold analysis  
**Fallback**: 
  - Eligibility checks start 24 hours after submission
  - Eligibility cannot be lost once achieved
  - No deadline to decide on redirect after eligibility (indefinite decision window)  
**Dependencies**: Voting threshold decisions, user research on decision-making patterns  
**Options Considered**: Immediate vs delayed checks, permanent vs temporary eligibility  

### Collection Management
**Status**: DECIDED  
**Decision**: Dedicated collection within Stream for memes wave auctions  
**Rationale**: Preserves memes identity while maintaining stream integration - creates focused collecting experience for meme-specific content  
**Implementation**: Create dedicated "Memes Wave Auctions" collection within Stream architecture  
**Dependencies**: Smart contract team to create new collection within Stream system  

### Permission Management
**Status**: DEFERRED  
**Reason**: Requires security review and operational procedures establishment  
**Timeline**: Phase 1 - must be resolved before backend implementation  
**Fallback**: 
  - Use existing tdhSigner from current Stream implementation
  - Maintain current admin permission structure
  - Manual contract upgrade process via multisig  
**Dependencies**: Security audit, operational runbook creation  
**Options Considered**: Centralized vs distributed permission models

### Discovery & Navigation
**Status**: DECIDED  
**Decision**: Collections integration as primary discovery mechanism  
**Rationale**: Stream auctions are NFT collections, making Collections section the natural home for auction discovery and browsing  
**Implementation**: 
  - Primary access through Collections section (`/collections/stream-auctions`)
  - Active auctions carousel on index page for discovery  
  - Contextual links from memes wave drops to specific auctions
  - Uses familiar collections browsing patterns (filtering, sorting, pagination)
**Benefits**: Leverages existing user mental models for NFT browsing, reduces navigation complexity

### Performance & Caching Strategy
**Status**: DEFERRED  
**Reason**: Need to establish optimal caching approach based on system load patterns and real-time update requirements  
**Timeline**: Phase 3 - after system is under production load  
**Fallback**: Simple caching approach with short TTL:
  - Static auction metadata: 1-hour cache
  - Dynamic auction state: 1-minute cache
  - WebSocket for real-time updates overlaid on cached data
  - Database query optimization for frequently accessed data
**Dependencies**: Load testing data, WebSocket implementation, performance monitoring  
**Options Considered**: Layered caching, event-driven invalidation, time-based with WebSocket overlay

## Unknown Requirements & Questions

### Business Logic

1. **Voting Thresholds**: 
   - **DEFERRED**: See Deferred Decisions section - using 100 votes over 7 days with 3.5+ rating as fallback

3. **Eligibility Timing**:
   - **DEFERRED**: See Deferred Decisions section - using 24-hour start delay, permanent eligibility, indefinite redirect decision window as fallback

### Technical Requirements

4. **Collection Management**:
   - **DECIDED**: Dedicated collection within Stream for memes wave auctions

5. **Permission Management**:
   - **DEFERRED**: See Deferred Decisions section - using existing tdhSigner and admin structure as fallback

6. **Error Handling**:
   - **DECIDED**: Manual intervention approach with pending state
   - **Process**: Immediate leaderboard removal → pending state in auctions section → team contact
   - **Timeline**: Auction creation can take several days, designated team member will contact author via DM
   - **Transparency**: Pending auctions visible in main auction list for community visibility
   - **Security**: Specific known username (not generic "team") contacts users to prevent social engineering

### UI/UX Decisions

7. **Discovery & Navigation**:
   - **DECIDED**: Collections integration as primary discovery mechanism - see Deferred Decisions section for implementation details

8. **Notifications**:
   - **DECIDED**: Integrated auction notification system with dedicated tab and real-time updates
   - **Implementation**: See Auction Notification System section for complete details

9. **Mobile Experience**:
    - **DECIDED**: Native app experience optimized for touch interactions with streamlined bidding flow
    - **Implementation**: See Mobile Auction Experience section for complete details

### Integration Details

10. **Data Consistency**:
    - **DECIDED**: Immediate atomic redirect operation
    - **Process**: When author confirms redirect, drop is immediately removed from leaderboard competition
    - **Vote Handling**: All existing votes are refunded to voters (same as winning in leaderboard)
    - **Voting Disabled**: Voting becomes impossible for the redirected drop card
    - **Metadata Preservation**: Redirected drops maintain their original metadata - same end result as leaderboard winners, just minted as 1/1 in stream contract instead of memes contract
    - **Operation Type**: Atomic transaction ensuring consistency - no intermediate states where drop exists in both systems

11. **Performance**:
    - **DEFERRED**: See Deferred Decisions section - using simple caching with 1-hour TTL for static data, 1-minute for dynamic data as fallback
    - Real-time auction updates via WebSocket

12. **Pending State Cancellation**:
    - **DECIDED**: No cancellation allowed once redirect is confirmed
    - **Rationale**: Redirect decision is final and irreversible, ensuring system simplicity and encouraging thoughtful decisions
    - **Implementation**: Once user confirms redirect, drop cannot return to leaderboard
    - **User Experience**: Clear messaging in confirmation modal that decision is permanent
    - **Benefits**: Eliminates technical complexity of vote restoration, reduces operational burden, maintains decision significance

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)
- Set up database schema
- Create basic API endpoints
- Implement eligibility detection logic
- Create basic UI components

### Phase 2: Core Features (3-4 weeks)
- Implement redirect flow
- Build auction listing pages
- Add bidding interface
- Integration with existing memes wave UI

### Phase 3: Advanced Features (2-3 weeks)
- Real-time updates
- Advanced filtering/sorting
- Mobile optimization
- Integration with my-stream

### Phase 4: Polish & Testing (1-2 weeks)
- Error handling
- Performance optimization
- User testing
- Bug fixes

## Auction Notification System

### Overview
The auction notification system integrates with the existing notification architecture to provide real-time updates about auction events. It leverages the current tabbed interface, WebSocket system, and push notification infrastructure.

**Important Distinction**: Personal notifications are separate from the Stream Auction Activity wave:
- **Personal Notifications**: User-specific alerts (outbid, won auction, your auction got bid) sent directly to individuals
- **Wave Activity**: Public feed of auction events that anyone can follow and discuss in the Stream Auction Activity wave
- **Purpose**: Notifications handle urgent personal alerts while wave activity provides community engagement and transparency

### Notification Types

#### New ApiNotificationCause Enum Values
```typescript
export enum ApiNotificationCause {
  // ... existing types
  StreamAuctionEligible = 'STREAM_AUCTION_ELIGIBLE', // Drop became eligible for stream auction
  StreamAuctionBid = 'STREAM_AUCTION_BID',           // Someone bid on your auction
  StreamAuctionOutbid = 'STREAM_AUCTION_OUTBID',     // You've been outbid
  StreamAuctionEnding = 'STREAM_AUCTION_ENDING',     // Auction ending soon (you're highest bidder)
  StreamAuctionWon = 'STREAM_AUCTION_WON',           // You won an auction
  StreamAuctionCreated = 'STREAM_AUCTION_CREATED',   // New auction from followed creator
}
```

#### Notification Scenarios

**1. STREAM_AUCTION_ELIGIBLE**
- **Trigger**: Drop achieves voting threshold and becomes eligible for stream auction
- **Recipients**: Drop author only
- **Timing**: Immediate when threshold is crossed
- **Content**: Drop preview, voting stats that qualified it, explanation of stream auction option
- **Actions**: View drop with eligibility badge, redirect to stream auction
- **Rationale**: Authors need to know their content qualified for monetization opportunity, as the eligibility badge alone might not be immediately noticed

**2. STREAM_AUCTION_BID**
- **Trigger**: Someone places a bid on user's auction
- **Recipients**: Auction creator
- **Timing**: Immediate
- **Content**: Bidder profile, bid amount, current highest bid
- **Actions**: View auction, respond to bidder

**3. STREAM_AUCTION_OUTBID**
- **Trigger**: User's bid is surpassed by higher bid
- **Recipients**: Previous highest bidder
- **Timing**: Immediate
- **Content**: Previous bid amount, new highest bid, refund confirmation
- **Actions**: Place new bid, view auction
- **Policy**: Single notification per outbid event - user receives no further notifications until they bid again

**4. STREAM_AUCTION_ENDING**
- **Trigger**: Auction has 1 hour remaining
- **Recipients**: Current highest bidder only
- **Timing**: 1 hour before auction ends
- **Content**: Current bid amount, time remaining
- **Actions**: View auction, increase bid

**5. STREAM_AUCTION_WON**
- **Trigger**: Auction ends and user is highest bidder
- **Recipients**: Winning bidder
- **Timing**: Immediate after auction ends
- **Content**: Final bid amount, claim instructions
- **Actions**: Claim NFT, view auction

**6. STREAM_AUCTION_CREATED**
- **Trigger**: Followed creator starts new auction
- **Recipients**: Creator's followers
- **Timing**: When auction becomes active
- **Content**: Creator profile, auction preview
- **Actions**: View auction, place bid

### UI Integration

#### Notification Filter Tab
Add "Auctions" tab to existing notification filters:
```typescript
const NotificationFilters: NotificationFilter[] = [
  { cause: [], title: "All" },
  // ... existing filters
  { 
    cause: [
      ApiNotificationCause.StreamAuctionEligible,
      ApiNotificationCause.StreamAuctionBid,
      ApiNotificationCause.StreamAuctionOutbid,
      ApiNotificationCause.StreamAuctionEnding,
      ApiNotificationCause.StreamAuctionWon,
      ApiNotificationCause.StreamAuctionCreated,
    ], 
    title: "Auctions" 
  },
];
```

#### Notification Components

**StreamAuctionBid Component**:
- Profile picture of bidder
- Bid amount and current highest bid
- Auction preview thumbnail
- "View Auction" action button

**StreamAuctionOutbid Component**:
- Outbid indicator icon
- Previous vs new bid amounts
- Refund confirmation message
- "Bid Again" action button

**StreamAuctionEnding Component**:
- Countdown timer
- Current bid amount
- Urgency indicator
- "Increase Bid" action button

**StreamAuctionWon Component**:
- Victory indicator
- Final bid amount
- Claim instructions
- "Claim NFT" action button

**StreamAuctionCreated Component**:
- Creator profile
- Auction preview
- Starting price and duration
- "View Auction" action button

### Real-time Updates

#### WebSocket Message Types
Add to existing `WsMessageType` enum:
```typescript
export enum WsMessageType {
  // ... existing types
  AUCTION_BID = "AUCTION_BID",
  AUCTION_ENDED = "AUCTION_ENDED",
  AUCTION_CREATED = "AUCTION_CREATED",
}
```

#### WebSocket Integration
- Real-time bid updates
- Auction countdown synchronization
- Immediate notification delivery
- Automatic UI state updates

### Push Notification Strategy

#### Critical Notifications (Push Enabled by Default)
- `STREAM_AUCTION_OUTBID`: Time-sensitive, requires immediate action
- `STREAM_AUCTION_ENDING`: 1-hour warning for current highest bidder
- `STREAM_AUCTION_WON`: Important outcome notification

#### Discovery Notifications (User Preference)
- `STREAM_AUCTION_BID`: Can be overwhelming for popular auctions
- `STREAM_AUCTION_CREATED`: Discovery feature, not critical

#### Mobile Push Notification Content
```typescript
// Example push notification payloads
{
  title: "You've been outbid!",
  body: "Your 0.5 ETH bid on 'Meme Title' has been surpassed",
  data: { auctionId: "123", type: "outbid", newBid: "0.8" }
}

{
  title: "Auction ending soon",
  body: "Your 1.2 ETH bid on 'Meme Title' is winning - 1 hour left",
  data: { auctionId: "123", type: "ending", timeLeft: "3600" }
}
```

### Notification Preferences

#### User Settings
```typescript
interface AuctionNotificationPreferences {
  auction_bids: boolean;                    // Notify when someone bids on my auction
  auction_outbid: boolean;                  // Notify when I'm outbid (always enabled)
  auction_ending: boolean;                  // Notify when auction ending soon (always enabled)
  auction_won: boolean;                     // Notify when I win (always enabled)
  followed_creator_auctions: boolean;       // Notify when followed creators start auctions
  push_notifications: boolean;              // Enable mobile push notifications
}
```

#### Default Settings
- Critical notifications (outbid, ending, won): Always enabled
- Discovery notifications: User preference
- Push notifications: Enabled by default for critical events

### Technical Implementation

#### Database Schema Updates
```sql
-- Add auction notification preferences
ALTER TABLE user_preferences ADD COLUMN auction_notification_settings JSONB DEFAULT '{
  "auction_bids": true,
  "auction_outbid": true,
  "auction_ending": true,
  "auction_won": true,
  "followed_creator_auctions": false,
  "push_notifications": true
}';
```

#### API Endpoints
```typescript
// Get user's auction notification preferences
GET /api/notifications/auction-preferences

// Update user's auction notification preferences
PUT /api/notifications/auction-preferences
{
  auction_bids: boolean;
  followed_creator_auctions: boolean;
  // ... other preferences
}
```

#### Component File Structure
```
components/brain/notifications/
├── stream-auction-bid/
│   └── NotificationStreamAuctionBid.tsx
├── stream-auction-outbid/
│   └── NotificationStreamAuctionOutbid.tsx
├── stream-auction-ending/
│   └── NotificationStreamAuctionEnding.tsx
├── stream-auction-won/
│   └── NotificationStreamAuctionWon.tsx
└── stream-auction-created/
    └── NotificationStreamAuctionCreated.tsx
```

### Performance Considerations

#### Notification Throttling
- Bid notifications: Maximum 1 per minute per auction
- Ending notifications: Single notification at 1-hour mark
- Created notifications: Batch for multiple auctions from same creator

#### Caching Strategy
- Cache auction data for notification rendering
- Prefetch auction previews for faster loading
- Use WebSocket updates to invalidate cache

### Testing Strategy

#### Unit Tests
- Individual notification component rendering
- Notification filtering and routing
- WebSocket message handling

#### Integration Tests
- End-to-end notification flow
- Push notification delivery
- Real-time WebSocket updates

#### User Testing
- Notification timing and frequency
- User preference effectiveness
- Mobile push notification clarity

## Mobile Auction Experience

### Overview
The mobile auction experience is designed as a native app experience optimized for touch interactions. It prioritizes speed and simplicity for time-sensitive auction bidding while maintaining the security and transparency of the desktop experience.

### Core Design Principles

#### Touch-First Interface
Mobile auction interfaces are designed specifically for touch interactions rather than adapted from desktop mouse/keyboard patterns. This means larger tap targets, swipe gestures where appropriate, and interaction patterns that feel natural on mobile devices.

#### Speed Over Complexity
Mobile users expect fast, intuitive actions especially during competitive bidding. The interface prioritizes quick decision-making over comprehensive information display, while keeping essential auction details easily accessible.

#### Notification-Driven Engagement
Mobile users rely heavily on push notifications to stay informed about auction activity. The mobile experience is built around the assumption that users will jump in and out of the app based on notifications rather than continuously monitoring auctions.

### Bidding Interface Design

#### Dynamic Bid Increments
The mobile bidding interface uses smart increment buttons that adapt to current auction values:

**Increment Calculation**:
- Base increment: 10% of current highest bid
- Aggressive rounding at higher amounts to create "nice numbers"
- Rounding becomes more aggressive as bid values increase

**Rounding Strategy**:
```typescript
// Example rounding logic
const calculateBidIncrement = (currentBid: number) => {
  const baseIncrement = currentBid * 0.1;
  
  if (currentBid < 1) {
    return Math.ceil(baseIncrement * 20) / 20; // Round to 0.05 ETH
  } else if (currentBid < 10) {
    return Math.ceil(baseIncrement * 10) / 10; // Round to 0.1 ETH
  } else if (currentBid < 100) {
    return Math.ceil(baseIncrement * 2) / 2; // Round to 0.5 ETH
  } else {
    return Math.ceil(baseIncrement); // Round to 1 ETH
  }
};
```

#### Bidding Interface Layout
```
Mobile Auction Bidding Interface:
┌─────────────────────────────────────┐
│ Current Bid: 1.2 ETH                │
│ Time Left: 2h 15m                   │
│ ─────────────────────────────────── │
│ Quick Bid Options:                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ +0.1 ETH│ │ +0.5 ETH│ │ +1.0 ETH│ │
│ │ (1.3)   │ │ (1.7)   │ │ (2.2)   │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ Custom Amount: [___] ETH        │ │
│ │ ┌─────────┐                     │ │
│ │ │ Bid Now │                     │ │
│ │ └─────────┘                     │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ Your Status: 🔴 Outbid             │
│ Last Bid: 1.0 ETH                  │
└─────────────────────────────────────┘
```

#### Increment Button Logic
- **Primary increment**: 10% rounded to nice number (most prominent button)
- **Secondary increments**: 5% and 20% rounded values (smaller buttons)
- **Custom amount**: Text input with validation for precise bidding
- **Minimum validation**: Ensures custom bids meet minimum increment requirements

### Notification Integration

#### Outbid Notification Policy
When a user's bid is surpassed, they receive a single push notification and are considered "out of the game" until they actively place a new bid.

**Notification Flow**:
1. User places bid and becomes highest bidder
2. Another user places higher bid
3. Original user receives immediate push notification: "You've been outbid on [Auction Title]"
4. User receives no further notifications about this auction until they bid again
5. If user places new bid, they re-enter notification flow

**Notification Content**:
```typescript
// Mobile push notification for outbid
{
  title: "You've been outbid!",
  body: "Your 1.2 ETH bid on 'Meme Title' has been surpassed",
  data: { 
    auctionId: "123", 
    type: "outbid", 
    yourBid: "1.2",
    newBid: "1.5",
    timeLeft: "7200" // seconds
  }
}
```

#### Notification Tap Behavior
- Tapping outbid notification opens auction detail with bidding interface pre-loaded
- Quick bid increment buttons immediately available
- Previous bid amount displayed for context

### Wallet Connection Handling

#### Connection Retry Strategy
Mobile wallet connections are inherently less reliable than desktop. The system implements intelligent retry logic to handle temporary connection issues.

**Retry Logic**:
- Initial connection timeout: 30 seconds
- Retry attempts: 3 times with exponential backoff (5s, 10s, 20s)
- Total retry window: ~60 seconds
- User feedback: Progress indicator with "connecting..." message

#### Bid Queue Management
When wallet connection issues occur during bidding, the system queues the bid and retries connection:

**Queue Process**:
1. User taps bid button
2. System captures bid amount and shows "processing..." state
3. If wallet connection fails, bid is queued for retry
4. System attempts reconnection with retry strategy
5. If reconnection succeeds and auction state unchanged, bid is submitted
6. If auction state changed during retry, bid is aborted

#### Error Handling and Messaging
When bid fails due to connection issues or auction state changes:

**Connection Failure**:
```
┌─────────────────────────────────────┐
│ ❌ Bid Failed                       │
│ ─────────────────────────────────── │
│ Wallet connection lost during       │
│ processing. Please try again.       │
│ ─────────────────────────────────── │
│ ┌─────────┐ ┌─────────┐            │
│ │ Retry   │ │ Cancel  │            │
│ └─────────┘ └─────────┘            │
└─────────────────────────────────────┘
```

**Auction State Change**:
```
┌─────────────────────────────────────┐
│ ❌ Bid Failed                       │
│ ─────────────────────────────────── │
│ Auction moved to 1.8 ETH while      │
│ processing your 1.5 ETH bid.        │
│ ─────────────────────────────────── │
│ Current bid: 1.8 ETH                │
│ ┌─────────┐ ┌─────────┐            │
│ │ Bid 2.0 │ │ Cancel  │            │
│ └─────────┘ └─────────┘            │
└─────────────────────────────────────┘
```

### Performance Optimizations

#### Touch Response
- Haptic feedback for button presses
- Immediate visual feedback (button states, loading spinners)
- Optimistic UI updates where safe

#### Network Efficiency
- Auction state updates via WebSocket to minimize latency
- Bid increment calculations performed locally
- Minimal API calls for bid submission

#### Battery Optimization
- Efficient WebSocket connection management
- Background app state handling
- Reduced polling when app is backgrounded

### User Experience Flows

#### Quick Rebid Flow
Common scenario: User gets outbid notification and wants to quickly rebid higher

1. User receives push notification about being outbid
2. Taps notification to open auction
3. App opens directly to bidding interface
4. Previous bid amount and current highest bid displayed
5. Suggested increment buttons ready for immediate tap
6. Single tap to submit higher bid
7. Wallet signature request with minimal friction

#### Auction Discovery Flow
User discovers new auction and wants to participate

1. User sees auction in main feed or gets creation notification
2. Taps auction card to view details
3. Auction detail page with key information and bidding interface
4. Time remaining prominently displayed
5. Current bid and increment options clear
6. Easy transition to bidding with single tap

### Testing Considerations

#### Device Testing
- iOS and Android wallet app compatibility
- Various screen sizes and orientations
- Touch target sizing for accessibility
- Performance on lower-end devices

#### Network Conditions
- Slow network connection handling
- Intermittent connectivity during bidding
- Wallet app backgrounding scenarios
- Connection switching (WiFi to cellular)

#### User Behavior Testing
- Rapid successive bidding scenarios
- Notification response times
- Wallet connection reliability across different wallet apps
- User comprehension of bid increment logic

### Implementation Priority

#### Phase 1: Core Bidding
- Basic mobile bidding interface with dynamic increments
- Wallet connection retry logic
- Simple error messaging

#### Phase 2: Experience Enhancement
- Optimized notification handling
- Haptic feedback integration
- Performance optimizations

#### Phase 3: Advanced Features
- Gesture-based interactions
- Advanced bid queuing
- Offline bid preparation

## Risk Mitigation

1. **Smart Contract Risk**: Thorough testing on testnets before mainnet deployment
2. **User Experience Risk**: Comprehensive user testing before launch
3. **Technical Risk**: Gradual rollout with feature flags
4. **Business Risk**: Clear communication about leaderboard removal
5. **Notification Risk**: Gradual rollout with opt-in for high-frequency notifications

---

This specification serves as the foundation for implementing the memes wave to stream auction integration. All unknowns should be resolved through stakeholder discussions before implementation begins.