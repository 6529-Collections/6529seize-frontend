# Memes Wave UI Changes

This document details all UI modifications needed in the memes wave to support stream auction redirects.

## Eligibility Badge

### Design Specifications
**Position**: Top right corner of drop card  
**Style**: Rounded badge with icon and text  
**Colors**: 
- Background: Stream brand color with opacity
- Text: High contrast for readability
- Icon: 🎯 target emoji or custom stream icon

### Badge States

#### For All Viewers (Non-Interactive)
```
┌─────────────────────────────────────┐
│ [Drop Content]           [🎯 Stream]│
│                         [Eligible] │
│                                     │
│ [Vote] [Share] [More]               │
│ Votes: 150 | Avg: 4.2               │
└─────────────────────────────────────┘
```

**Behavior**:
- Shows when drop meets eligibility criteria
- Not clickable for non-authors
- Subtle animation on first appearance
- Tooltip on hover: "This meme is eligible for stream auction"

#### For Drop Author (Interactive)
```
┌─────────────────────────────────────┐
│ [Drop Content]         [🎯 Stream]  │
│                       [Eligible]   │
│                       [→ Redirect] │
│ [Vote] [Share] [More]               │
│ Votes: 150 | Avg: 4.2               │
└─────────────────────────────────────┘
```

**Behavior**:
- Clickable with hover state
- Distinct visual treatment (border, glow)
- Shows "Redirect" action on hover/tap
- Opens redirect modal on click

### Implementation Considerations
- Must not interfere with voting UI
- Responsive sizing for mobile
- Accessible contrast ratios
- Smooth appearance animation

## Redirect Modal

### Modal Structure
```
┌─────────────────────────────────────────┐
│ Redirect to Stream Auction              │
│ ────────────────────────────────────────│
│                                         │
│ 🎯 Your meme is ready for auction!     │
│                                         │
│ What happens when you redirect:         │
│                                         │
│ ✓ Removed from leaderboard competition │
│ ✓ All votes refunded to supporters     │
│ ✓ Becomes exclusive 1/1 NFT auction    │
│ ✓ 24-hour auction at 0.1 ETH start     │
│                                         │
│ ⚠️ This decision is permanent          │
│                                         │
│ Next steps:                             │
│ 1. You'll be contacted via DM          │
│ 2. Auction setup takes 1-3 days        │
│ 3. We'll notify you when it's live     │
│                                         │
│ [Cancel]          [Redirect to Auction] │
└─────────────────────────────────────────┘
```

### Content Sections

#### Immediate Consequences
Clear bullet points about what happens right away:
- Leaderboard removal
- Vote refunds
- Status change

#### Auction Information  
Key parameters displayed:
- Starting price (from contract)
- Duration (from contract)
- Format (1/1 NFT)

#### Process Transparency
Timeline and next steps:
- Manual verification requirement
- Expected timeline
- Who will contact them

#### Permanent Decision Warning
Clear, unmissable warning that this cannot be undone

### Visual Design
- Clean, uncluttered layout
- Clear visual hierarchy
- Warning styling for permanent decision
- Primary CTA stands out

## Drop Card After Redirect

### Redirected State Display
```
┌─────────────────────────────────────┐
│ [Drop Content]        [🔄 Redirected]│
│                       [to Auction]  │
│                                     │
│ [View Auction →]                    │
│ Original votes: 150 | Avg: 4.2      │
└─────────────────────────────────────┘
```

**Changes**:
- Eligibility badge replaced with redirect status
- Voting UI removed/disabled
- Link to auction added
- Historical vote data preserved
- Subtle visual treatment (opacity, border)

### Behaviors
- No voting allowed
- Comments/discussion still enabled
- Share functionality updated to include auction link
- Shows in wave history but not leaderboard

## Leaderboard Handling

### Removal Process
- Immediate removal upon redirect
- No ghost/placeholder entry
- Other entries move up naturally
- No indication in leaderboard of redirected items

### Vote Refund Messaging
When votes are refunded:
- Voters receive notification
- Refund amount clearly stated
- Link to auction for interested collectors

## Wave Announcement Post

### Automated Post Format
```
┌─────────────────────────────────────┐
│ 🎯 Stream Auction Redirect          │
│                                     │
│ [Drop Preview Thumbnail]            │
│                                     │
│ "@creator redirected their meme     │
│ to a 1/1 stream auction!"           │
│                                     │
│ Original votes: 150 supporters      │
│                                     │
│ [View Auction →] [Follow Updates →] │
└─────────────────────────────────────┘
```

**Purpose**:
- Notify wave participants
- Provide closure on redirected content
- Drive traffic to auction
- Maintain transparency

## Progress Indicators

### Pre-Eligibility (Optional Enhancement)
Show progress toward eligibility:
```
[Current: 75 votes | Need: 100 votes]
[████████░░] 75% to Stream eligibility
```

**Considerations**:
- Only show to drop author
- Don't create pressure/gamification
- Simple, non-intrusive design

## Mobile Responsive Design

### Touch Targets
- Minimum 44x44px tap areas
- Adequate spacing between actions
- Badge remains visible but smaller
- Modal adapts to viewport

### Simplified Mobile Modal
- Shorter content blocks
- Larger buttons
- Key info prioritized
- Scrollable if needed

---

[Next: Auction discovery →](auction-discovery.md)  
[See mobile experience →](../mobile/overview.md)  
[Technical implementation →](../../04-technical/components/structure.md)