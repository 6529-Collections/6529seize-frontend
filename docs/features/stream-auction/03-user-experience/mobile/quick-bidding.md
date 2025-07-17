# Mobile Quick Bidding Interface

This document details the touch-optimized bidding interface designed for rapid mobile interactions.

## Quick Bid Interface Design

### Collapsed State
```
┌─────────────────────────────────────┐
│ Current Bid: 1.2 ETH               │
│ Ends in: 2h 15m                    │
│                                    │
│ ┌─────────────────────────────────┐│
│ │        [Place Bid]               ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Expanded Bidding State
```
┌─────────────────────────────────────┐
│ Current Bid: 1.2 ETH               │
│ ⏱ 2h 15m left                      │
│ ═══════════════════════════════════ │
│                                    │
│ Select Your Bid:                   │
│                                    │
│ ┌─────────────────────────────────┐│
│ │     1.32 ETH      │ Min (+10%)  ││
│ └─────────────────────────────────┘│
│                                    │
│ ┌─────────────────────────────────┐│
│ │     1.5 ETH       │ +25%        ││
│ └─────────────────────────────────┘│
│                                    │
│ ┌─────────────────────────────────┐│
│ │     2.0 ETH       │ Strong Bid  ││
│ └─────────────────────────────────┘│
│                                    │
│ ┌─────────────────────────────────┐│
│ │    Custom Amount...              ││
│ └─────────────────────────────────┘│
│                                    │
│ Your last bid: 1.0 ETH (refunded)  │
└─────────────────────────────────────┘
```

## Dynamic Bid Increments

### Increment Calculation Logic
```typescript
// Mobile-optimized rounding for clean amounts
const calculateMobileIncrements = (currentBid: number) => {
  const base = currentBid * 0.1; // 10% minimum
  
  return {
    min: roundToNiceNumber(currentBid * 1.1),
    moderate: roundToNiceNumber(currentBid * 1.25),
    aggressive: roundToNiceNumber(currentBid * 1.5)
  };
};

const roundToNiceNumber = (value: number) => {
  if (value < 1) return Math.ceil(value * 20) / 20; // 0.05
  if (value < 10) return Math.ceil(value * 10) / 10; // 0.1
  if (value < 100) return Math.ceil(value * 2) / 2; // 0.5
  return Math.ceil(value); // 1.0
};
```

### Button Design Principles
- Large touch targets (60px height)
- Clear value + context label
- Visual hierarchy (min bid subtle)
- Haptic feedback on tap
- Loading state during processing

## Custom Amount Input

### Number Pad Interface
```
┌─────────────────────────────────────┐
│ Enter Bid Amount                    │
│ ┌─────────────────────────────────┐│
│ │ ETH: 1.5_        │ ≈ $3,000     ││
│ └─────────────────────────────────┘│
│                                    │
│ ┌───┐ ┌───┐ ┌───┐                 │
│ │ 1 │ │ 2 │ │ 3 │                 │
│ └───┘ └───┘ └───┘                 │
│ ┌───┐ ┌───┐ ┌───┐                 │
│ │ 4 │ │ 5 │ │ 6 │                 │
│ └───┘ └───┘ └───┘                 │
│ ┌───┐ ┌───┐ ┌───┐                 │
│ │ 7 │ │ 8 │ │ 9 │                 │
│ └───┘ └───┘ └───┘                 │
│ ┌───┐ ┌───┐ ┌───┐                 │
│ │ . │ │ 0 │ │ ← │                 │
│ └───┘ └───┘ └───┘                 │
│                                    │
│ Min: 1.32 ETH                      │
│ ┌─────────────────────────────────┐│
│ │          [Confirm]               ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Input Features
- Custom number pad (not system keyboard)
- Real-time validation
- USD conversion display
- Minimum bid enforcement
- Decimal precision limits

## Confirmation Flow

### Biometric Confirmation
```
┌─────────────────────────────────────┐
│ Confirm Bid: 1.5 ETH              │
│                                    │
│     ┌─────────────────┐            │
│     │   [Face ID]     │            │
│     │   Authenticate  │            │
│     │   to Bid        │            │
│     └─────────────────┘            │
│                                    │
│ Current highest: 1.2 ETH           │
│ Your increase: +25%                │
│                                    │
│ [Cancel]                           │
└─────────────────────────────────────┘
```

### Processing State
```
┌─────────────────────────────────────┐
│      Placing Your Bid...           │
│                                    │
│         ┌───────────┐              │
│         │ [Spinner] │              │
│         └───────────┘              │
│                                    │
│    Confirming with wallet...       │
│                                    │
│    [Cancel Transaction]            │
└─────────────────────────────────────┘
```

## Notification-Triggered Bidding

### Outbid Notification Action
When user taps an outbid notification:

```
┌─────────────────────────────────────┐
│ You've been outbid!                │
│ New highest: 1.8 ETH               │
│ ═══════════════════════════════════ │
│                                    │
│ Quick Response:                    │
│                                    │
│ ┌─────────────────────────────────┐│
│ │   Bid 2.0 ETH    │ Beat by 10% ││
│ └─────────────────────────────────┘│
│                                    │
│ ┌─────────────────────────────────┐│
│ │   Bid 2.3 ETH    │ Strong bid  ││
│ └─────────────────────────────────┘│
│                                    │
│ [View Auction] [Dismiss]           │
└─────────────────────────────────────┘
```

### One-Tap Rebid
- Pre-calculated amounts based on new price
- Single tap to bid
- Biometric auth if enabled
- Return to previous app

## Gesture Interactions

### Swipe to Bid
Experimental feature for power users:
- Swipe up from bottom to reveal bid options
- Swipe right on amount to confirm
- Haptic feedback on selection
- Cancel with swipe down

### Long Press Options
Long press on current bid shows:
- Bid history (last 5)
- Number of unique bidders
- Time since last bid
- Share auction link

## Error Handling

### Connection Issues
```
┌─────────────────────────────────────┐
│ ⚠️ Connection Issue                 │
│                                    │
│ Retrying your bid...               │
│ [=====>          ] 40%             │
│                                    │
│ Attempt 2 of 3                     │
│                                    │
│ [Try Different Network] [Cancel]   │
└─────────────────────────────────────┘
```

### Bid Failed States
- Clear error messaging
- Actionable recovery options
- Current auction state shown
- One-tap retry with new amount

## Performance Optimizations

### Instant Feedback
- Optimistic UI updates
- Haptic response immediate
- Visual feedback <100ms
- Background processing

### Offline Queuing
- Store bid intent locally
- Retry when connected
- Clear queue status
- Expiry handling

### Battery Efficiency
- Reduce animations on low battery
- Batch network requests
- Efficient WebSocket usage
- Smart retry backoff

## Accessibility Features

### VoiceOver Support
- Clear button labels
- Bid amount announcements
- Status change alerts
- Gesture hints

### Dynamic Type
- Buttons scale with text size
- Layout adapts to preference
- Minimum tap targets maintained
- Critical info always visible

### Reduce Motion
- Simplified transitions
- No automatic animations
- Clear state changes
- Focus on functionality

---

[Next: Notification handling →](notifications.md)  
[Back to mobile overview →](overview.md)  
[See desktop bidding →](../desktop/bidding-interface.md)