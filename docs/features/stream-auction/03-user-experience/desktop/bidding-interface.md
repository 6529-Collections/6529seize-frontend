# How to Place Bids

Here's what the bidding interface looks like and how it works.

## What You See

### When You're Not Bidding Yet
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

### When You Click "Place Bid"
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

## How It Works

### Step 1: Click to Start
When you click "Place Bid", the interface expands to show your options. We check your wallet connection at the same time.

### Step 2: Pick Your Amount

#### Quick Options
We give you three quick bid buttons that make sense:
- First button: The minimum you can bid (10% more than current)
- Second button: A solid increase (25% more)
- Third button: A strong bid to really compete (50-100% more)

We round to nice clean numbers. So if the current bid is 1.2 ETH, you'll see options like 1.32, 1.5, and 2.0 instead of weird decimals.

#### Or Enter Your Own
Type any amount you want (as long as it's at least 10% higher). You'll see the USD value update as you type, and we'll tell you right away if your bid is too low.

### Step 3: Double-Check Before Bidding
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

### Step 4: Sign with Your Wallet
Your wallet pops up with the transaction to sign. You'll see the gas cost estimate. After you sign, we show a spinner while it processes, then either a success message or an error if something went wrong.

## Your Bid Status

### When You're Winning
```
┌─────────────────────────────────────┐
│ 👑 You're the highest bidder!      │
│ Your Bid: 2.5 ETH                 │
│ Time Remaining: 1h 23m             │
│                                    │
│ [Increase Bid] (optional)          │
└─────────────────────────────────────┘
```

### When Someone Outbids You
```
┌─────────────────────────────────────┐
│ 🔴 You've been outbid              │
│ Current: 2.8 ETH                   │
│ Your Last: 2.5 ETH (refunded)      │
│                                    │
│ [Bid Again] Min: 3.08 ETH          │
└─────────────────────────────────────┘
```

### When You Haven't Bid Yet
```
┌─────────────────────────────────────┐
│ Current Bid: 2.8 ETH               │
│ 5 bidders competing                │
│                                    │
│ [Place First Bid]                  │
└─────────────────────────────────────┘
```

## Live Updates

Everything updates in real-time:
- Current bid changes instantly when someone bids
- Timer counts down for everyone at the same time
- You see notifications right in the interface
- Your status updates immediately

When things change:
- The price flashes briefly so you notice
- New bids get a quick highlight
- Timer turns red when under 5 minutes
- Everything animates smoothly

## When Things Go Wrong

### Not Enough ETH
```
┌─────────────────────────────────────┐
│ ❌ Insufficient Balance             │
│ You have: 0.8 ETH                  │
│ Bid requires: 1.32 ETH             │
│                                    │
│ Add ETH to your wallet to bid      │
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

## Help for New Bidders

If it's your first time, we show a quick explanation:
```
┌─────────────────────────────────────┐
│ 💡 How Bidding Works               │
│                                    │
│ • Each bid must exceed current     │
│   by at least 10%                  │
│ • You can only have one active     │
│   bid per auction                  │
│ • Outbid? Auto-refund in same tx   │
│                                    │
│ [Got it]                           │
└─────────────────────────────────────┘
```

## Works on Your Phone

On mobile, everything's optimized for touch:
- Big buttons you can actually tap
- Quick bid options right up front
- Number pad pops up for custom amounts
- Simpler confirmation process

The layout adjusts too:
- Everything stacks vertically
- Buttons stretch full width
- Less important info collapses
- Maybe swipe for quick bid amounts

## Making It Accessible

We make sure everyone can bid:

**Keyboard users**: Tab through everything, Enter to confirm, Escape to cancel, arrow keys for amounts.

**Screen readers**: Everything's labeled clearly. Status changes get announced. Errors are fully described. Time updates are readable.

**Visual needs**: High contrast mode available. You can see what's focused. Errors aren't just red - they have icons and text. Important stuff isn't just shown with icons.

---

[Back to auction discovery →](auction-discovery.md)  
[See mobile bidding →](../mobile/quick-bidding.md)  
[Technical implementation →](../../04-technical/components/hooks.md#bidding)