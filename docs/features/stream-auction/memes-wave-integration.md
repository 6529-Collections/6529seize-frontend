# Memes Wave to Stream Auction Integration - Version 2

## Overview

This feature lets successful memes wave submissions become 1/1 NFT auctions. When a meme gets enough votes and maintains good ratings, the creator can choose to redirect it from the memes wave competition to a Stream auction, where collectors can bid to own it as a unique NFT.

## The Problem

Right now, successful memes in the wave either win prizes through the leaderboard or just fade away after the voting period. Creators who make exceptional content that resonates with the community have limited ways to monetize their work. Meanwhile, collectors who want to own specific memes as unique pieces can't do that - they can only get editions if the meme wins the leaderboard.

Some creators see their memes getting massive engagement and think "people really want to own this specific piece" but there's no mechanism to make that happen. The current system treats all memes the same way: compete for leaderboard spots, maybe win an edition mint, that's it.

## The Solution

Stream auctions give high-performing memes an alternative path. Instead of staying in the leaderboard competition, creators can redirect their successful submissions to become 1/1 NFT auctions. This creates a win-win: creators get direct monetization for exceptional work, and collectors get the chance to own unique pieces they're passionate about.

The key is that this is optional - creators choose whether to redirect based on their goals. Maybe they want the leaderboard glory, maybe they want the auction revenue, or maybe they just love that the community wants to own their work as a unique piece. The feature respects these different motivations by making the redirect a choice, not automatic.

## User Journey

Here's how it works from the creator's perspective:

You submit your meme to the wave like normal. People start voting on it, and it's doing really well - getting lots of high ratings over several days. At some point, the system recognizes your meme has crossed the performance threshold and shows you a "Stream Eligible" badge on your drop.

Now you have a choice. You can leave it in the memes wave to compete for the leaderboard, or you can redirect it to become a 1/1 auction. If you choose to redirect, you click the button and confirm your decision. This is permanent - once redirected, your meme leaves the leaderboard competition entirely.

What happens next is your meme gets removed from the wave (voters get their TDH refunded) and enters a setup phase. A team member will contact you via DM to finalize the auction details. Once everything is set up, your auction goes live in the Collections section where people can bid on it.

From the collector's perspective:

You're browsing memes and see one you absolutely love. If it's eligible for stream auction, you might see it redirect and become available as a 1/1. You can then head to the Collections section, find the auction, and place your bid. If you win, you own that specific meme as a unique NFT - not an edition, but the actual 1/1 piece.

## Discovery & Navigation

Stream auctions live in the Collections section of the site, specifically at `/collections/stream-auctions`. This makes sense because auctions are fundamentally about collecting NFTs, not about wave participation.

The auctions are organized into three categories:
- **Active** - Auctions currently accepting bids
- **Upcoming** - Auctions being prepared (you'll see these while the team sets them up)
- **Collection** - Completed auctions that are now minted NFTs

Within these categories, you can filter by creator, price range, and time-based criteria. There's also a "My Bids" section where you can track auctions you're participating in.

Beyond the Collections section, there are a few other discovery points:
- The homepage shows a carousel of active auctions
- My Stream shows your personal auction activity (won, redirected, bid on)
- A Stream Auction Activity chat wave where the system posts about auction events and people can discuss

The key is that while discovery happens in multiple places, the actual auction management and bidding happens in Collections. This keeps things organized - social activity stays in waves, commerce happens in Collections.

## Technical Overview

At a high level, the system tracks meme performance in the background. When a meme hits the voting thresholds, it gets flagged as eligible. The frontend shows this eligibility to the creator, who can then trigger the redirect.

The redirect process is atomic - the meme immediately leaves the wave competition, votes get refunded, and the auction enters a pending state. A manual setup process follows where the team contacts the creator to finalize details before the auction goes live.

Key technical pieces:
- Eligibility tracking runs as a background job checking voting metrics
- Redirect is a one-way operation that removes the drop from waves
- Auctions use the existing Stream smart contracts with fixed parameters
- The Stream Auction Activity wave is just a regular chat wave with system-generated posts
- Notifications integrate with the existing notification system

The implementation reuses existing infrastructure wherever possible - Stream contracts for auctions, chat waves for activity feed, standard notifications for alerts. The main new pieces are eligibility tracking and the redirect flow itself.

## Open Questions

While the core concept is clear, several decisions need to be made:

**Voting Thresholds**: What combination of vote count, rating average, and time period makes a meme eligible? This needs data analysis to find the sweet spot between accessibility and quality.

**Timing Windows**: When does eligibility checking start? Can you lose eligibility if votes drop? How long do creators have to decide? Current thinking is to check after 24 hours, make eligibility permanent once achieved, and give creators unlimited time to decide.

**Manual Process Details**: The team manually sets up auctions after redirect. We need to define the exact process, who does it, typical timeframes, and how creators are contacted.

**Collections Organization**: Should stream auction memes be in a dedicated sub-collection or mixed with other Stream NFTs? Dedicated seems cleaner for collectors interested specifically in memes.

**Notification Preferences**: Which auction notifications are critical (always on) vs optional? Outbid notifications seem critical, but notifications about every new bid on your auction might be overwhelming.

These decisions don't block development but need resolution before launch. Most can be adjusted based on early user feedback.
