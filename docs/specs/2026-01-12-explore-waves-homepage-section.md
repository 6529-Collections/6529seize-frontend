---
title: Explore Waves Homepage Section
version: 1.0
status: draft
created: 2026-01-12
tech_stack: Next.js 16, React 19, TailwindCSS 3.4
---

# Explore Waves Homepage Section

## Problem Statement

The homepage currently showcases minting content and boosted drops but lacks a dedicated section for wave discovery. Users have no easy entry point to explore active conversations directly from the homepage.

**Evidence**: User wants to drive wave engagement from the homepage with a visually prominent section at the bottom.

**Current State**: Users must navigate to `/discover` to browse waves. The homepage ends with the BoostedSection component.

## User Stories

### US-001: View Explore Waves Section
As a visitor (authenticated or not), I want to see an "Explore waves" section on the homepage so that I can discover active conversations without navigating away.

**Acceptance Criteria:**
- Given I am on the homepage, when I scroll to the bottom, then I see an "Explore waves" section before the footer
- Given the section loads, when I view it, then I see a header with title "Explore waves" and subtitle "Browse channels—jump into the conversation."
- Given the section loads, when I view it, then I see up to 6 wave cards in a responsive grid

### US-002: View Wave Card Details
As a visitor, I want to see relevant information about each wave so that I can decide which conversation to join.

**Acceptance Criteria:**
- Given a wave card is displayed, when I view it, then I see the wave's cover image (or gradient fallback)
- Given a wave card is displayed, when I view it, then I see the wave name below the image
- Given a wave card with drops, when I view it, then I see "Last message Xm/Xh · X today" metadata
- Given a wave card with drops, when I view it, then I see a preview of the latest message (truncated)
- Given a wave card with no drops, when I view it, then the message preview area is hidden

### US-003: Navigate to Wave
As a visitor, I want to click a wave card to view the full conversation so that I can participate in the discussion.

**Acceptance Criteria:**
- Given I am viewing a wave card, when I click anywhere on the card, then I navigate to the wave detail page (`/waves/{id}`)
- Given I am viewing a wave card, when I middle-click or Cmd/Ctrl+click, then the wave opens in a new tab

### US-004: Navigate to Full Discovery Page
As a visitor, I want to access more waves beyond the 6 shown so that I can explore the full range of conversations.

**Acceptance Criteria:**
- Given I am viewing the Explore waves section header, when I see it, then there is a "View all" link visible
- Given I click the "View all" link, when the navigation completes, then I am on the `/discover` page

## User Flow

1. User lands on homepage or scrolls down from top
2. User sees existing sections (Carousel, Now Minting, Next Mint, Boosted)
3. User scrolls to see "Explore waves" section
4. User views the 6 wave cards with images, names, and activity metadata
5. User clicks a wave card of interest
6. User navigates to the wave detail page to join the conversation
7. Alternatively, user clicks "View all" to browse more waves on `/discover`

## Interaction States

### Loading State
- Show 6 skeleton cards with shimmer animation
- Each skeleton has: image placeholder (aspect-ratio preserved), text line placeholders for name and metadata

### Empty State
- If no waves are returned (unlikely but possible), hide the entire section
- Do not show an empty grid or error message

### Error State
- If API fails, hide the entire section (silent failure)
- Log error to console for debugging

### Success State
- Display up to 6 wave cards in a responsive grid
- Cards show wave image (or gradient), name, metadata, and message preview (when available)

## Accessibility Requirements

- **Keyboard navigation**: Cards must be focusable and activatable via Enter/Space
- **Screen reader**: Each card has an aria-label like "View wave {name}"
- **Focus management**: Visible focus ring on card hover/focus (use existing `focus-visible:tw-ring-2` pattern)
- **Color contrast**: Text on image overlays must meet WCAG AA (use existing gradient overlay pattern from `WaveItem.tsx`)
- **Link semantics**: Cards should be rendered as `<Link>` elements for proper navigation semantics

## Mobile Considerations

