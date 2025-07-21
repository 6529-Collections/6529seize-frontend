# Auction Notifications on Mobile

Here's how we keep you updated about auctions through push notifications.

## Types of Notifications

### Your Meme is Eligible
When your meme gets enough votes:

```
┌─────────────────────────────────────┐
│ 🎯 Stream Auction Eligible!         │
│ Your meme can now be auctioned     │
│                                    │
│ [View Options] [Later]             │
└─────────────────────────────────────┘
```

Tapping takes you straight to the redirect options.

### Someone Outbid You
When you're no longer the highest bidder:

```
┌─────────────────────────────────────┐
│ 🔴 Outbid on "Meme Title"          │
│ New bid: 1.8 ETH (yours: 1.5 ETH)  │
│ 2h 15m remaining                   │
│                                    │
│ [Bid 2.0 ETH] [View]               │
└─────────────────────────────────────┘
```

Shows the new bid, your last bid, and time left. Quick bid button lets you jump right back in.

### Auction Ending Soon
One hour before an auction ends (if you're winning):

```
┌─────────────────────────────────────┐
│ ⏰ Auction Ending Soon!             │
│ You're winning with 2.5 ETH        │
│ 59 minutes left                    │
│                                    │
│ [View Auction] [Dismiss]           │
└─────────────────────────────────────┘
```

### You Won!
When the auction ends and you're the winner:

```
┌─────────────────────────────────────┐
│ 🏆 You Won the Auction!            │
│ "Meme Title" - 3.2 ETH            │
│                                    │
│ [View Details]                     │
└─────────────────────────────────────┘
```

### New Bid on Your Auction
If you created the auction, you'll know when people bid:

```
┌─────────────────────────────────────┐
│ 💰 New bid on your auction         │
│ @bidder bid 1.5 ETH                │
│ 5 bidders competing                │
│                                    │
│ [View Activity] [Dismiss]          │
└─────────────────────────────────────┘
```

### Creator You Follow Started an Auction
When creators you follow start auctions:

```
┌─────────────────────────────────────┐
│ 🎨 @creator started an auction     │
│ "Meme Title"                       │
│                                    │
│ [View Auction] [Dismiss]           │
└─────────────────────────────────────┘
```

## How Notifications Work

### The One-Notification Rule
Here's the important bit about outbid notifications:
1. You place a bid and become the highest bidder
2. Someone outbids you - you get ONE notification
3. If more people keep bidding, you won't get more notifications
4. You only get notified again after you place a new bid

This prevents your phone from buzzing constantly if you're not actively participating.

### When You Get Multiple Updates
If several things happen at once, we group them:
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
We respect your Do Not Disturb settings. During quiet hours, only critical notifications (like winning an auction) come through. Everything else waits until morning.

## Tapping Notifications

Each notification takes you exactly where you need to go:
- **Bid buttons** → Opens the auction with bid amounts ready
- **View buttons** → Shows the full auction details
- **Notification itself** → Takes you to the relevant auction


## When You're in the App

If you're already using the app when something happens:
```
┌─────────────────────────────────────┐
│ 🔴 Outbid!  New: 1.8 ETH  [Bid]  X │
└─────────────────────────────────────┘
```

This banner appears at the top, disappears after 5 seconds, or you can tap it to act immediately.

There's also a notification center in the app where you can see all your auction updates in one place.


## Controlling Your Notifications

You can turn different types on or off:
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

Quick options if things get too noisy:
- Mute a specific auction
- Snooze everything for an hour
- Turn off until tomorrow


---

[Back to quick bidding →](quick-bidding.md)  
[See activity wave →](../activity-wave.md)  
[Technical implementation →](../../04-technical/api/webhooks.md)