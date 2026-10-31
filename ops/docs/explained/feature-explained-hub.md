# 6529 Explained hub

Parent: [6529 Explained](README.md)

## Overview

`/explained` answers how 6529 works, and how we know. It opens on one line
about what 6529 is, draws the loop of the network with a live number at each
station, lists three things anyone can check today, and leads to the
chapters. TDH is the one live chapter; the others are listed in their order
as coming.

## Location in the Site

- Route: `/explained`; `/explained/tdh` redirects to `/network/tdh`.
- Sidebar path: `About -> 6529 Explained`, the first row of the About menu,
  above its groups. The entry is defined once
  (`components/navigation/explainedNavEntry.ts`), so it can move to the main
  menu without changing.
- Sections: the opener, the loop, `#paths`, `#chapters`, `#cc0`, `#guide`,
  `#corrections`, and How we know.
- The page renders in the reader's language (en-US, en-GB, fr-FR, es-ES,
  de-DE); `?locale=` picks one.

## What Users Can Do

1. Read the title and the line under it. The line is one message key
   (`explained.hub.mission`), kept for the owner's mission sentence.
2. Read the loop: Art (the cards), Hold (wallets), Time (today's total TDH),
   Standing, Decide (Main Stage's decisions) and Execute around Verify (equal
   on every identity today), with Ethereum underneath and CC0 leaving Art.
   `Follow one copy` steps a copy round the stations; the card beside it gives
   the station's number and one sentence, and links to chapter 01, TDH. On a
   phone and a tablet the loop is a list.
3. Read `Three things you can check today`: every identity equal in today's
   comparison and in every result since the first, the Lean theorems with the
   earlier claims shown false, and the one day proved in zero knowledge (proof
   A, program A run inside SP1) with proof B not done.
4. Pick a reading path under `Who are you reading as?`, each with its pages
   and the time it takes.
5. Read `The chapters`: TDH live with its link, then The Memes and CC0, Waves
   and decisions, Validators, NextGen, Rep, NIC and Level, 6529 Works, and Why
   6529 and the network, each with its question, whether its subject runs
   today, and what it waits on. Validators shows its software as built and
   being tested. Coming chapters have no link.
6. Read `CC0, in one minute` (`#cc0`): the art is free to copy, remix and sell,
   holding is what earns TDH, and where CC0 stops (Meme Card #1's CryptoPunk;
   6529 Gradients). `Download Meme #2` opens the original file.
7. Read `How to read these pages` for the marks every claim uses, and the
   corrections log (`#corrections`), which every page's `Corrections log`
   action opens.
