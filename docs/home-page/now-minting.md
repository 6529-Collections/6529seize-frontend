# Now Minting Section - Layout & Component Structure Plan

## Design Reference
![Now Minting Design](Screenshot 2026-01-09 at 08.13.38.png)

---

## Layout Overview

### Responsive Breakpoints
Using Tailwind (`tw-` prefix):

| Breakpoint | Layout | Artwork | Details |
|------------|--------|---------|---------|
| Mobile (`< md`) | Single column, stacked | Full width, aspect-square | Full width below |
| Tablet (`md`) | Two columns | 50% width | 50% width |
| Desktop (`lg+`) | Two columns | 50% width | 50% width |

---

## Component Hierarchy

```
HomePageContent.tsx
└── NowMintingSection/
    ├── SectionHeader ("Now minting")
    ├── Grid container (Tailwind)
    │   ├── Artwork column [tw-w-full md:tw-w-1/2]
    │   │   └── NowMintingArtwork
    │   │       └── aspect-square image/video
    │   │
    │   └── Details column [tw-w-full md:tw-w-1/2]
    │       └── NowMintingDetails
    │           ├── NowMintingHeader
    │           │   ├── Badge ("CARD #667")
    │           │   ├── Title ("All the roads lead to OM")
    │           │   └── ArtistRow (avatar + handle)
    │           │
    │           ├── NowMintingStatsGrid (2x2 grid)
    │           │   ├── StatItem: Edition
    │           │   ├── StatItem: Mint price
    │           │   ├── StatItem: Status
    │           │   └── StatItem: Floor
    │           │
    │           ├── NowMintingDetailsAccordion
    │           │   └── Expandable metadata
    │           │
    │           └── NowMintingCountdown
    │               ├── Phase label + Timer
    │               └── MintButton
```

---

## File Structure

```
components/home/now-minting/
├── index.ts                        # Barrel export
├── NowMintingSection.tsx           # Main section wrapper + data fetching
├── NowMintingArtwork.tsx           # Left column - artwork display
├── NowMintingDetails.tsx           # Right column container
├── NowMintingHeader.tsx            # Badge + title + artist
├── NowMintingStatsGrid.tsx         # 2x2 stats grid
├── NowMintingStatsItem.tsx         # Individual stat row
├── NowMintingDetailsAccordion.tsx  # Expandable details
└── NowMintingCountdown.tsx         # Timer + mint button
```

---

## Component Specifications

### 1. NowMintingSection
**Purpose:** Main wrapper, handles data fetching and section layout

```tsx
// Layout structure
<section className="tw-py-8">
  <h2 className="tw-text-lg tw-font-medium tw-text-iron-50 tw-mb-4">
    Now minting
  </h2>
  <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-6">
    {/* Artwork column */}
    {/* Details column */}
  </div>
</section>
```

**Responsibilities:**
- Fetch active minting data (hook: `useNowMinting` or similar)
- Handle loading/empty states
- Coordinate child components

---

### 2. NowMintingArtwork
**Purpose:** Display artwork image/video

**Layout:**
- Aspect ratio: 1:1 (square)
- Rounded corners: `tw-rounded-xl`
- Overflow hidden for media
- Support image and video formats

```tsx
<div className="tw-w-full md:tw-w-1/2">
  <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-900">
    {/* NFTImage or video component */}
  </div>
</div>
```

---

### 3. NowMintingDetails
**Purpose:** Container for all right-side details

```tsx
<div className="tw-w-full md:tw-w-1/2">
  <div className="tw-flex tw-flex-col tw-gap-4 tw-h-full">
    <NowMintingHeader />
    <NowMintingStatsGrid />
    <NowMintingDetailsAccordion />
    <NowMintingCountdown />
  </div>
</div>
```

---

### 4. NowMintingHeader
**Purpose:** Badge, title, artist info

**Layout (from design):**
```
[CARD #667]                    ← Small badge, iron-400 text
All the roads lead to OM       ← Large title, white text
[avatar] lapislight            ← Avatar + handle row
```

```tsx
<div className="tw-flex tw-flex-col tw-gap-2">
  {/* Badge */}
  <span className="tw-text-xs tw-text-iron-400 tw-uppercase tw-tracking-wider">
    Card #{cardNumber}
  </span>

  {/* Title */}
  <h3 className="tw-text-xl tw-font-semibold tw-text-iron-50">
    {title}
  </h3>

  {/* Artist row */}
  <div className="tw-flex tw-items-center tw-gap-2">
    <ProfileAvatar size="sm" />
    <span className="tw-text-sm tw-text-iron-300">{artistHandle}</span>
  </div>
</div>
```

---

### 5. NowMintingStatsGrid
**Purpose:** Display key minting stats in 2x2 grid

