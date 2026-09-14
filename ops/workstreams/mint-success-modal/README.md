# Mint success confirmation

The confirmed mint state now leads with `SEIZED!`, identifies the artwork and
collection, and retains the submitted quantity and destination wallet. `Done`
returns to the mint page; transaction details remain available as a secondary
link. Wallet confirmation, submission, failure, and other transaction callers
retain their existing behavior.

## Browser evidence

These screenshots render the actual transaction modal and mint receipt components
with the repository Tailwind styles and Montserrat font. The transaction receipt
and wallet address are simulated. The artwork is the public Meme #547 metadata
image. The component harness substitutes Next Image's DOM wrapper and the shared
transaction-link helper; it does not submit or sign a transaction.

- [Desktop, 1440 × 900](evidence/desktop.png)
- [Mobile, 390 × 844](evidence/mobile.png)

Browser verification covered `en-US`, `en-GB`, `fr-FR`, `es-ES`, and `de-DE` at
1440 × 900, 390 × 844, 320 × 568, and 667 × 320, plus missing/broken artwork,
long unbroken text, and a submitted-to-confirmed transition. The dialog stayed
within the viewport, scrolled in short layouts, and kept its actions reachable.
The WCAG A/AA automated scan reported no violations. Manual checks verified
forward/reverse focus trapping, visible focus on each action, Escape/Done
closure, and restoration of focus to the initiating control.

## Regression coverage

Focused tests cover confirmation-only content, immutable receipt values during
background refreshes, image failure recovery, transaction link semantics,
keyboard dismissal, focus restoration, and reminting. Existing subscription,
Drop Forge, and parent mint component suites also passed.

## Localization scope

The success receipt and its accessible labels have messages in all five supported
locales. The unchanged wallet-confirmation, submitted, and error states retain
their existing partial English fallback; completing those states remains part
of the surrounding mint-flow localization work.
