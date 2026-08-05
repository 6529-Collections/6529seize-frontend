# Keys and Gates Winners

[Back to Network Museum](README.md)

## Overview

Keys and Gates presents the sixteen photographs selected by TDH for the
Network Museum's first acquisition program. The selection is complete, but the
works have not yet been minted, acquired, placed in Museum custody, or
accessioned. The page shows that journey directly: selection is complete,
minting is waiting for the 6529Stream contract to be finalized, and Museum
acquisition and accession checks follow a future mint.

## Location in the Site

The program is at `/museum/network/programs/6529NM-AP-01`. Each winner links to
an artwork page under `/museum/network/objects/`.

## Entry Points

- Open **Museum**, then **Programs**, then **Keys and Gates**.
- Follow a direct link to the Keys and Gates program.
- Open an individual winner from a shared artwork link.

## User Journey

1. Read the program banner to see the sixteen-work result and current contract
   dependency.
2. Review the three-stage journey: chosen by TDH, mint on 6529Stream, then
   acquire and accession.
3. Browse the responsive winner grid and open a photograph without losing its
   original proportions.
4. On the artwork page, read the artist statement and recorded selection
   details.
5. Use **Open submitted high-resolution image** when the submitted source is
   needed instead of the web presentation copy.

## Common Scenarios

### Browsing all winners

The grid loads smaller presentation copies first and lets the browser choose a
larger copy for wide or high-density displays. Images are not cropped.

### Inspecting a work closely

Open the winner's artwork page for a larger responsive view. The submitted
high-resolution image is available as a separate link below the viewer.

### Checking whether a winner is in the collection

Use the status text on the program or artwork page. A Keys and Gates winner is
still `Selected; unminted` until primary mint evidence and the later Museum
acquisition and accession checks exist. Selection alone does not make the work
a Museum holding.

## Edge Cases

- A browser may briefly show empty image space while the closest CloudFront
  presentation copy is fetched.
- A winner can have portrait, landscape, or square proportions; the viewer
  preserves them instead of forcing a common crop.
- The submitted high-resolution source can be much larger than the responsive
  presentation copy and may take longer to open.

## Failure and Recovery

- If one image does not appear, reload the page or open the winner's artwork
  page. Other winners remain independently browsable.
- If the high-resolution source is unavailable, return to the artwork page and
  use its responsive presentation copy. The source link is not silently
  replaced with a lower-resolution file.
- If the exact Museum source publication cannot be verified, the site uses its
  established atomic-publication failure behavior rather than mixing records
  from different releases.

## Limitations / Notes

- Responsive WebP files are delivery surrogates, not preservation masters and
  not tokenized artworks.
- The high-resolution link points to the recorded submitted source. Its
  presence does not establish title, custody, rights, acquisition, or
  accession.
- Mint timing depends on finalization of the 6529Stream contract. The page does
  not predict a date.
- Visual descriptions are accessibility text and may be refined through the
  Museum's reviewed record process.

## Related Pages

- [Network Museum](README.md)
- [Institutional practice](feature-institutional-practice.md)
- [Public Contract Reviews](../public-reviews/README.md)
