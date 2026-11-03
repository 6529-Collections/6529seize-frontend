# World time-zone map data

`world-time-zones.generated.json` is the map drawn on `/tools/time-zones`. Only
that page loads it, through a dynamic `import()`, so it ships as a lazily
loaded `/_next/static` chunk. Do not edit it by hand; regenerate it with
`scripts/generate-world-time-zones.cjs`.

## Public domain

All inputs are in the public domain, so the generated file is too. Credits on
the page are a courtesy, not a license condition.

- **Natural Earth** land outline. The Natural Earth terms of use put all
  versions of its raster and vector map data in the public domain:
  https://www.naturalearthdata.com/about/terms-of-use/. The `LICENSE.md` file
  in the distribution repository at `v5.1.2` says the same.
- **IANA Time Zone Database** (tzdata) zone locations and alias names. Its
  `LICENSE` file states that the tz code and data are in the public domain:
  https://www.iana.org/time-zones

## Sources

| Input                                              | Version                                                                                       | SHA-256                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `geojson/ne_50m_land.geojson`                      | Natural Earth [`v5.1.2`](https://github.com/nvkelso/natural-earth-vector/releases/tag/v5.1.2) | `e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b` |
| `tzdata2026e.tar.gz`                               | tzdata [`2026e`](https://data.iana.org/time-zones/releases/tzdata2026e.tar.gz)                | `b26882805f26aac59d5b222978e6580484b834ccdc98be89df2f05a6dc53a652` |
| `zone1970.tab` (from `tzdata2026e.tar.gz`)         | tzdata `2026e`                                                                                | `5f23781702bf51408ff1581daa109ab3b9257fb433b1554e579d92172892c0cf` |
| `backward` (from `tzdata2026e.tar.gz`)             | tzdata `2026e`                                                                                | `b8296b9ef1ece72d813878132c0f17e2c52b26af6004eeb9c37d049b64cd9401` |
| `world-time-zones.generated.json` (this directory) | generated                                                                                     | `3156113472f5943a5c14b21ed8c423da663d9a9f87c359d8fa663a7576f1e0f9` |

How each input was checked:

- **Natural Earth.** The GeoJSON comes from the official
  `nvkelso/natural-earth-vector` repository at tag `v5.1.2`. Its git blob id
  (`c412c52b5286ba727dcb7047ecd6080bcbeb8298`) matches the one recorded in the
  repository tree at that tag.
- **tzdata.** The tarball comes from data.iana.org. Its detached signature
  (`tzdata2026e.tar.gz.asc`) verifies against the tz maintainer key
  `7E37 92A9 D8AC F7D6 33BC 1588 ED97 E90E 62AA 7E34`.

## Contents

- `sphere`: the outline of the globe.
- `graticule`: faint meridians at the edges of the 24 nautical time-zone
  bands.
- `land`: Natural Earth 1:50m land, densified, projected, simplified with
  Douglas–Peucker (tolerance 0.45 map units) and quantized to a 2000-unit-wide
  integer grid.
- `zones`: one projected point per `zone1970.tab` entry (312 in `2026e`). This
  is each zone's principal location, in ISO 6709 coordinates.
- `links`: alias names from `backward` that point to a mapped zone (237 in
  `2026e`). The page uses them to place a viewer whose browser reports an
  alias, such as `Europe/Amsterdam`, which is drawn at `Europe/Brussels`.

Output for these inputs: 70,860 bytes raw, about 22 KB gzip.

## Regenerating

1. Download into a new, empty directory:
   - `geojson/ne_50m_land.geojson` from the chosen `nvkelso/natural-earth-vector` tag;
   - `tzdata<version>.tar.gz` and its `.asc` signature from
     https://data.iana.org/time-zones/releases/.
2. Verify both inputs as described above, then unpack the tarball into its
   own directory.
3. Run, from the repository root:

   ```sh
   node scripts/generate-world-time-zones.cjs \
     --land <dir>/ne_50m_land.geojson \
     --zone1970 <dir>/zone1970.tab \
     --backward <dir>/backward \
     --natural-earth <tag> \
     --tzdata <version> \
     --out components/tools/time-zones/data/world-time-zones.generated.json
   ```

4. Update the versions, digests and sizes in this file.

The generator uses only Node built-ins. For the same inputs it writes
byte-identical output.
