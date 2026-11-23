# Coordinator notes

## Round 00 (candidate 594edd4)

- The curatorial lens file was written in Windows-1252; the coordinator re-saved it as
  UTF-8 with the same content before scoring.
- Score: `repair`, total 7.959. Open required: C-001 to C-004, V-001, V-002, E-001
  (P1, failed I2), E-002 to E-004. Below the floor: J07, J09, J14.
- V-001 had a cause in code: the Accessions entity group and the Accession records group
  shared the React key `ACCESSION`, so filtering left a stale group on screen.

## Round 01

- Repair batch 1 addresses every required finding. The candidate is served at
  http://localhost:3343 as a production build. Round 00 evidence moved to
  `evidence-round-00/`.
- Repair batch 1 is commit 43538a2; 1a93640 punctuates built credits after titles that
  end a sentence (found in the builder's own read of the captures before judging).
- Score: `repair`, total 8.468. All round 00 findings resolved; V-003 (card frames
  letterbox images in squares) raised to P2 to cover J06 at 8.

## Round 02

- Repair batch 2: work cards follow each image's proportion with no letterbox, in one
  column below 480 px; "1 Museum record" is singular. Round 01 evidence moved to
  `evidence-round-01/`.
- Score: `accepted`, label `judge-accepted (uncalibrated)`, total 8.5, every dimension
  at 8.5, every check passing, no open required finding. Open P3: V-004 (in a grid row
  a tall portrait card sets the row height, leaving space under landscape cards).
- After acceptance the Playwright spec scrolls to a work card before expecting its image,
  because cards load images as they near the viewport; the spec change touches no
  product code.
