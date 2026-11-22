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
