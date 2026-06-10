# 6529seize-frontend

DeepSec prompt context for this repo. Keep this short; built-in matchers handle generic bug classes.

## What this codebase does

- Next.js App Router frontend for 6529.io: waves, drops, profiles, groups,
  notifications, NFT collection pages, Drop Forge, and public content pages.
- Client stack is React 19, React Query, Reown AppKit/wagmi/viem wallet auth,
  Bootstrap/Tailwind styles, Capacitor mobile helpers, and generated API models.
- Most product data comes from `publicEnv.API_ENDPOINT` through `commonApi*`
  helpers, `fetchUrl`, or server-side fetch wrappers.
- App Router API routes act as small public proxies for Open Graph previews,
  TikTok, Farcaster, Wikimedia, Pepe resolution, Alchemy NFT metadata, and image proxying.
- Media flows include presigned multipart uploads, IPFS/Arweave/gateway
  rendering, interactive HTML media, PDFs, video, audio, and 3D models.

## Auth shape

- Wallet connection lives in `SeizeConnectProvider` / `useSeizeConnectContext`;
  key actions are `seizeConnect`, `seizeDisconnect`, `seizeDisconnectAndLogout`,
  `seizeSwitchConnectedAccount`, and `seizeAcceptConnection`.
- App auth lives in `Auth` / `useAuth`; `requestAuth` signs a server nonce,
  calls `auth/login`, persists `wallet-auth`, and tracks `activeProfileProxy`.
- Token helpers are `getAuthJwt`, `setAuthJwt`, `removeAuthJwt`,
  `clearAllWalletAuth`, `getConnectedWalletAccounts`, `isAuthAddressAuthorized`,
  and `getStagingAuth`.
- Validation primitives are `validateAuthImmediate`, `validateJwt`,
  `redeemRefreshTokenWithRetries`, `validateRoleForAuthentication`, and
  `syncWalletRoleWithServer`.
- API auth headers are added by `commonApiFetch`, `commonApiPost`,
  `commonApiDelete`, `commonApiPut`, `commonApiPatch`, `fetchUrl`,
  `getAppCommonHeaders`, and server `ssrFetch`.

## Threat model

- The highest-impact bugs let a user act as another wallet/profile/proxy role,
  create or modify waves/drops/groups/votes/subscriptions, claim Drop Forge
  assets, or read private messages/notifications.
- `wallet-auth`, refresh tokens, `x-6529-auth`, and `x-6529-internal-*` headers
  are sensitive; local storage role state is not authoritative.
- Public preview/proxy routes fetch attacker-controlled URLs, so URL parsing,
  host policy, redirect handling, and final URL validation are part of the trust boundary.
- User media can contain external HTML or embeds; safe paths go through canonical
  IPFS/Arweave URL checks and a strongly sandboxed iframe.

## Project-specific patterns to flag

- Mutating UI code under waves, groups, proxy, notifications, Drop Forge, or
  profile settings that calls `commonApi*`, `multiPartUpload`, or direct `fetch`
  without a nearby `requestAuth` gate when the action depends on identity.
- Direct calls to `publicEnv.API_ENDPOINT` or allowlist APIs that hand-roll auth
  headers instead of using `commonApi*`, `fetchUrl`, `getAppCommonHeaders`, or `ssrFetch`.
- New App Router handlers that accept a `url` parameter but do not use
  `parsePublicUrl`, `assertPublicUrl`, `fetchPublicUrl`, and a tight host policy.
- Untrusted interactive media rendered without `canonicalizeInteractiveMediaUrl`
  and `SandboxedExternalIframe`, or iframe sandbox changes that add same-origin,
  popups, pointer lock, or broad permissions.
- Profile-proxy auth changes that trust `wallet-role`, `activeProfileProxy`, or
  dev auth values instead of the server-issued JWT role and `validateRoleForAuthentication`.

## Known false-positives

- `app/tools/api/page.tsx` intentionally shows public API sample code,
  including placeholder private keys and bearer-token examples.
- `app/access/page.client.tsx`, `app/restricted/page.client.tsx`, and `proxy.ts`
  intentionally use the `x-6529-auth` staging/team gate; it is separate from wallet authorization.
- `app/api/sentry-example-api/route.ts` and `app/sentry-example-page/page.tsx`
  intentionally throw sample Sentry errors.
- Static marketing/content pages use hardcoded `dangerouslySetInnerHTML` for
  imported markup; treat as risky only if the source becomes user-controlled.
- Public helper routes such as `app/api/open-graph/*`, `app/api/tiktok/route.ts`,
  `app/api/pepe/resolve/route.ts`, `app/api/wikimedia-card/route.ts`, and
  `app/api/alchemy/*/route.ts` are intentionally unauthenticated.
