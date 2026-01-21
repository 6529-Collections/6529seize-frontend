Your cards are trying to be both “teaser” and “reader,” and truncation makes them fail at both. Better patterns are all about separating browse from read while keeping the row visually clean.
1) Carousel + reading pane (my default pick)
Keep the horizontal row, but make each card a teaser (title + 1–2 lines). When a card is focused, show the full text in a fixed reading pane to the right (or below on mobile).
Rough layout:
Boosted Drops
[ card ][ card ][ card ][ card ]    |  Selected drop (full text)
                                    |  metadata + actions
                                    |  scrollable reader

Why it fixes it:

No truncation needed in cards (or keep it minimal and intentional).
You get a real reading surface without changing the browse density.
Works perfectly with keyboard navigation (left/right to browse, enter to open).

Visual tweaks that make it feel premium:

Selected card gets a subtle glow + slightly larger scale.
Reading pane shows: title, source, author, time, and clean typography.

2) “Spotlight expand” card (expands in place)
Click a card and it expands to 2× width (sometimes 2× height) inside the carousel, pushing neighbors aside. Close collapses it back.
[ card ][  EXPANDED CARD (more text + actions)  ][ card ]

Why it fixes it:

You still “read” in the same row context.
Feels interactive and modern, no separate page.

Rule of thumb:

Expand width first (more comfortable for text).
Keep height stable to avoid the whole page jumping.

3) Hover/tap “popover reader” (no layout shift)
On hover (desktop) or tap (mobile), open a floating panel above the card with the full excerpt (or a longer chunk), plus “Open” action.
          [ floating reader panel ]
[ card ][ card ][ card ][ card ]

Why it fixes it:

Zero reflow.
Cards stay uniform and clean.
Great for quick scanning.

Make it feel intentional:

Use a soft top/bottom fade inside the popover, not a hard cutoff.
Add a clear “Open full” button so it’s not a mystery interaction.

4) Make truncation look designed (fade + “Read more”, never raw ellipses)
If you insist on fixed-height quote cards, don’t hard-cut mid-sentence with .... Use a bottom gradient fade plus a “Read more” chip.
Inside each card:

Title (1 line)
Excerpt (clamped to, say, 6–8 lines)
Bottom fade overlay
“Read more” pill

This makes the cutoff feel like an editorial choice, not a bug.
5) Switch from carousel to masonry feed (variable height)
If “reading the text itself” is the main point, a horizontal carousel is the wrong container. A masonry grid lets long posts be taller and short posts be compact.
[ tall card ] [ short ]
[ medium    ] [ tall  ]

Why it fixes it:

No truncation pressure.
You can still keep a “Boosted” sorting/filter at the top.

6) Featured hero + compact strip (best for “Boosted”)
Give the most-boosted item a large hero card with real readable text, then keep the rest as compact cards.
[ HERO: full readable excerpt + actions ]
[ small ][ small ][ small ][ small ][ small ]

Why it fixes it:

“Boosted” implies hierarchy. Use it visually.
You keep density without punishing readability.

One specific improvement you should do regardless
That first card is basically a raw URL. Treat content types differently:

If it’s a link: render a link preview (title, domain, favicon, maybe a thumbnail).
If it’s a tweet/post: render like a post (author, handle, timestamp, then excerpt).
If it’s a doc: show doc title + source + short summary, not the URL string.
