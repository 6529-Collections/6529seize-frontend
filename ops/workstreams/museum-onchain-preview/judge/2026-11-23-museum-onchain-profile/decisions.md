# Coordinator notes

## Round 00 (candidate 5bb2062230)

- Score: `repair`, total 7.55. Failed checks I1, I2, I3 (fixture values and fixture reads presented
  as chain reads, machine identifiers as content). Open required: C-001 to C-004, V-001 to V-005,
  E-001 to E-007.

## Round 01 (candidate 77d78369a5)

- Repair batch 1: fixture mode says so in the banner, intro, verified line and facts block, and
  marks contract checks "Not checked"; holdings lead the index; text rows carry their kind;
  fixed caption fields; acquisitions and programs split; proposed-gift groups named by their
  acquisition; dated observation labels; secondary stored values behind a disclosure; image cards
  in columns.
- Score: `repair`, total 8.055. Failed check I3 (h1 and titles still implied a chain read). Open
  required: C-001, C-002, C-003, V-002, V-005, E-001, E-005.

## Round 02 (candidate ad734e90af)

- Repair batch 2 (b82d3dd4a3, then ad734e90af before judging): collection works grouped by
  accession with year; artist works with year and accession number; caption fields fixed with a
  caveat-only medium note; license named once with a link to the PRV_RIGHTS record; image beside
  its caption at desktop widths; back-to-sections links; fixture h1 and neutral page titles.
- The first scoring of round 02 returned `invalid_judge_output` ("Total 8.355 is below 8.5 with
  no open required finding"): the visual lens carried J08, J09, J11 and J13 at 8.0 without
  findings. The visual judge was rerun once with the error quoted; it rescored the four
  dimensions from the round 02 evidence at 8.5 and filed no finding.
- Score: `accepted`, label `judge-accepted (uncalibrated)`, total 8.5. Open P3: C-005 (caption
  does not call the Molnár image a still), C-006 (CENTURY #31 date not established while its
  catalogue text title gives 2021), E-004 (three "Acquisition program" jump entries differ after a
  middle dot), E-005 (credit line and rights line both name the license).
- After acceptance the Playwright spec accepts the fixture heading as well as the live one; the
  change touches no product code.
