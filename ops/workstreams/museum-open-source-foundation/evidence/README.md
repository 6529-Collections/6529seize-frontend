# Canonical-main visual evidence

These screenshots were retained from the successful production build against
canonical Museum source commit
`bd853b483f807aad6d737305a9f78b1273bb2356`.

| File                                               |   Viewport | Assertion                                                                                  |
| -------------------------------------------------- | ---------: | ------------------------------------------------------------------------------------------ |
| `canonical-about-desktop-1280x720.png`             | 1280 x 720 | Native desktop shell, one H1, public operating statement and art-site typography           |
| `canonical-about-mobile-390x844.png`               |  390 x 844 | Native mobile shell, one H1, no horizontal overflow                                        |
| `canonical-home-source-strip-desktop-1280x720.png` | 1280 x 720 | Quiet shared exact-source/contribution strip below the art-led home content                |
| `canonical-object-01-mobile-390x844.png`           |  390 x 844 | Artwork remains primary; shared strip is present once in the route DOM; no overflow        |
| `canonical-sources-mobile-390x844.png`             |  390 x 844 | Visitor research title and Open Museum context; internal writing-lane copy remains omitted |

Measured DOM values were `innerWidth=1280`, `clientWidth=1265`,
`scrollWidth=1265` on desktop and `innerWidth=390`, `clientWidth=375`,
`scrollWidth=375` on mobile. The 15-pixel difference is the visible vertical
scrollbar, not horizontal overflow.
