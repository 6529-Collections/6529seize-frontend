# What Changes in the Memes Wave

Here's how we modify the memes wave to support auction redirects.

## The Eligibility Badge

When a meme hits the threshold, we show a badge in the top right corner. Think rounded corners, maybe a 🎯 icon, using Stream's brand colors but with some transparency so it doesn't overpower the meme itself.

## How It Looks

### For Everyone Else
If you're just browsing and see an eligible meme:
```
┌─────────────────────────────────────┐
│ [Drop Content]           [🎯 Stream]│
│                         [Eligible] │
│                                     │
│ [Vote] [Share] [More]               │
│ Votes: 150 | Voters: 42             │
└─────────────────────────────────────┘
```

The badge just sits there - you can't click it. Maybe it fades in with a nice animation when it first appears. Hover over it and you get a tooltip explaining what it means.

### For the Creator
If it's your meme, the badge becomes interactive:
```
┌─────────────────────────────────────┐
│ [Drop Content]         [🎯 Stream]  │
│                       [Eligible]   │
│                       [→ Redirect] │
│ [Vote] [Share] [More]               │
│ Votes: 150 | Voters: 42             │
└─────────────────────────────────────┘
```

Now it's clickable. Maybe it glows a bit or has a border. When you hover, it shows "Redirect" so you know what'll happen. Click it and you get the redirect modal.

Keep in mind - this needs to work on phones too, and shouldn't mess with the voting buttons.

## The Redirect Modal

When they click, here's what they see:
```
┌─────────────────────────────────────────┐
│ Redirect to Stream Auction              │
│ ────────────────────────────────────────│
│                                         │
│ 🎯 Your meme is ready for auction!     │
│                                         │
│ What happens when you redirect:         │
│                                         │
│ ✓ Leaves the leaderboard race          │
│ ✓ Everyone gets their TDH back         │
│ ✓ Becomes a 1/1 NFT auction            │
│ ✓ Auction starts at set price          │
│                                         │
│ ⚠️ This can't be undone                │
│                                         │
│ What's next:                            │
│ 1. Someone from the team DMs you       │
│ 2. We set things up (1-3 days)         │
│ 3. Your auction goes live              │
│                                         │
│ [Cancel]          [Redirect to Auction] │
└─────────────────────────────────────────┘
```

The modal needs to be super clear about:
- What happens right now (leaves leaderboard, refunds happen)
- What they're getting (1/1 auction with whatever parameters)
- That big warning that you can't undo this
- Exactly what happens next (team contact, timeline)

Make the warning impossible to miss. The "Redirect to Auction" button should stand out as the primary action.

## After They Redirect

Once someone redirects, the card changes:
```
┌─────────────────────────────────────┐
│ [Drop Content]        [🔄 Redirected]│
│                       [to Auction]  │
│                                     │
│ [View Auction →]                    │
│ Original votes: 150 from 42 voters  │
└─────────────────────────────────────┘
```

What changes:
- Badge now says "Redirected to Auction"
- Can't vote anymore (buttons gone)
- Link to the auction appears
- Still shows the votes it got (for context)
- Maybe slightly faded or different border

People can still comment and share, but voting is done. It stays in the wave history but disappears from the leaderboard.

## The Leaderboard

When someone redirects, their meme just vanishes from the leaderboard. No placeholder, no "this was redirected" message - it's just gone. Other memes move up to fill the space.

Everyone who voted gets a notification about their TDH refund, with a link to check out the auction if they want to bid.

## Announcement in the Wave

The system posts an update when someone redirects:
```
┌─────────────────────────────────────┐
│ 🎯 Stream Auction Redirect          │
│                                     │
│ [Drop Preview Thumbnail]            │
│                                     │
│ "@creator redirected their meme     │
│ to a 1/1 stream auction!"           │
│                                     │
│ Original support: 150 votes         │
│                                     │
│ [View Auction →] [Follow Updates →] │
└─────────────────────────────────────┘
```

This lets everyone know what happened and where to find the auction.

## Progress Toward Eligibility (Maybe?)

We could show creators how close they are:
```
[Current: 75 votes | Need: 100 votes]
[████████░░] 75% to Stream eligibility
```

But only if we're careful - show it just to the creator, keep it subtle, don't make it feel like a game they have to win.

## Filtering for Eligible Memes

Add a filter option to the wave so people can see just the eligible ones:
```
[All Memes] [Eligible Only] [My Memes]
```

This helps collectors find potential auctions and creators see what's working. When "Eligible Only" is active, only show memes with that Stream badge.

## Making It Work on Phones

The badge needs to be tappable (at least 44x44px) but not so big it covers the meme. Space things out so fat fingers don't hit the wrong button.

The modal should adapt - maybe shorter text, bigger buttons, and let people scroll if they need to. The important stuff (what happens, can't undo) needs to be visible without scrolling.

---

[Next: Auction discovery →](auction-discovery.md)  
[See mobile experience →](../mobile/overview.md)  
[Technical implementation →](../../04-technical/components/structure.md)