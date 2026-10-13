# World time-zone map data

`world-time-zones.generated.json` is the map drawn on `/tools/time-zones`. It is
loaded only by that page, through a dynamic `import()`, so it ships as a lazily
loaded `/_next/static` chunk. Do not edit it by hand; regenerate it with
`scripts/generate-world-time-zones.cjs`.

## Source

- Project: [timezone-boundary-builder](https://github.com/evansiroky/timezone-boundary-builder)
  by Evan Siroky. IANA time-zone polygons derived from OpenStreetMap data.
- Release: [`2026e`](https://github.com/evansiroky/timezone-boundary-builder/releases/tag/2026e)
  (published 2026-10-11).

| Release asset                           | SHA-256 (as downloaded)                                            | Used for                               |
| --------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `timezones-with-oceans-now.geojson.zip` | `4807d56a629c4ade3648f49843376e7f41d32e90f9621d146d2682bbb5e20021` | Zone polygons (`zones[].d`)            |
| `timezone-names-with-oceans-Now.json`   | `3cadd8f4d19546681d043c0c65406fceba506a41c084fc889a1bc6b1ae000cdc` | IANA zones per merged zone (`members`) |
| `timezones-now.geojson.zip`             | `a46516d04c43b32f5c527a2e5a3d5ad0308e65144730a57f04eec66c49ce59d0` | Land mask (`land`)                     |

The digests match the ones GitHub publishes for each release asset.

"now" files merge zones whose clocks agree from the release date on, so the
map has one polygon per distinct current clock (66 in `2026e`) and `members`
lists the IANA zones each polygon stands for. "with-oceans" adds the nautical
`Etc/GMT±N` zones so the whole globe is covered. The land-only file is the mask
that draws land in full color and open ocean muted, since land and ocean share
one merged zone.

## Regenerating

1. Download the three assets of the chosen release into a new, empty directory
   and verify each SHA-256 against the release page.
2. Unzip the two `.zip` files into their own directories.
3. Run, from the repository root:

   ```sh
   node scripts/generate-world-time-zones.cjs \
     --geojson <dir>/combined-with-oceans-now.json \
     --names <dir>/timezone-names-with-oceans-Now.json \
     --land <dir>/combined-now.json \
     --release <tag> \
     --out components/tools/time-zones/data/world-time-zones.generated.json
   ```

4. Update the release, digests and sizes in this file.

The generator uses only Node built-ins. It densifies long edges, projects with
Equal Earth, simplifies each ring with Douglas–Peucker (tolerance 0.35 map
units), quantizes to an integer grid 2000 units wide, and writes relative SVG
path strings. Output for `2026e`: 175,500 bytes raw, about 52 KB gzip.

## License

The boundary data is © OpenStreetMap contributors and timezone-boundary-builder
contributors, made available under the
[Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
`world-time-zones.generated.json` is a derivative database of that data and is
likewise made available under the ODbL 1.0. The page that renders it credits
the sources and links here. The generator script is part of this repository
and is covered by the repository license.
