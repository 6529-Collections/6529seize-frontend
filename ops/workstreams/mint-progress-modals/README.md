# Mint progress modal review

The wallet and submitted stages now share the artwork, quantity, and recipient
receipt introduced for the success state. Wallet confirmation uses a static
wallet icon and expandable recovery guidance. Submitted transactions show one
reduced-motion-aware spinner, network confirmation copy, and a secondary explorer
link. A current transaction hash keeps the submitted state visible between receipt
polls.

## Browser evidence

The actual mint transaction adapter and components were rendered with repository
styles, fonts, localization, and public artwork for The Memes #547. Receipt data,
hash, and stage transitions were simulated. The harness narrowly substitutes the
Next image wrapper and transaction-URL/address-comparison helpers. These are
component browser captures, not screenshots of a completed on-chain purchase.

| Stage               | Desktop (1440 × 900)                  | Mobile (390 × 844)                  |
| ------------------- | ------------------------------------- | ----------------------------------- |
| Wallet confirmation | [Desktop](confirm_wallet-desktop.png) | [Mobile](confirm_wallet-mobile.png) |
| Submitted           | [Desktop](submitted-desktop.png)      | [Mobile](submitted-mobile.png)      |

All 51 browser cases passed. Forty accessibility scans across five locales and
four viewports (1440 × 900, 390 × 844, 320 × 568, and 667 × 320) reported no axe
violations. Additional cases covered keyboard trapping, wallet-help disclosure,
pending dismissal protection, stage transitions, focus recovery and restoration,
reduced motion, missing or broken media, long text, and missing receipt/hash data.
The four screenshots were also visually inspected.

Focused validation passed 118 component, receipt, and localization tests,
changed-file lint and type checking, formatting, and whitespace checks. React
Doctor scored 97/100, with four existing widget warnings. An independent source
review found no actionable correctness, accessibility, or shared-caller
regression. Exact-commit CI and deployed-environment checks are recorded on the PR.
