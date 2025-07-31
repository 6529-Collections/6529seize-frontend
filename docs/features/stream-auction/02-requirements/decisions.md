# Stream Auction Decisions

Here's what we've decided, what we're putting off, and what we still need to figure out.

## How We Track Things

- **✅ DECIDED**: Done deal, ready to build
- **🔄 DEFERRED**: Pushing to later with a good reason
- **❓ OPEN**: Still need answers

---

## ✅ DECIDED

### Auction Parameters - Set by Contract
We're controlling starting price and duration at the contract level. Admins set it, creators don't worry about it.

Why? Keeps things consistent and simple. No one has to decide "what price should I start at?"

The plan:
- Starting price and duration configured in contract
- No user input needed
- Admins can change it later if needed

### No Take-backs on Redirects
Once you redirect, that's it. No undo button, no changing your mind.

This makes the system way simpler and forces people to think before they click. We'll show a big warning before they confirm.

### Eligibility is Dynamic
You need to maintain X votes over Y period to stay eligible. If votes drop below the threshold, you lose the badge until you get back above it.

It's not a one-time achievement - you have to keep the momentum going.

### Where These Live
We're creating a dedicated "Memes Wave Auctions" collection inside Stream.

This way memes keep their identity but still work with all the Stream infrastructure. Collectors know exactly where to find them.

### How People Find Auctions
Main path is through Collections - that's where people already look for NFTs.

You'll find them at:
- Collections section (`/collections/stream-auctions`)
- Carousel on the homepage
- Links from the original memes

### When Things Go Wrong
We're using manual checks to catch problems.

Here's the flow:
1. Meme leaves the leaderboard right away
2. Goes into pending while we check it
3. Someone from the team DMs the creator
4. We verify and set up manually (1-3 days)

Not fully automated, but keeps quality high.

### Everything Happens at Once
When you redirect, it all happens instantly:
- Meme disappears from leaderboard
- Everyone gets their TDH back
- No weird in-between states

One database transaction handles it all. Clean.

### Notifications for Everything
We're adding specific notification types for each auction event:
- You're eligible!
- Someone bid on your auction
- You got outbid
- Auction ending soon
- You won!
- Creator you follow started an auction

### Mobile Gets Special Treatment
Building a proper touch experience for phones:
- Quick bid buttons (+5%, +10%, +25%)
- One-tap rebidding from notifications
- Smooth wallet connections

Because fumbling with your phone while someone outbids you sucks.

---

## 🔄 DEFERRED

### How Many Votes to Be Eligible?
Pushing this decision to Phase 2. We need to analyze real voting data first.

For now, we're thinking something like X votes from Y voters, but need to see the patterns.

To figure this out:
1. Look at historical voting data
2. See what works


### Who Can Do What?
Need security review before deciding permissions.

Plan for now:
- Use Stream's existing tdhSigner setup
- Keep current admin structure
- Manual upgrades through multisig

Must figure this out before Phase 1 backend work.


---

[Back to README →](../README.md)  
[See eligibility details →](eligibility.md)  
[Review auction parameters →](auction-parameters.md)