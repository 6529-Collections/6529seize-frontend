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
