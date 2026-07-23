// E2E pack manifest — the single source of truth for every Playwright pack.
//
// This file is intentionally written as CommonJS-styled TypeScript (no
// `import`/`export` syntax, plain `module.exports`) so the dependency-free
// check scripts (`scripts/sync-e2e-manifest.cjs`, `scripts/e2e-packs.cjs`)
// can `require()` it on a bare CI checkout via Node's built-in TypeScript
// type stripping (Node >= 22.18). Keep it import-free and erasable-syntax
// only: interfaces, typed const literals and plain functions are fine;
// enums, namespaces and decorators are not.
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
const SIM_PROJECTS = [
  "capacitor-ios-sim",
  "capacitor-android-sim",
  "electron-shell-sim",
] as const;
const SMOKE_SPECS = [
  "tests/home/home.spec.ts",
  "tests/pages/about.spec.ts",
  "tests/pages/the-memes.spec.ts",
] as const;

const STAGING_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_BASE_URL: "https://staging.6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
};

const STAGING_READONLY_ENV: Readonly<Record<string, string>> = {
  ...STAGING_ENV,
  PLAYWRIGHT_ENV: "staging",
  PLAYWRIGHT_READONLY: "1",
};

const PRODUCTION_ENV: Readonly<Record<string, string>> = {
  PLAYWRIGHT_BASE_URL: "https://6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
};

const PRODUCTION_READONLY_ENV: Readonly<Record<string, string>> = {
  ...PRODUCTION_ENV,
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
  ...COMPOSER_SANDBOX_ENV,
};

// Factories for the recurring pack shapes. Every pack is still a plain
// PackDefinition — these only remove literal repetition (which also trips
// Sonar's token-based duplication gate by construction).

interface PackTweaks {
  readonly env?: Readonly<Record<string, string>>;
  readonly grep?: string;
  readonly projects?: readonly string[];
  readonly traceOff?: boolean;
}

function localPack(
  scriptKey: string,
  description: string,
  specs: readonly string[] | undefined,
  tweaks: PackTweaks = {}
): PackDefinition {
  return {
    scriptKey,
    description,
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    ...(specs ? { specs } : {}),
    ...tweaks,
    projects: tweaks.projects ?? [DESKTOP, MOBILE],
    workers: 1,
  };
}

function localReadonlyPack(
  scriptKey: string,
  description: string,
  specs: readonly string[],
  tweaks: PackTweaks = {}
): PackDefinition {
  return {
    ...localPack(scriptKey, description, specs, tweaks),
    safety: "readonly",
  };
}

function sandboxPack(
  scriptKey: string,
  description: string,
  specs: readonly string[],
  env: Readonly<Record<string, string>>,
  projects: readonly string[] = [DESKTOP]
): PackDefinition {
  return {
    scriptKey,
    description,
    safety: "sandbox",
    environments: ["local"],
    triggers: ["manual"],
    env,
    specs,
    projects,
    workers: 1,
    traceOff: true,
  };
}

function stagingPack(
  suffix: string,
  description: string,
  specs: readonly string[],
  tweaks: PackTweaks = {}
): PackDefinition {
  return {
    scriptKey: `test:e2e:staging${suffix ? `:${suffix}` : ""}`,
    description,
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_ENV,
    specs,
    ...tweaks,
    projects: [DESKTOP, MOBILE],
    workers: 1,
  };
}

function productionPack(
  suffix: string,
  description: string,
  specs: readonly string[],
  tweaks: PackTweaks & { readonly cron?: boolean } = {}
): PackDefinition {
  const { cron = true, ...rest } = tweaks;
  return {
    scriptKey: `test:e2e:production:${suffix}`,
    description,
    safety: "readonly",
    environments: ["production"],
    triggers: cron ? ["cron", "manual"] : ["manual"],
    env: PRODUCTION_ENV,
    specs,
    ...rest,
    projects: [DESKTOP],
    workers: 1,
  };
}