- **1 column** on screens < 768px (mobile)
- **2 columns** on screens 768px-1023px (tablet)
- **3 columns** on screens >= 1024px (desktop)
- Touch-friendly tap targets (entire card is tappable)
- No horizontal overflow; cards stack vertically on mobile

## Technical Constraints

### API Dependency
- Uses public endpoint: `GET /api/public/waves-overview?type=Latest&limit=6`
- Response type: `ApiWave[]`
- No authentication required for public endpoint

### Backend Enhancement Needed
- Current `ApiWave` does not include latest drop content text
- **Placeholder implementation**: Until backend adds `latest_drop_content` field, show placeholder text or hide message preview
- When backend is ready: Display first 80 characters of latest drop content, truncated with "..."

### Performance
- Lazy load wave images with `loading="lazy"`
- Use existing `getScaledImageUri` helper with `ImageScale.AUTOx450` for images
- Prefetch disabled on card links to prevent unnecessary data loading

## Files to Create

| File Path | Purpose |
|-----------|---------|
| `components/home/explore-waves/ExploreWavesSection.tsx` | Main section component with header and grid |
| `components/home/explore-waves/ExploreWaveCard.tsx` | Individual wave card component matching design |
| `components/home/explore-waves/ExploreWaveCardSkeleton.tsx` | Loading skeleton for wave card |
| `components/home/explore-waves/index.ts` | Barrel export file |

## Files to Modify

| File Path | Changes |
|-----------|---------|
| `components/home/HomePageContent.tsx` | Import and add `<ExploreWavesSection />` after `<BoostedSection />` |

## Components to Reuse

| Component | Path | Usage |
|-----------|------|-------|
| `getScaledImageUri` | `helpers/image.helpers` | Scale wave images to appropriate size |
| `getTimeAgoShort` | `helpers/Helpers` | Format "Last message Xm" relative time |
| `commonApiFetch` | `services/api/common-api` | Make API request to public endpoint |
| `useInfiniteQuery` / `useQuery` | `@tanstack/react-query` | Data fetching with caching |
| `CircleLoader` | `components/distribution-plan-tool/common/CircleLoader` | (Optional) Loading indicator |

## Design Specifications

### Section Layout
```
Header Row:
- Left: "Explore waves" (h2, text-xl font-semibold text-iron-50)
- Left below: "Browse channels—jump into the conversation." (p, text-sm text-iron-400)
- Right: "View all" link (text-sm text-iron-400 hover:text-iron-50)

Grid:
- gap-4 lg:gap-5
- grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

### Card Layout (per design mockup)
```
Card Container:
- rounded-xl (border-radius: 12px)
- bg-iron-950 (dark background)
- overflow-hidden

Image Area:
- aspect-ratio ~16:10 (tw-aspect-[16/10])
- object-cover
- Gradient fallback if no image (use author banner colors)

Content Area (below image):
- padding: 16px (tw-p-4)
- Wave name: text-lg font-bold text-white, line-clamp-1
- Metadata: text-sm text-iron-400, "Last message {time} · {count} today"
- Message preview:
  - Chat bubble icon (tw-text-iron-500)
  - Message text: text-sm text-iron-300, line-clamp-1
```

## Out of Scope

- "X active" badge (placeholder only in design, not implementing)
- Link icon next to message (was placeholder in design)
- Infinite scroll / "Load more" functionality
- Search or filter within this section
- Different wave type categories (only showing "Latest")
- Real-time updates (data refreshes on page load only)

## Validation Commands

```bash
# Type check
npx tsc --noEmit

# Run lint on uncommitted files (strict)
npm run lint:uncommitted:tight

# Run tests (if tests are added)
npm test -- --testPathPattern="explore-waves"
```

## References

- Design mockup: Screenshot provided by user
- Existing wave card: `components/waves/list/WaveItem.tsx`
- Existing section pattern: `components/home/boosted/BoostedSection.tsx`
- Public API: `public/waves-overview` endpoint
