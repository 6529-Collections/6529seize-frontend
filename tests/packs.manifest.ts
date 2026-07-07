// E2E pack manifest — the single source of truth for every Playwright pack.
//
// This file is intentionally written as CommonJS-styled TypeScript (no
// `import`/`export` syntax, plain `module.exports`) so the dependency-free
// check scripts (`scripts/sync-e2e-manifest.cjs`, `scripts/e2e-packs.cjs`)
// can `require()` it on a bare CI checkout via Node's built-in TypeScript
// type stripping (Node >= 22.18). Keep it import-free and erasable-syntax
// only: interfaces and typed const literals are fine; enums, namespaces and
// decorators are not.
//
// The `test:e2e*` script block in package.json, the pack tables in
// tests/README.md, and the workflow pack execution are all derived from this
// file. After editing it, run:
//
//   ./bin/6529 run e2e-manifest:sync
//
// and commit the regenerated files together with the manifest change. CI
// fails (Debt Ratchet workflow, "e2e manifest drift" step) when they are out
// of sync.
//
// Field semantics:
// - scriptKey:   the package.json script name this pack renders to.
// - safety:      "readonly"     — must not mutate the target environment;
//                                 the readonly mutation guard enforces this
//                                 at the network layer on staging/production.
//                "sandbox"      — local-only authenticated sandbox against a
//                                 mock API; never points at a real backend.
//                "local"        — local dev-server pack without a readonly
//                                 contract (mutations hit localhost only).
//                "staging-write"— reserved: real writes against staging via
//                                 the synthetic e2e identity (see the
//                                 mutation-guard safety classes).
//                "prod-canary"  — reserved: quarantined production canary.
// - environments: where the pack may run. The runner refuses to resolve a
//                 pack for an environment not listed here.
// - triggers:    which invocation contexts include the pack:
//                "post-deploy" (staging deploy gate), "cron" (scheduled
//                canary), "pr-ci" (app PR CI), "manual" (humans/agents).
// - env:         cross-env variables, in render order. Values containing
//                whitespace are wrapped in escaped quotes when rendered.
// - specs/grep/projects/workers/traceOff/extraArgs: the playwright CLI
//                invocation, rendered in that order.
//
// Array order is meaningful: the runner executes packs in manifest order.

interface PackDefinition {
  readonly scriptKey: string;
  readonly description: string;
  readonly safety:
    | "readonly"
    | "sandbox"
    | "local"
    | "staging-write"
    | "prod-canary";
  readonly environments: readonly ("local" | "staging" | "production")[];
  readonly triggers: readonly ("post-deploy" | "cron" | "pr-ci" | "manual")[];
  readonly env?: Readonly<Record<string, string>>;
  readonly specs?: readonly string[];
  readonly grep?: string;
  readonly projects?: readonly string[];
  readonly workers?: number;
  readonly traceOff?: boolean;
  readonly extraArgs?: readonly string[];
}

const DESKTOP = "web-desktop-chromium";
const MOBILE = "web-mobile-chromium";

const STAGING_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_BASE_URL: "https://staging.6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
};

const STAGING_READONLY_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_BASE_URL: "https://staging.6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
  PLAYWRIGHT_ENV: "staging",
  PLAYWRIGHT_READONLY: "1",
};

const PRODUCTION_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_BASE_URL: "https://6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
};

const PRODUCTION_READONLY_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_BASE_URL: "https://6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
  PLAYWRIGHT_ENV: "production",
  PLAYWRIGHT_READONLY: "1",
};

const COMPOSER_SANDBOX_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_ENV: "local",
  PLAYWRIGHT_COMPOSER_SANDBOX: "1",
  PLAYWRIGHT_FORCE_WEB_SERVER: "1",
  USE_DEV_AUTH: "true",
  DEV_MODE_WALLET_ADDRESS: "0x0000000000000000000000000000000000000529",
  PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE: "playwright",
  PLAYWRIGHT_WEB_SERVER_COMMAND: "node tests/support/composerSandboxServer.cjs",
};

