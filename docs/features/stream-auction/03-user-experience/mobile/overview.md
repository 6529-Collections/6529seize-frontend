# Stream Auctions on Mobile

Here's how auctions work on your phone - designed for speed and one-handed use.

## What Makes Mobile Different

### Built for Your Thumb
Everything's designed for tapping, not clicking. Buttons are big enough to hit easily (at least 44px), there's space between things so you don't tap the wrong button, and you can swipe between auctions naturally. Actions slide up from the bottom.

### Speed is Everything
When you're bidding on the go, every second counts. You can rebid with one tap from a notification. We pre-calculate smart bid amounts so you don't have to think. Fewer confirmation screens get in your way. Your wallet stays connected between sessions.

### Notifications Do the Work
You don't need to stare at the screen. We'll let you know when:
- Someone outbids you (instantly)
- An auction is ending soon (1 hour warning)
- You've won something
- Multiple updates happen (we batch them smartly)
- Every notification takes you right to the action

## How It's Different from Desktop

### Showing Information
On desktop, you see everything at once. On mobile, we show the important stuff first and let you tap for more. Like bid history - desktop shows it all, mobile shows the last 3 bids with a "View All" button.

### How You Interact
No hovering on phones! Instead of hover tooltips, you tap things to see more info. Long-press works like right-click.

### Getting Around
Desktop uses multiple columns side by side. Mobile is one column you scroll through. Filters aren't in a sidebar - they slide up from the bottom when you need them.

## Special Mobile Features

### Quick Actions at Your Thumb
The main actions stay at the bottom of your screen:
```
┌─────────────────────────────────────┐
│                                     │
│         [Auction Content]           │
│                                     │
├─────────────────────────────────────┤
│ [Bid Now] [Share] [Follow]          │
└─────────────────────────────────────┘
```

### Pull Down to Update
Just like other apps - pull down and everything refreshes. Current bid, time left, new activity. You'll see a nice spinner while it updates.

### Natural Gestures
- Swipe sideways to see the next auction
- Pull down to refresh everything
- Press and hold for more options
- Pinch to zoom in on images


## Keeping It Fast and Light

### Images Load Smart
We show you a preview first, then load the full image. Stuff you can't see yet doesn't load until you scroll to it. Modern image formats save data when your phone supports them.

### Saves Your Data Plan
Everything's compressed. Live updates use minimal data. High-quality images are optional. We batch updates together instead of constant tiny requests.

### Easy on Your Battery
Background updates don't drain your battery. Animations turn off when battery is low. Dark mode saves power on OLED screens. Notifications group intelligently instead of buzzing constantly.


## Real-World Examples

### Getting Outbid at Lunch
Your phone buzzes: "You've been outbid!"
- Tap the notification - boom, you're in the auction
- See the new price and your quick bid options
- One tap picks your bid
- You're back to your sandwich

Whole thing takes less than 15 seconds.

### Browsing on the Train
Killing time on your commute:
- Open to see all active auctions
- Swipe through what's interesting
- Tap one to see details
- Add it to your watch list
- Get notified when something happens

Designed for holding your phone in one hand while holding the rail with the other.

### Last-Minute Drama
Auction ending while you're out:
- "Ending in 10 minutes!" notification
- Tap to bid right from the alert
- Pre-calculated amounts ready to go
- Wallet signs instantly
- You see confirmation

Speed matters here - everything's optimized to be fast and reliable.

## Different Screen Sizes

### Phones (up to 767px wide)
Everything in one column. Popups slide up from the bottom. Information stacks vertically. Buttons stretch across the whole screen.

### Tablets (768-1024px)
Can show two columns of auctions. Details appear in a side panel. Works great in landscape. Even bigger tap targets.

### How We Build It
We design for phones first, then add features for bigger screens. If your device can do something fancy, we use it. If not, everything still works fine.

---

[Next: Quick bidding interface →](quick-bidding.md)  
[See notification handling →](notifications.md)  
[Back to desktop experience →](../desktop/)