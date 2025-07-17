# Bidding Interface Design

This document details the user interface for placing bids on stream auctions.

## Bidding Component

### Default State (Not Bidding)
```
┌─────────────────────────────────────┐
│ Current Bid: 1.2 ETH               │
│ Time Remaining: 2h 15m             │
│                                    │
│ ┌─────────────────────────────────┐│
│ │        [Place Bid]               ││
│ └─────────────────────────────────┘│
│                                    │
│ Min bid: 1.32 ETH (+10%)           │
└─────────────────────────────────────┘
```

### Expanded Bidding State
```
┌─────────────────────────────────────┐
│ Current Bid: 1.2 ETH               │
│ Time Remaining: 2h 15m             │
│                                    │
│ Quick Bid Options:                 │
│ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │1.32Ξ│ │1.5Ξ │ │2.0Ξ │          │
│ │+10% │ │+25% │ │+67% │          │
│ └─────┘ └─────┘ └─────┘          │
│                                    │
│ Custom Amount:                     │
│ ┌─────────────────────────────────┐│
│ │ ETH: [          ] ($2,400)      ││
│ └─────────────────────────────────┘│
│                                    │
│ ┌─────────────────────────────────┐│
│ │      [Confirm Bid: 1.5 ETH]     ││
│ └─────────────────────────────────┘│
│                                    │
│ ⓘ Bids are binding. Previous bid  │
│   will be refunded if outbid.      │
└─────────────────────────────────────┘
```

## Bidding Flow

### 1. Initial Click
User clicks "Place Bid" button:
- Component expands to show options
- Quick bid buttons calculate increments
- Custom input field appears
- Wallet connection check

### 2. Amount Selection

#### Quick Bid Buttons
Dynamic calculations based on current bid:
- **Button 1**: Minimum increment (10%)
- **Button 2**: Moderate increase (25%)
- **Button 3**: Aggressive bid (50-100%)

Amounts round to clean numbers:
- 1.2 → 1.32, 1.5, 2.0
- 5.5 → 6.1, 6.9, 8.3
- 10 → 11, 12.5, 15

#### Custom Input
- Validates minimum increment
- Shows USD equivalent
- Real-time validation
- Clear error messages

### 3. Confirmation Step
```
┌─────────────────────────────────────┐
│ Confirm Your Bid                   │
│ ────────────────────────────────── │
│                                    │
│ You're bidding: 1.5 ETH           │
│ (~$3,000 USD)                      │
│                                    │
│ Current highest: 1.2 ETH           │
│ Your increase: +25%                │
│                                    │
│ ⚠️ This bid is binding if you win  │
│                                    │
│ [Cancel]    [Confirm & Sign]       │
└─────────────────────────────────────┘
```

### 4. Wallet Interaction
- Clear signing request
- Gas estimate shown
- Processing state
- Success/error handling

## Bid Status Indicators

### You're Winning
```
┌─────────────────────────────────────┐
│ 👑 You're the highest bidder!      │
│ Your Bid: 2.5 ETH                 │
│ Time Remaining: 1h 23m             │
│                                    │
│ [Increase Bid] (optional)          │
└─────────────────────────────────────┘
```

### You've Been Outbid
```
┌─────────────────────────────────────┐
│ 🔴 You've been outbid              │
│ Current: 2.8 ETH                   │
│ Your Last: 2.5 ETH (refunded)      │
│                                    │
│ [Bid Again] Min: 3.08 ETH          │
└─────────────────────────────────────┘
```

### No Active Bid
```
┌─────────────────────────────────────┐
│ Current Bid: 2.8 ETH               │
│ 5 bidders competing                │
│                                    │
│ [Place First Bid]                  │
└─────────────────────────────────────┘
```

## Real-time Updates

### WebSocket Integration
- Current bid updates instantly
- Time remaining syncs across users
- Bid notifications appear inline
- Status changes immediate

### Update Animations
- Price changes highlight briefly
- New bid flash notification
- Countdown urgent at <5 min
- Status transitions smooth

## Error States

### Insufficient Balance
```
┌─────────────────────────────────────┐
│ ❌ Insufficient Balance             │
│ You have: 0.8 ETH                  │
│ Bid requires: 1.32 ETH             │
│                                    │
│ [Add Funds]  [Lower Bid]           │
└─────────────────────────────────────┘
```

### Bid Too Low
```
┌─────────────────────────────────────┐
│ ❌ Bid Too Low                      │
│ Minimum bid is 1.32 ETH            │
│ (10% above current)                │
│                                    │
│ [Update Amount]                    │
└─────────────────────────────────────┘
```

### Auction Ended
```
┌─────────────────────────────────────┐
│ 🏁 Auction Ended                    │
│ Winning Bid: 3.2 ETH              │
│ Winner: @username                  │
│                                    │
│ [View Results]                     │
└─────────────────────────────────────┘
```

## Bidding Guidelines Display

### First-Time Bidder
Show educational tooltip:
```
┌─────────────────────────────────────┐
│ 💡 How Bidding Works               │
│                                    │
│ • Each bid must exceed current     │
│   by at least 10%                  │
│ • You can only have one active     │
│   bid per auction                  │
│ • Outbid? Auto-refund in same tx   │
│ • Winners must claim NFT after     │
│                                    │
│ [Got it]                           │
└─────────────────────────────────────┘
```

## Mobile Considerations

### Touch-Optimized Layout
- Larger tap targets (min 44px)
- Quick bid buttons prominent
- Number input with number pad
- Simplified confirmation flow

### Responsive Behavior
- Stack elements vertically
- Full-width buttons
- Collapsible information
- Swipe gestures for quick bids

## Accessibility

### Keyboard Navigation
- Tab through all options
- Enter to confirm
- Escape to cancel
- Arrow keys for quick amounts

### Screen Reader Support
- Clear action labels
- Status announcements
- Error descriptions
- Time remaining updates

### Visual Accessibility
- High contrast mode
- Clear focus indicators
- Error states not just color
- Important info not just icons

---

[Back to auction discovery →](auction-discovery.md)  
[See mobile bidding →](../mobile/quick-bidding.md)  
[Technical implementation →](../../04-technical/components/hooks.md#bidding)