const AUTH_SANDBOX_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_ENV: "local",
  PLAYWRIGHT_AUTH_SANDBOX: "1",
  PLAYWRIGHT_COMPOSER_SANDBOX: "1",
  PLAYWRIGHT_FORCE_WEB_SERVER: "1",
  USE_DEV_AUTH: "true",
  DEV_MODE_WALLET_ADDRESS: "0x0000000000000000000000000000000000000529",
  PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE: "playwright",
  PLAYWRIGHT_WEB_SERVER_COMMAND: "node tests/support/composerSandboxServer.cjs",
};

const PACKS: readonly PackDefinition[] = [
  // --- Local development entry points -----------------------------------
  {
    scriptKey: "test:e2e",
    description: "Full local suite on the desktop web shell.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    projects: [DESKTOP],
  },
  {
    scriptKey: "test:e2e:all-projects",
    description: "Full local suite across every configured project.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
  },
  {
    scriptKey: "test:e2e:ui",
    description: "Playwright UI mode for local debugging.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    extraArgs: ["--ui"],
  },

  // --- PR CI packs -------------------------------------------------------
  {
    scriptKey: "test:e2e:smoke",
    description: "Fast @smoke subset of home, about and The Memes.",
    safety: "local",
    environments: ["local"],
    triggers: ["pr-ci", "manual"],
    specs: [
      "tests/home/home.spec.ts",
      "tests/pages/about.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    grep: "@smoke",
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:critical-shell",
    description: "Boot/shell resilience pack.",
    safety: "local",
    environments: ["local"],
    triggers: ["pr-ci", "manual"],
    specs: ["tests/critical-shell"],
    projects: [DESKTOP],
    workers: 1,
  },

  // --- Local readonly packs (local mirrors of the deployed packs) --------
  {
    scriptKey: "test:e2e:social-readonly",
    description: "Waves and profile read-only journeys.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/social/waves-profile-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:media-readonly",
    description: "Media and mint detail read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/media/media-mint-detail-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:delegation-readonly",
    description: "Delegation surfaces read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/delegation/delegation-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:network-open-data-readonly",
    description: "Network open data API read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/network-open-data/network-open-data-api-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:collections-readonly",
    description: "NextGen collections read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/collections/nextgen-collections-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:public-groups-tools-readonly",
    description: "Public groups and tools read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/public-groups-tools/public-groups-tools-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:admin-guards-readonly",
    description: "Admin destructive-action fail-closed guards.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    env: { PLAYWRIGHT_READONLY: "1" },
    specs: ["tests/admin/admin-destructive-guards-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:public-content-readonly",
    description: "Public content pages read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    env: { PLAYWRIGHT_READONLY: "1" },
    specs: ["tests/content/public-content-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:authenticated-shells-readonly",
    description: "Authenticated shells, read-only, dev-auth only.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    env: { PLAYWRIGHT_READONLY: "1" },
    specs: ["tests/auth/authenticated-shells-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
    traceOff: true,
  },
  {
    scriptKey: "test:e2e:notifications-mutation-guard",
    description: "Negative contract: /notifications must not mutate.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    env: { PLAYWRIGHT_READONLY: "1" },
    specs: ["tests/auth/notifications-mutation-guard.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
    traceOff: true,
  },
  {
    scriptKey: "test:e2e:profile-deep-links-readonly",
    description: "Profile deep links read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    env: { PLAYWRIGHT_READONLY: "1" },
    specs: ["tests/social/profile-deep-links-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:search-waves-readonly",
    description: "Wave search read-only coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    env: { PLAYWRIGHT_READONLY: "1" },
    specs: ["tests/social/search-waves-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },

  // --- Local authenticated sandboxes (mock API, never a real backend) ----
  {
    scriptKey: "test:e2e:composer-sandbox",
    description: "Waves composer sandbox against the local mock API.",
    safety: "sandbox",
    environments: ["local"],
    triggers: ["manual"],
    env: COMPOSER_SANDBOX_ENV,
    specs: ["tests/social/waves-composer-sandbox.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
    traceOff: true,
  },
  {
    scriptKey: "test:e2e:reaction-sandbox",
    description: "Drop reaction sandbox against the local mock API.",
    safety: "sandbox",
    environments: ["local"],
    triggers: ["manual"],
    env: AUTH_SANDBOX_ENV,
    specs: ["tests/social/wave-reaction-sandbox.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
    traceOff: true,
  },
  {
    scriptKey: "test:e2e:edit-drop-sandbox",
    description: "Drop edit sandbox against the local mock API.",
    safety: "sandbox",
    environments: ["local"],
    triggers: ["manual"],
    env: COMPOSER_SANDBOX_ENV,
    specs: ["tests/social/wave-edit-drop-sandbox.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
    traceOff: true,
  },
  {
    scriptKey: "test:e2e:signature-sandbox",
    description: "Signed participation sandbox; fails closed unsigned.",
    safety: "sandbox",
    environments: ["local"],
    triggers: ["manual"],
    env: AUTH_SANDBOX_ENV,
    specs: ["tests/social/wave-signature-sandbox.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
    traceOff: true,
  },
  {
    scriptKey: "test:e2e:auth-sandbox",
    description: "Aggregate authenticated sandbox pack.",
    safety: "sandbox",
    environments: ["local"],
    triggers: ["manual"],
    env: AUTH_SANDBOX_ENV,
    specs: [
      "tests/social/waves-composer-sandbox.spec.ts",
      "tests/social/wave-edit-drop-sandbox.spec.ts",
      "tests/social/wave-reaction-sandbox.spec.ts",
      "tests/auth/notifications-sandbox.spec.ts",
      "tests/social/direct-message-sandbox.spec.ts",
      "tests/social/create-wave-sandbox.spec.ts",
      "tests/social/wave-signature-sandbox.spec.ts",
    ],
    projects: [DESKTOP],
    workers: 1,
    traceOff: true,
  },

  // --- Local surface-matrix / engine-diversity packs ---------------------
  {
    scriptKey: "test:e2e:smoke:surface-matrix",
    description: "@smoke subset on desktop and mobile web shells.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    specs: [
      "tests/home/home.spec.ts",
      "tests/pages/about.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    grep: "@smoke",
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:surface-matrix",
    description: "Core surfaces on desktop and mobile web shells.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    specs: [
      "tests/surfaces",
      "tests/home/home.spec.ts",
      "tests/pages/about.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:browser-diversity",
    description: "Engine diversity pass on Firefox and WebKit.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    specs: [
      "tests/surfaces",
      "tests/home/home.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    projects: ["web-desktop-firefox", "web-desktop-webkit"],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:native-sim",
    description: "Capacitor/Electron simulation surface pass.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    specs: [
      "tests/surfaces/core-surfaces.spec.ts",
      "tests/surfaces/native-shell-readonly.spec.ts",
    ],
    projects: [
      "capacitor-ios-sim",
      "capacitor-android-sim",
      "electron-shell-sim",
    ],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:native-shell-readonly",
    description: "Native shell read-only simulation coverage.",
    safety: "readonly",
    environments: ["local"],
    triggers: ["manual"],
    env: { PLAYWRIGHT_READONLY: "1" },
    specs: ["tests/surfaces/native-shell-readonly.spec.ts"],
    projects: [
      "capacitor-ios-sim",
      "capacitor-android-sim",
      "electron-shell-sim",
    ],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:wcag-i18n",
    description: "WCAG and i18n public-route evidence pack.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/wcag-i18n"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:wcag-i18n:surface-matrix",
    description: "WCAG/i18n pack on desktop and mobile web shells.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    specs: ["tests/wcag-i18n"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },

  // --- Staging post-deploy gate (execution order preserved) --------------
  {
    scriptKey: "test:e2e:staging:smoke",
    description: "Staging @smoke subset on both web shells.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: [
      "tests/home/home.spec.ts",
      "tests/pages/about.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    grep: "@smoke",
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging",
    description: "Staging core surfaces on both web shells.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: [
      "tests/surfaces",
      "tests/home/home.spec.ts",
      "tests/pages/about.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:social-readonly",
    description: "Staging waves/profile read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: ["tests/social/waves-profile-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:public-groups-tools-readonly",
    description: "Staging public groups/tools read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: ["tests/public-groups-tools/public-groups-tools-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:delegation-readonly",
    description: "Staging delegation read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: ["tests/delegation/delegation-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:collections-readonly",
    description: "Staging NextGen collections read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: ["tests/collections/nextgen-collections-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:admin-guards-readonly",
    description: "Staging admin fail-closed guard pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_READONLY_ENV,
    specs: ["tests/admin/admin-destructive-guards-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:public-content-readonly",
    description: "Staging public content read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_READONLY_ENV,
    specs: ["tests/content/public-content-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:profile-deep-links-readonly",
    description: "Staging profile deep links read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_READONLY_ENV,
    specs: ["tests/social/profile-deep-links-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:search-waves-readonly",
    description: "Staging wave search read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_READONLY_ENV,
    specs: ["tests/social/search-waves-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:media-readonly",
    description: "Staging media/mint detail read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: ["tests/media/media-mint-detail-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:network-open-data-readonly",
    description: "Staging network open data read-only pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs: ["tests/network-open-data/network-open-data-api-readonly.spec.ts"],
    projects: [DESKTOP, MOBILE],
    workers: 1,
  },

  // --- Production canary (daily cron; desktop-only, read-only) -----------
  {
    scriptKey: "test:e2e:production:social-readonly",
    description: "Production waves/profile read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_ENV,
    specs: ["tests/social/waves-profile-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:public-groups-tools-readonly",
    description: "Production public groups/tools read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_ENV,
    specs: ["tests/public-groups-tools/public-groups-tools-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:delegation-readonly",
    description: "Production delegation read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_ENV,
    specs: ["tests/delegation/delegation-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:collections-readonly",
    description: "Production NextGen collections read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_ENV,
    specs: ["tests/collections/nextgen-collections-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:admin-guards-readonly",
    description: "Production admin fail-closed guard canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_READONLY_ENV,
    specs: ["tests/admin/admin-destructive-guards-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:public-content-readonly",
    description: "Production public content read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_READONLY_ENV,
    specs: ["tests/content/public-content-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:profile-deep-links-readonly",
    description: "Production profile deep links read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_READONLY_ENV,
    specs: ["tests/social/profile-deep-links-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:search-waves-readonly",
    description: "Production wave search read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_READONLY_ENV,
    specs: ["tests/social/search-waves-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:media-readonly",
    description: "Production media/mint detail read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_ENV,
    specs: ["tests/media/media-mint-detail-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:network-open-data-readonly",
    description: "Production network open data read-only canary.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    env: PRODUCTION_ENV,
    specs: ["tests/network-open-data/network-open-data-api-readonly.spec.ts"],
    projects: [DESKTOP],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:production:readonly",
    description: "Combined production read-only pass in one invocation.",
    safety: "readonly",
    environments: ["production"],
    triggers: ["manual"],
    env: PRODUCTION_READONLY_ENV,
    specs: [
      "tests/social/waves-profile-readonly.spec.ts",
      "tests/media/media-mint-detail-readonly.spec.ts",
      "tests/delegation/delegation-readonly.spec.ts",
      "tests/network-open-data/network-open-data-api-readonly.spec.ts",
      "tests/collections/nextgen-collections-readonly.spec.ts",
      "tests/public-groups-tools/public-groups-tools-readonly.spec.ts",
      "tests/admin/admin-destructive-guards-readonly.spec.ts",
      "tests/content/public-content-readonly.spec.ts",
      "tests/social/profile-deep-links-readonly.spec.ts",
      "tests/social/search-waves-readonly.spec.ts",
    ],
    projects: [DESKTOP],
    workers: 1,
  },
];

module.exports = { PACKS };
