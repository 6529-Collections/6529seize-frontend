# Mobile Notification Strategy

This document outlines the notification system for stream auctions on mobile devices, focusing on timely alerts and actionable responses.

## Notification Types

### 1. Eligibility Achieved
**Trigger**: Drop reaches voting threshold  
**Recipients**: Drop creator only  
**Priority**: Medium

```
┌─────────────────────────────────────┐
│ 🎯 Stream Auction Eligible!         │
│ Your meme can now be auctioned     │
│                                    │
│ [View Options] [Later]             │
└─────────────────────────────────────┘
```

**Deep Link Action**: Opens drop with redirect modal

### 2. Outbid Alert
**Trigger**: User's bid is exceeded  
**Recipients**: Previous highest bidder  
**Priority**: High

```
┌─────────────────────────────────────┐
│ 🔴 Outbid on "Meme Title"          │
│ New bid: 1.8 ETH (yours: 1.5 ETH)  │
│ 2h 15m remaining                   │
│                                    │
│ [Bid 2.0 ETH] [View]               │
└─────────────────────────────────────┘
```

**Features**:
- Shows bid differential
- Time remaining crucial
- Quick bid action
- Single notification per outbid

### 3. Auction Ending Soon
**Trigger**: 1 hour before end  
**Recipients**: Current highest bidder  
**Priority**: High

```
┌─────────────────────────────────────┐
│ ⏰ Auction Ending Soon!             │
│ You're winning with 2.5 ETH        │
│ 59 minutes left                    │
│                                    │
│ [View Auction] [Dismiss]           │
└─────────────────────────────────────┘
```

**Timing**: Exactly 1 hour before end

### 4. Auction Won
**Trigger**: Auction ends with user as winner  
**Recipients**: Winning bidder  
**Priority**: High

```
┌─────────────────────────────────────┐
│ 🏆 You Won the Auction!            │
│ "Meme Title" - 3.2 ETH            │
│                                    │
│ [Claim NFT] [View Details]         │
└─────────────────────────────────────┘
```

**Persistent**: Stays until claimed

### 5. New Bid on Your Auction
**Trigger**: Someone bids on creator's auction  
**Recipients**: Auction creator  
**Priority**: Medium

```
┌─────────────────────────────────────┐
│ 💰 New bid on your auction         │
│ @bidder bid 1.5 ETH                │
│ 5 bidders competing                │
│                                    │
│ [View Activity] [Dismiss]          │
└─────────────────────────────────────┘
```

### 6. Creator Started Auction
**Trigger**: Followed creator's auction goes live  
**Recipients**: Creator's followers  
**Priority**: Low

```
┌─────────────────────────────────────┐
│ 🎨 @creator started an auction     │
│ "Meme Title" - Starting at 0.1 ETH │
│                                    │
│ [View Auction] [Dismiss]           │
└─────────────────────────────────────┘
```

## Notification Behavior

### Outbid Policy
**Single Notification Rule**:
1. User places bid → becomes highest bidder
2. Someone outbids them → user gets ONE notification
3. No further notifications until user bids again
4. Prevents notification spam

**Rationale**: Users who don't respond to outbid are "out of the game"

### Grouping Strategy
When multiple notifications arrive:
```
┌─────────────────────────────────────┐
│ 📬 3 Stream Auction Updates        │
│ • Outbid on 2 auctions            │
│ • Won "Meme Title"                │
│                                    │
│ [View All] [Clear]                 │
└─────────────────────────────────────┘
```

### Quiet Hours
- Respect system DND settings
- Critical only during quiet hours
- Batch non-critical for morning
- User preference override

## Deep Linking

### Link Structure
```
app://auctions/{auctionId}?action={action}

Examples:
app://auctions/123?action=bid
app://auctions/123?action=view
app://auctions/123?action=claim
```

### Action Handling
- `bid`: Opens with bid interface expanded
- `view`: Standard auction view
- `claim`: Direct to claim flow
- Invalid auction: Graceful fallback

## Push Notification Payload

### iOS (APNS)
```json
{
  "aps": {
    "alert": {
      "title": "🔴 Outbid on Auction",
      "body": "New bid: 1.8 ETH (yours: 1.5 ETH)",
      "action": "Bid Again"
    },
    "sound": "default",
    "badge": 1,
    "category": "AUCTION_OUTBID"
  },
  "data": {
    "auctionId": "123",
    "currentBid": "1.8",
    "yourBid": "1.5",
    "timeLeft": 7920
  }
}
```

### Android (FCM)
```json
{
  "notification": {
    "title": "🔴 Outbid on Auction",
    "body": "New bid: 1.8 ETH (yours: 1.5 ETH)",
    "icon": "notification_icon",
    "color": "#FF5733"
  },
  "data": {
    "type": "AUCTION_OUTBID",
    "auctionId": "123",
    "currentBid": "1.8",
    "yourBid": "1.5",
    "timeLeft": 7920,
    "clickAction": "AUCTION_BID"
  },
  "priority": "high"
}
```

## In-App Notification Display

### Banner Style
```
┌─────────────────────────────────────┐
│ 🔴 Outbid!  New: 1.8 ETH  [Bid]  X │
└─────────────────────────────────────┘
```

- Appears at top
- Auto-dismiss after 5s
- Tappable for action
- Swipe to dismiss

### Notification Center
In-app notification list:
- Chronological order
- Unread indicators
- Swipe actions
- Bulk management

## Performance Considerations

### Battery Impact
- Use high priority sparingly
- Batch low-priority updates
- Respect power saving modes
- Efficient payload size

### Network Efficiency
- Delta updates only
- Compress payloads
- Use notification extensions
- Cache notification data

### Delivery Optimization
- Regional delivery times
- Retry failed deliveries
- Track delivery rates
- Handle token refreshes

## User Preferences

### Granular Controls
```
┌─────────────────────────────────────┐
│ Auction Notifications              │
│ ═══════════════════════════════════ │
│                                    │
│ Outbid Alerts            [ON] ━━━○ │
│ Auction Ending           [ON] ━━━○ │
│ Won Auctions            [ON] ━━━○ │
│ New Bids (my auctions)  [ON] ━━━○ │
│ Creator Auctions         [OFF]━━━● │
│                                    │
│ Quiet Hours                        │
│ 10:00 PM - 8:00 AM     [ON] ━━━○ │
└─────────────────────────────────────┘
```

### Quick Mute Options
- Mute specific auction
- Snooze all for 1 hour
- Disable until tomorrow
- Weekend-only mode

## Analytics & Monitoring

### Key Metrics
- Delivery success rate
- Open rate by type
- Action rate (bid from notif)
- Opt-out rate

### User Behavior
- Response time to outbid
- Notification to bid conversion  
- Preference patterns
- Engagement by time of day

---

[Back to quick bidding →](quick-bidding.md)  
[See activity wave →](../activity-wave.md)  
[Technical implementation →](../../04-technical/api/webhooks.md)