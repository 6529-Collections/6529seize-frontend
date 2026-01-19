# Submission Carousel Specification

> **Figma Mockup**: [Wave Detail View](https://www.figma.com/make/Rs386mBLtLfeRFPPOzpTZB/Wave-Detail-View)

---

## Layout - Desktop

```
         ┌─────────┐ ┌─────────┐ ┌─────────┐
    ◀    │         │ │  MAIN   │ │         │    ▶
         │  prev   │ │ ARTWORK │ │  next   │
         └─────────┘ └─────────┘ └─────────┘
```

---

## Layout - Tablet

```
      ┌─────────┐ ┌─────────┐
  ◀   │         │ │  MAIN   │   ▶
      │  prev   │ │ ARTWORK │
      └─────────┘ └─────────┘
```

---

## Layout - Mobile

```
  ┌─────────────────┐
  │                 │
  │  MAIN ARTWORK  │◀▶
  │                 │
  └─────────────────┘
```

---

## Component Hierarchy

```
SubmissionCarousel
├── CarouselArrow (prev)
├── CarouselTrack
│   └── SubmissionArtworkCard (multiple)
└── CarouselArrow (next)
```

---

## Responsive Behavior

| Breakpoint | Visible Cards | Card Gap | Peek |
|------------|---------------|----------|------|
| Desktop (≥1200px) | 3 | 24px | None |
| Tablet (768-1199px) | 2 | 16px | 40px |
| Mobile (<768px) | 1 | 12px | 60px |

---

## Reusable Components

| Component | Reuse From |
|-----------|------------|
| ArtworkCard | `DropListItemContentMedia` |

---

## Animation

- **Scroll**: scroll-snap center, smooth scroll
- **Swipe**: enabled on touch devices
- **Arrows**: fade when at edge
- **Cards**: hover scale(1.02), 200ms ease-out