const READONLY_SPECS = {
  social: ["tests/social/waves-profile-readonly.spec.ts"],
  media: ["tests/media/media-mint-detail-readonly.spec.ts"],
  delegation: ["tests/delegation/delegation-readonly.spec.ts"],
  networkOpenData: [
    "tests/network-open-data/network-open-data-api-readonly.spec.ts",
  ],
  collections: ["tests/collections/nextgen-collections-readonly.spec.ts"],
  publicGroupsTools: [
    "tests/public-groups-tools/public-groups-tools-readonly.spec.ts",
  ],
  adminGuards: ["tests/admin/admin-destructive-guards-readonly.spec.ts"],
  publicContent: ["tests/content/public-content-readonly.spec.ts"],
  profileDeepLinks: ["tests/social/profile-deep-links-readonly.spec.ts"],
  searchWaves: ["tests/social/search-waves-readonly.spec.ts"],
} as const;

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
    ...localPack(
      "test:e2e:smoke",
      "Fast @smoke subset of home, about and The Memes.",
      SMOKE_SPECS,
      {
        grep: "@smoke",
        projects: [DESKTOP],
      }
    ),
    triggers: ["pr-ci", "manual"],
  },
  {
    ...localPack(
      "test:e2e:critical-shell",
      "Boot/shell resilience pack.",
      ["tests/critical-shell"],
      {
        projects: [DESKTOP],
      }
    ),
    triggers: ["pr-ci", "manual"],
  },

  // --- Local readonly packs (local mirrors of the deployed packs) --------
  localReadonlyPack(
    "test:e2e:social-readonly",
    "Waves and profile read-only journeys.",
    READONLY_SPECS.social
  ),
  localReadonlyPack(
    "test:e2e:media-readonly",
    "Media and mint detail read-only coverage.",
    READONLY_SPECS.media
  ),
  localReadonlyPack(
    "test:e2e:delegation-readonly",
    "Delegation surfaces read-only coverage.",
    READONLY_SPECS.delegation
  ),
  localReadonlyPack(
    "test:e2e:network-open-data-readonly",
    "Network open data API read-only coverage.",
    READONLY_SPECS.networkOpenData
  ),
  localReadonlyPack(
    "test:e2e:collections-readonly",
    "NextGen collections read-only coverage.",
    READONLY_SPECS.collections
  ),
  localReadonlyPack(
    "test:e2e:public-groups-tools-readonly",
    "Public groups and tools read-only coverage.",
    READONLY_SPECS.publicGroupsTools
  ),
  localReadonlyPack(
    "test:e2e:admin-guards-readonly",
    "Admin destructive-action fail-closed guards.",
    READONLY_SPECS.adminGuards,
    { env: { PLAYWRIGHT_READONLY: "1" } }
  ),
  localReadonlyPack(
    "test:e2e:public-content-readonly",
    "Public content pages read-only coverage.",
    READONLY_SPECS.publicContent,
    { env: { PLAYWRIGHT_READONLY: "1" } }
  ),
  localReadonlyPack(
    "test:e2e:authenticated-shells-readonly",
    "Authenticated shells, read-only, dev-auth only.",
    ["tests/auth/authenticated-shells-readonly.spec.ts"],
    { env: { PLAYWRIGHT_READONLY: "1" }, traceOff: true }
  ),
  localReadonlyPack(
    "test:e2e:notifications-mutation-guard",
    "Negative contract: /notifications must not mutate.",
    ["tests/auth/notifications-mutation-guard.spec.ts"],
    { env: { PLAYWRIGHT_READONLY: "1" }, traceOff: true, projects: [DESKTOP] }
  ),
  localReadonlyPack(
    "test:e2e:profile-deep-links-readonly",
    "Profile deep links read-only coverage.",
    READONLY_SPECS.profileDeepLinks,
    { env: { PLAYWRIGHT_READONLY: "1" } }
  ),
  localReadonlyPack(
    "test:e2e:search-waves-readonly",
    "Wave search read-only coverage.",
    READONLY_SPECS.searchWaves,
    { env: { PLAYWRIGHT_READONLY: "1" } }
  ),

  // --- Local authenticated sandboxes (mock API, never a real backend) ----
  sandboxPack(
    "test:e2e:composer-sandbox",
    "Waves composer sandbox against the local mock API.",
    ["tests/social/waves-composer-sandbox.spec.ts"],
    COMPOSER_SANDBOX_ENV,
    [DESKTOP, MOBILE]
  ),
  sandboxPack(
    "test:e2e:reaction-sandbox",
    "Drop reaction sandbox against the local mock API.",
    ["tests/social/wave-reaction-sandbox.spec.ts"],
    AUTH_SANDBOX_ENV
  ),
  sandboxPack(
    "test:e2e:edit-drop-sandbox",
    "Drop edit sandbox against the local mock API.",
    ["tests/social/wave-edit-drop-sandbox.spec.ts"],
    COMPOSER_SANDBOX_ENV
  ),
  sandboxPack(
    "test:e2e:signature-sandbox",
    "Signed participation sandbox; fails closed unsigned.",
    ["tests/social/wave-signature-sandbox.spec.ts"],
    AUTH_SANDBOX_ENV
  ),
  sandboxPack(
    "test:e2e:auth-sandbox",
    "Aggregate authenticated sandbox pack.",
    [
      "tests/social/waves-composer-sandbox.spec.ts",
      "tests/social/wave-edit-drop-sandbox.spec.ts",
      "tests/social/wave-reaction-sandbox.spec.ts",
      "tests/auth/notifications-sandbox.spec.ts",
      "tests/social/direct-message-sandbox.spec.ts",
      "tests/social/create-wave-sandbox.spec.ts",
      "tests/social/wave-signature-sandbox.spec.ts",
    ],
    AUTH_SANDBOX_ENV
  ),

  // --- Local surface-matrix / engine-diversity packs ---------------------
  localPack(
    "test:e2e:smoke:surface-matrix",
    "@smoke subset on desktop and mobile web shells.",
    SMOKE_SPECS,
    { grep: "@smoke" }
  ),
  localPack(
    "test:e2e:surface-matrix",
    "Core surfaces on desktop and mobile web shells.",
    ["tests/surfaces", ...SMOKE_SPECS]
  ),
  localPack(
    "test:e2e:browser-diversity",
    "Engine diversity pass on Firefox and WebKit.",
    [
      "tests/surfaces",
      "tests/home/home.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    { projects: ["web-desktop-firefox", "web-desktop-webkit"] }
  ),
  localPack(
    "test:e2e:native-sim",
    "Capacitor/Electron simulation surface pass.",
    [
      "tests/surfaces/core-surfaces.spec.ts",
      "tests/surfaces/native-shell-readonly.spec.ts",
    ],
    { projects: SIM_PROJECTS }
  ),
  localReadonlyPack(
    "test:e2e:native-shell-readonly",
    "Native shell read-only simulation coverage.",
    ["tests/surfaces/native-shell-readonly.spec.ts"],
    { env: { PLAYWRIGHT_READONLY: "1" }, projects: SIM_PROJECTS }
  ),
  localPack(
    "test:e2e:wcag-i18n",
    "WCAG and i18n public-route evidence pack.",
    ["tests/wcag-i18n"],
    { projects: [DESKTOP] }
  ),
  localPack(
    "test:e2e:wcag-i18n:surface-matrix",
    "WCAG/i18n pack on desktop and mobile web shells.",
    ["tests/wcag-i18n"]
  ),

  // --- Staging post-deploy gate (execution order preserved) --------------
  stagingPack(
    "smoke",
    "Staging @smoke subset on both web shells.",
    SMOKE_SPECS,
    {
      grep: "@smoke",
    }
  ),
  stagingPack("", "Staging core surfaces on both web shells.", [
    "tests/surfaces",
    ...SMOKE_SPECS,
  ]),
  stagingPack(
    "social-readonly",
    "Staging waves/profile read-only pack.",
    READONLY_SPECS.social
  ),
  stagingPack(
    "public-groups-tools-readonly",
    "Staging public groups/tools read-only pack.",
    READONLY_SPECS.publicGroupsTools
  ),
  stagingPack(
    "delegation-readonly",
    "Staging delegation read-only pack.",
    READONLY_SPECS.delegation
  ),
  stagingPack(
    "collections-readonly",
    "Staging NextGen collections read-only pack.",
    READONLY_SPECS.collections
  ),
  stagingPack(
    "admin-guards-readonly",
    "Staging admin fail-closed guard pack.",
    READONLY_SPECS.adminGuards,
    { env: STAGING_READONLY_ENV }
  ),
  stagingPack(
    "public-content-readonly",
    "Staging public content read-only pack.",
    READONLY_SPECS.publicContent,
    { env: STAGING_READONLY_ENV }
  ),
  stagingPack(
    "profile-deep-links-readonly",
    "Staging profile deep links read-only pack.",
    READONLY_SPECS.profileDeepLinks,
    { env: STAGING_READONLY_ENV }
  ),
  stagingPack(
    "search-waves-readonly",
    "Staging wave search read-only pack.",
    READONLY_SPECS.searchWaves,
    { env: STAGING_READONLY_ENV }
  ),
  stagingPack(
    "media-readonly",
    "Staging media/mint detail read-only pack.",
    READONLY_SPECS.media
  ),
  stagingPack(
    "network-open-data-readonly",
    "Staging network open data read-only pack.",
    READONLY_SPECS.networkOpenData
  ),

  // --- Production canary (daily cron; desktop-only, read-only) -----------
  productionPack(
    "social-readonly",
    "Production waves/profile read-only canary.",
    READONLY_SPECS.social
  ),
  productionPack(
    "public-groups-tools-readonly",
    "Production public groups/tools read-only canary.",
    READONLY_SPECS.publicGroupsTools
  ),
  productionPack(
    "delegation-readonly",
    "Production delegation read-only canary.",
    READONLY_SPECS.delegation
  ),
  productionPack(
    "collections-readonly",
    "Production NextGen collections read-only canary.",
    READONLY_SPECS.collections
  ),
  productionPack(
    "admin-guards-readonly",
    "Production admin fail-closed guard canary.",
    READONLY_SPECS.adminGuards,
    { env: PRODUCTION_READONLY_ENV }
  ),
  productionPack(
    "public-content-readonly",
    "Production public content read-only canary.",
    READONLY_SPECS.publicContent,
    { env: PRODUCTION_READONLY_ENV }
  ),
  productionPack(
    "profile-deep-links-readonly",
    "Production profile deep links read-only canary.",
    READONLY_SPECS.profileDeepLinks,
    { env: PRODUCTION_READONLY_ENV }
  ),
  productionPack(
    "search-waves-readonly",
    "Production wave search read-only canary.",
    READONLY_SPECS.searchWaves,
    { env: PRODUCTION_READONLY_ENV }
  ),
  productionPack(
    "media-readonly",
    "Production media/mint detail read-only canary.",
    READONLY_SPECS.media
  ),
  productionPack(
    "network-open-data-readonly",
    "Production network open data read-only canary.",
    READONLY_SPECS.networkOpenData
  ),
  productionPack(
    "readonly",
    "Combined production read-only pass in one invocation.",
    [
      ...READONLY_SPECS.social,
      ...READONLY_SPECS.media,
      ...READONLY_SPECS.delegation,
      ...READONLY_SPECS.networkOpenData,
      ...READONLY_SPECS.collections,
      ...READONLY_SPECS.publicGroupsTools,
      ...READONLY_SPECS.adminGuards,
      ...READONLY_SPECS.publicContent,
      ...READONLY_SPECS.profileDeepLinks,
      ...READONLY_SPECS.searchWaves,
    ],
    { env: PRODUCTION_READONLY_ENV, cron: false }
  ),
];

module.exports = { PACKS };
