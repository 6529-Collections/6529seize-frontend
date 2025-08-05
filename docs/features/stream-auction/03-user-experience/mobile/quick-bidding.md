# Quick Bidding on Mobile

Here's how the bidding interface works on phones - optimized for speed.

## The Bidding Button

### Before You Tap
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

### After You Tap
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

## Smart Bid Amounts

We calculate three bid options for you:
- **Minimum**: Just enough to outbid (10% more)
- **Moderate**: A solid increase (25% more)
- **Strong**: Make a statement (50% more)

The amounts round to nice clean numbers. So instead of 1.32847 ETH, you see 1.35 ETH.

Each button is big enough to tap easily, shows the amount clearly, and tells you what kind of bid it is.

## Entering Your Own Amount

### Custom Number Pad
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

What makes this number pad special:
- Built just for bidding (not your regular keyboard)
- Shows USD value as you type
- Won't let you bid too low
- Handles decimals sensibly

## Quick Confirmation

When you're ready to bid:
```
┌─────────────────────────────────────┐
│ Confirm Bid: 1.5 ETH              │
│                                    │
│ Current highest: 1.2 ETH           │
│ Your increase: +25%                │
│                                    │
│ [Cancel]    [Confirm Bid]          │
└─────────────────────────────────────┘
```

While your bid processes:
```
┌─────────────────────────────────────┐
│      Placing Your Bid...           │
│                                    │
│         ┌───────────┐              │
│         │ [Spinner] │              │
│         └───────────┘              │
│                                    │
│    Processing transaction...       │
└─────────────────────────────────────┘
```

## Bidding from Notifications

When someone outbids you and you tap the notification:

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

The beauty of this:
- Amounts already calculated based on the new price
- One tap places your bid
- Takes you right back to what you were doing

## Quick Gestures

### Press and Hold
Press and hold the current bid to see:
- Recent bid history
- How many people are bidding
- When the last bid happened
- Option to share the auction

## When Things Go Wrong

### Bad Connection
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

### If Your Bid Fails
We'll tell you exactly what went wrong and how to fix it. You'll see the current auction status and can retry with a new amount in one tap.

## Keeping It Fast

### Instant Response
Everything feels instant - the interface updates right away while we process your bid in the background.

### Easy on Your Battery
We're smart about power usage:
- Fewer animations when battery is low
- Efficient network usage
- Smart retry timing

## Works for Everyone

### Screen Readers
Everything's properly labeled and announced. Bid amounts, status changes, and available actions are all clear.

### Large Text Support
If you use larger text sizes, the whole interface scales properly. Buttons stay tappable and important info stays visible.

### Reduced Motion
If you prefer less movement, we turn off animations but keep everything functional and clear.

---

[Next: Notification handling →](notifications.md)  
[Back to mobile overview →](overview.md)  
[See desktop bidding →](../desktop/bidding-interface.md)