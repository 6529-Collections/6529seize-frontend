# 6529SEIZE-FRONTEND

PORT: 3000

### Install

```
npm i
```

### Build

```
npm run build
```

### Environment

To run the project you need a .env file.

[Sample .env file](https://github.com/6529-Collections/6529seize-frontend/tree/main/.env.sample)

### Pepe.wtf previews

The chat now renders cards for pepe.wtf assets, collections, artists and sets.
Environment variables (with defaults) allow you to tune caching and IPFS
gateway usage:

- `PEPE_CACHE_TTL_MINUTES` (default `10`)
- `PEPE_CACHE_MAX_ITEMS` (default `500`)
- `IPFS_GATEWAY` (default `https://ipfs.io/ipfs/`)

To test end-to-end:

1. Run `npm run dev`.
2. Paste any pepe.wtf link in chat, for example `https://pepe.wtf/asset/GOXPEPE`
   or `https://pepe.wtf/artists/Easy-B`, and confirm the preview renders with
   imagery and stats.
3. Re-run the same link and confirm the network response for
   `/api/pepe/resolve` includes the header `X-Cache: HIT`.

### Run

- Locally

```
npm run dev
```

- Production

```
npm run start
```

### RUN USING PM2

```
pm2 start npm --name=6529seize -- run start
```

## Directory Structure

This project uses both the legacy `pages/` directory and the new `app/` router
from Next.js. Existing pages remain under `pages/`, while **all new pages should
be created in `app/`**.

Pages inside `app/` must define a `generateMetadata` function that returns the
result of `getAppMetadata`:

```ts
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "My Page" });
}
```

This ensures consistent SEO metadata across routes.
