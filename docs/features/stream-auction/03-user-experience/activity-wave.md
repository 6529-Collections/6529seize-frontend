# Stream Auction Activity Wave

This is where all the auction action happens publicly. Think of it as the auction community's hangout spot.

## What This Wave Is For

It's a public chat wave where everyone can:
- See what's happening with all auctions
- Chat about ongoing auctions
- Get real-time updates
- Look back at auction history

Anyone can view it, anyone can participate. You'll find it in the Waves section with all the other chat waves.

## Automatic Updates You'll See

### When Someone Redirects
This one actually shows up in the original memes wave when a creator redirects:

```
┌─────────────────────────────────────┐
│ 🎯 Auction Redirect                 │
│                                    │
│ [Meme Preview Image]               │
│                                    │
│ @creator redirected "Meme Title"   │
│ to a 1/1 stream auction!           │
│                                    │
│ Original support: 150 votes        │
│ From 42 voters                     │
│                                    │
│ [View Auction →]                   │
└─────────────────────────────────────┘
```

This lets everyone in the wave know what happened and where to find the auction.

### When an Auction Starts
In the Stream Auction Activity wave, when an auction goes live:

```
┌─────────────────────────────────────┐
│ 🏁 New Auction Started              │
│                                    │
│ [Meme Thumbnail]                   │
│                                    │
│ "Meme Title" by @creator           │
│ Starting bid: [configured price]   │
│ Duration: [set duration]           │
│                                    │
│ [Place Bid →] [Set Reminder]       │
└─────────────────────────────────────┘
```

### When Things Get Exciting
The system posts updates when interesting stuff happens:

```
┌─────────────────────────────────────┐
│ 💰 Bidding War!                     │
│                                    │
│ "Meme Title" reaches 5 ETH         │
│ 12 bids placed in last hour        │
│ Time remaining: 3h 45m             │
│                                    │
│ Current leader: @highbidder        │
│                                    │
│ [Join Bidding →]                   │
└─────────────────────────────────────┘
```

Things that trigger these posts:
- The first bid on an auction
- Price goes 10x the starting bid
- Lots of bids happening fast
- A new record high for any auction

### One Hour Warning
Exactly one hour before an auction ends:

```
┌─────────────────────────────────────┐
│ ⏰ Ending Soon!                     │
│                                    │
│ "Meme Title" auction               │
│ Current bid: 3.2 ETH               │
│ Ends in: 59 minutes                │
│                                    │
│ Don't miss out!                    │
│                                    │
│ [Place Final Bid →]                │
└─────────────────────────────────────┘
```

### When It's Over
Once an auction ends:

```
┌─────────────────────────────────────┐
│ 🔨 Auction Ended                    │
│                                    │
│ [Meme Thumbnail]                   │
│                                    │
│ "Meme Title" by @creator           │
│ Final price: 8.5 ETH               │
│ Winner: @collector                 │
│ Total bids: 23                     │
│                                    │
│ Congrats to all participants! 🎉    │
└─────────────────────────────────────┘
```


## What People Talk About

It's not just system posts - it's a real community:

**You can**:
- Reply to any of the system updates
- Quote auctions you're watching
- Share your thoughts on prices
- Celebrate when someone wins

**People post about**:
- Their bidding strategies
- Price predictions
- Supporting their favorite creators
- Collection goals

**Keep it friendly**:
- Normal wave rules apply
- Don't try to manipulate bids
- Be nice to other bidders
- Keep things positive

## How Posts Look

The system posts are designed to catch your eye:
- Preview images of the memes
- Current bid shown on the image
- Live countdown timers

Everything's clickable:
- Links go straight to auctions
- Quick bid buttons when relevant
- Set reminders for ending times
- Easy sharing options


## Why This Wave Matters

**For bidders**: You won't miss interesting auctions. You can see what's hot, learn from others, and celebrate wins together.

**For creators**: Free promotion! Your auction gets visibility, the community gets hyped, and you build anticipation.

**For everyone**: It makes the whole auction system transparent and builds a real community around it.


---

[Back to user experience →](desktop/)  
[See notifications →](mobile/notifications.md)  
[Technical details →](../04-technical/api/webhooks.md#activity-wave)