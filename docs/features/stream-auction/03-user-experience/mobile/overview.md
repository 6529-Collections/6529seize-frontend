# Mobile Auction Experience Overview

The mobile experience for stream auctions prioritizes speed, simplicity, and touch-first interactions. This document outlines the key principles and differences from desktop.

## Core Design Principles

### 1. Touch-First Interface
Mobile interfaces are designed specifically for finger interaction, not adapted from mouse/keyboard patterns.

**Key Adaptations**:
- Minimum 44px tap targets
- Generous spacing between actions  
- Swipe gestures where natural
- Bottom-sheet patterns for actions
- Haptic feedback on key actions

### 2. Speed Over Complexity
Mobile users need fast, decisive actions during competitive bidding scenarios.

**Optimizations**:
- One-tap rebid from notifications
- Pre-calculated bid amounts
- Minimal confirmation steps
- Persistent wallet connections
- Offline bid preparation

### 3. Notification-Driven
Mobile users rely on push notifications rather than constant monitoring.

**Notification Strategy**:
- Immediate outbid alerts
- 1-hour ending warnings
- Win confirmations
- Smart notification batching
- Deep links to specific actions

## Key Differences from Desktop

### Information Hierarchy
**Desktop**: Full information display  
**Mobile**: Progressive disclosure

Example:
- Desktop shows full bid history
- Mobile shows last 3 bids + "View All"

### Interaction Patterns  
**Desktop**: Hover states, tooltips  
**Mobile**: Tap to reveal, long-press

Example:
- Desktop hover shows bid details
- Mobile tap expands bid info

### Navigation
**Desktop**: Multi-column layouts  
**Mobile**: Single column, vertical scroll

Example:
- Desktop shows filters sidebar
- Mobile uses bottom sheet filters

## Mobile-Specific Features

### Quick Actions Bar
Fixed bottom bar with primary actions:
```
┌─────────────────────────────────────┐
│                                     │
│         [Auction Content]           │
│                                     │
├─────────────────────────────────────┤
│ [Bid Now] [Share] [Watch] [More]   │
└─────────────────────────────────────┘
```

### Pull-to-Refresh
- Updates current bid amount
- Refreshes time remaining  
- Shows latest bid activity
- Smooth animation feedback

### Gesture Support
- Swipe between auctions
- Pull down to refresh
- Long press for options
- Pinch to zoom images

### Offline Capabilities
- Cache viewed auctions
- Queue bids when offline
- Sync when connected
- Show connection status

## Performance Optimizations

### Image Loading
- Progressive image loading
- Lower resolution previews
- Lazy load off-screen content
- WebP format when supported

### Data Usage
- Compressed API responses
- Minimal WebSocket data
- Optional high-quality images
- Batch status updates

### Battery Life
- Efficient background updates
- Reduced animation when low
- Dark mode for OLED screens
- Smart notification grouping

## Platform-Specific Considerations

### iOS
- Native feel with iOS patterns
- Face ID for wallet unlock
- Haptic Engine feedback
- iOS share sheet integration

### Android  
- Material Design patterns
- Fingerprint authentication
- Android notification channels
- Native sharing options

## Common Mobile Scenarios

### Scenario 1: Notification Response
User gets "You've been outbid" notification:
1. Tap notification → Opens auction
2. See current bid and quick options
3. One tap to select new amount
4. Face ID/Touch ID to confirm
5. Back to what they were doing

**Time to complete**: <15 seconds

### Scenario 2: Browse During Commute
User browsing auctions on transit:
1. Open app to auction list
2. Swipe through active auctions
3. Tap interesting ones for details
4. Add to watch list
5. Get notifications for updates

**Optimized for**: One-handed use

### Scenario 3: Last-Minute Bidding
Auction ending while user is out:
1. Get "Ending soon" notification
2. Quick bid from notification
3. Use preset bid amounts
4. Instant wallet signature
5. Confirmation in-app

**Critical**: Speed and reliability

## Responsive Breakpoints

### Phone (320-767px)
- Single column layout
- Bottom sheet modals
- Stacked information
- Full-width buttons

### Tablet (768-1024px)  
- Two column grids
- Side panel details
- Landscape optimization
- Larger tap targets

### Adaptation Strategy
- Mobile-first development
- Progressive enhancement
- Feature detection
- Graceful degradation

---

[Next: Quick bidding interface →](quick-bidding.md)  
[See notification handling →](notifications.md)  
[Back to desktop experience →](../desktop/)