**Stats from design:**
| Label | Value | Notes |
|-------|-------|-------|
| Edition | 155 / 333 | Current / Total |
| Mint price | 0.06529 ETH | With ETH suffix |
| Status | Active | Green dot indicator |
| Floor | 0.053 ETH | Floor price |

**Layout:**
```tsx
<div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-py-4 tw-border-y tw-border-iron-800">
  <NowMintingStatsItem label="Edition" value="155 / 333" />
  <NowMintingStatsItem label="Mint price" value="0.06529 ETH" />
  <NowMintingStatsItem label="Status" value="Active" status="active" />
  <NowMintingStatsItem label="Floor" value="0.053 ETH" />
</div>
```

---

### 6. NowMintingStatsItem
**Purpose:** Individual stat display

```tsx
interface NowMintingStatsItemProps {
  label: string;
  value: string | React.ReactNode;
  status?: 'active' | 'upcoming' | 'ended';
}

// Layout
<div className="tw-flex tw-flex-col tw-gap-1">
  <span className="tw-text-xs tw-text-iron-400">{label}</span>
  <span className="tw-text-sm tw-font-medium tw-text-iron-50">
    {status === 'active' && <span className="tw-inline-block tw-w-2 tw-h-2 tw-rounded-full tw-bg-green tw-mr-2" />}
    {value}
  </span>
</div>
```

---

### 7. NowMintingDetailsAccordion
**Purpose:** Expandable section for additional metadata

**Content (collapsed by default):**
- Collection info
- Contract address
- Token standard
- Additional metadata

```tsx
<details className="tw-group">
  <summary className="tw-flex tw-items-center tw-justify-between tw-cursor-pointer tw-py-2">
    <span className="tw-text-sm tw-text-iron-300">Details</span>
    <ChevronIcon className="tw-transition-transform group-open:tw-rotate-180" />
  </summary>
  <div className="tw-py-2">
    {/* Detail rows */}
  </div>
</details>
```

---

### 8. NowMintingCountdown
**Purpose:** Phase timer and mint CTA

**Layout (from design):**
```
PUBLIC PHASE ENDS IN          ← Label, small caps
6:58:20                       ← Large countdown timer
[      Mint      ]            ← Full-width button
```

```tsx
<div className="tw-mt-auto tw-pt-4 tw-border-t tw-border-iron-800">
  {/* Phase label */}
  <span className="tw-text-xs tw-text-iron-400 tw-uppercase tw-tracking-wider">
    {phaseLabel} ends in
  </span>

  {/* Countdown */}
  <div className="tw-text-3xl tw-font-bold tw-text-iron-50 tw-my-2">
    {/* Timer display */}
  </div>

  {/* Mint button */}
  <button className="tw-w-full tw-py-3 tw-rounded-lg tw-bg-gradient-to-r tw-from-primary-500 tw-to-primary-400 tw-text-white tw-font-semibold tw-transition-opacity hover:tw-opacity-90">
    Mint
  </button>
</div>
```

---

## Reusable Components from Codebase

| Need | Existing Component | Location |
|------|-------------------|----------|
| Countdown timer | `DateCountdown` | `components/date-countdown/` |
| Profile avatar | `ProfileAvatar` | `components/common/profile/` |
| NFT Image display | `NFTImage` | (check existing) |

---

## Responsive Behavior Summary

### Mobile (< 768px)
- Single column layout (`tw-flex-col`)
- Artwork: Full width, aspect-square
- Details: Full width, below artwork
- Stats: 2x2 grid maintained
- Countdown: Full width at bottom

### Tablet/Desktop (>= 768px)
- Two column layout (`md:tw-flex-row`, `md:tw-w-1/2`)
- Artwork: Left column, aspect-square
- Details: Right column, vertically distributed
- All content visible without scrolling

---

## Data Requirements

```typescript
interface NowMintingData {
  // NFT info
  id: number;
  cardNumber: number;
  title: string;

  // Artwork
  imageUrl: string;
  animationUrl?: string;

  // Artist
  artist: {
    handle: string;
    avatarUrl: string;
    profileUrl: string;
  };

  // Minting stats
  edition: {
    current: number;
    total: number;
  };
  mintPrice: string; // ETH value
  status: 'active' | 'upcoming' | 'ended';
  floorPrice: string; // ETH value

  // Phase timing
  phase: {
    name: string;
    endDate: number; // Unix timestamp
  };

  // Additional details
  collection: string;
  contractAddress: string;
  tokenStandard: string;
}
```

---

## Next Steps

1. [ ] Review and approve component structure
2. [ ] Identify/create data hook for active minting
3. [ ] Implement components (bottom-up approach)
4. [ ] Add loading/empty states
5. [ ] Test responsive behavior
6. [ ] Connect to real data
