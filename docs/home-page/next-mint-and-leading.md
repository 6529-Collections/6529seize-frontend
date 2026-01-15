# Next Mint and What's Leading - Component Architecture

## Overview

A homepage section showing:
1. **Next Mint** - The current winner being minted (full color, prominent)
2. **Leading Items** - Top 2 leaderboard entries "on the line" (grayed/desaturated)

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Next mint and what's leading                              View all →    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Next mint  Jan 9 17:49│  │ Current Top 1   │  │ Current Top 2   │    │
│  │                      │  │                 │  │                 │    │
│  │    [FULL COLOR]      │  │  [GRAYED OUT]   │  │  [GRAYED OUT]   │    │
│  │    Large Image       │  │    Image        │  │    Image        │    │
│  │                      │  │                 │  │                 │    │
│  │                      │  │                 │  │                 │    │
│  ├──────────────────────┤  ├─────────────────┤  ├─────────────────┤    │
│  │ Title                │  │ Title           │  │ Title           │    │
│  │ 👤 Artist            │  │ 👤 Artist       │  │ 👤 Artist       │    │
│  └──────────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Responsive:**
- Desktop: 3 columns (main card ~40%, two leading cards ~30% each)
- Tablet: 3 columns compressed
- Mobile: Stack vertically (main card full width, leading cards side by side or stacked)

---

## Directory Structure

```
components/home/next-mint-leading/
├── index.ts                           # exports
├── NextMintLeadingSection.tsx         # main container + header
├── NextMintLeadingGrid.tsx            # flex/grid layout wrapper
├── NextMintCard.tsx                   # featured card (full color)
├── LeadingCard.tsx                    # leaderboard card (grayed)
└── hooks/
    └── useNextMintLeading.ts          # data fetching hook
```

---

## Component Breakdown

### 1. NextMintLeadingSection.tsx
Main section container with header.

```tsx
// Props
interface NextMintLeadingSectionProps {
  className?: string;
}

// Structure
- Section header ("Next mint and what's leading" + "View all" link)
- NextMintLeadingGrid (renders cards)
- Loading/error states
```

### 2. NextMintLeadingGrid.tsx
Layout wrapper for the 3 cards.

```tsx
// Tailwind layout
tw-flex tw-flex-col md:tw-flex-row tw-gap-4

// Children
- NextMintCard (flex: ~40% on desktop)
- LeadingCard x2 (flex: ~30% each on desktop)
```

### 3. NextMintCard.tsx
The prominent "winner" card - full colors.

```tsx
interface NextMintCardProps {
  nft: {
    id: string;
    title: string;
    imageUrl: string;
    animationUrl?: string;
    artist: {
      handle: string;
      avatar?: string;
    };
  };
  countdown: {
    date: Date;
    label: string;  // "Jan 9"
  };
}

// Structure
- Badge: "Next mint" + countdown
- Image container (aspect-square, full color)
- Title
- Artist row (avatar + handle)
```

### 4. LeadingCard.tsx
Leaderboard position cards - desaturated/grayed.

```tsx
interface LeadingCardProps {
  item: {
    id: string;
    title: string;
    imageUrl: string;
    animationUrl?: string;
    artist: {
      handle: string;
      avatar?: string;
    };
  };
  rank: 1 | 2;  // "Current Top 1" or "Current Top 2"
}

// Structure
- Badge: "Current Top {rank}"
- Image container (aspect-square, grayscale filter)
- Title
- Artist row (avatar + handle)

// Key styling
tw-grayscale tw-opacity-70  // or custom filter
```

---

## Styling Approach

### Color Scheme (existing patterns)
```
Background:    tw-bg-iron-900
Card bg:       tw-bg-iron-900
Borders:       tw-border-iron-800
Title:         tw-text-iron-50 tw-font-semibold
Subtitle:      tw-text-iron-300
Labels/badges: tw-text-iron-400 tw-text-xs tw-uppercase
```

### Grayed Effect for Leading Cards
Option A - CSS filter:
```css
.leading-card-image {
  filter: grayscale(0.7) brightness(0.8);
}
```

Option B - Tailwind utilities:
```tsx
tw-grayscale-[70%] tw-brightness-[80%]
// or simpler: tw-grayscale tw-opacity-80
```

### Card Hover
```tsx
tw-transition-transform tw-duration-200 hover:tw-scale-[1.02]
```

---

## Data Hooks

### Wave ID
```tsx
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";

const { seizeSettings } = useSeizeSettings();
const waveId = seizeSettings.memes_wave_id;
```

### Next Mint (Latest Winner)
```tsx
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";

const { decisionPoints, isFetching } = useWaveDecisions({ waveId });

// Get latest winner (last decision, first place)
const latestDecision = decisionPoints[decisionPoints.length - 1];
const nextMint = latestDecision?.winners[0]?.drop;  // ApiDrop
```
- **Endpoint:** `waves/{waveId}/decisions`
- **Query Key:** `QueryKey.WAVE_DECISIONS`
- **Returns:** `ApiWaveDecision[]` with `winners[].drop: ApiDrop`

### What's Leading (Top 2 by Prediction)
```tsx
import { useWaveDropsLeaderboard, WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";

const { drops, isFetching } = useWaveDropsLeaderboard({
  waveId,
  sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
});

const leading = drops.slice(0, 2);  // ExtendedDrop[]
```
- **Endpoint:** `waves/{waveId}/leaderboard`
- **Query Key:** `QueryKey.DROPS_LEADERBOARD`
- **Sort:** `RATING_PREDICTION` (predicted winners, DESC)
- **Returns:** `ExtendedDrop[]`

### Data Field Mapping

| Field | Next Mint (`ApiDrop`) | Leading (`ExtendedDrop`) |
|-------|----------------------|--------------------------|
| Image | `drop.parts[0]?.media[0]?.url` | `drop.parts[0]?.media[0]?.url` |
| Title | `drop.title` or `drop.metadata.find(m => m.data_key === 'title')?.data_value` | same |
| Artist Handle | `drop.author.handle` | `drop.author.handle` |
| Artist PFP | `drop.author.pfp` | `drop.author.pfp` |

---

## Implementation Notes

1. **Reuse existing hooks** - `useWaveDecisions` for next mint, `useWaveDropsLeaderboard` for leading
2. **Keep cards simple** - just image, title, artist - no complex stats
3. **Single badge component** - reusable for "Next mint" and "Current Top X"
4. **Image handling** - follow existing pattern (check animation via mime_type, fallback to image)
5. **Loading state** - skeleton cards or spinner
6. **No need to fetch wave object** - hooks only need `waveId`

---

## Questions to Consider

- [ ] Should clicking cards navigate to detail page or different action?
- [ ] Mobile layout: stack all 3 or keep leading cards side-by-side?
- [ ] Should we show any stats (votes, etc) on leading cards?
- [ ] Animation on section entering viewport?
