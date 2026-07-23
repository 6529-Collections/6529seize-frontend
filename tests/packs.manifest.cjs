// E2E pack manifest: the source of truth for Playwright package scripts,
// deployed-environment pack selection, and generated pack documentation.
//
// Keep this file dependency-free so Node can load it in local tooling and CI
// without a build step or experimental runtime flags. After editing it, run:
//
//   seize run e2e-manifest:sync
//
// Array order is the execution order for manifest-resolved pack groups.

const DESKTOP = "web-desktop-chromium";
const MOBILE = "web-mobile-chromium";
const SIMULATION_PROJECTS = [
  "capacitor-ios-sim",
  "capacitor-android-sim",
  "electron-shell-sim",
];
const SMOKE_SPECS = [
  "tests/home/home.spec.ts",
  "tests/pages/about.spec.ts",
  "tests/pages/the-memes.spec.ts",
];

const STAGING_READONLY_ENV = {
  PLAYWRIGHT_BASE_URL: "https://staging.6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
  PLAYWRIGHT_ENV: "staging",
  PLAYWRIGHT_READONLY: "1",
};

const PRODUCTION_READONLY_ENV = {
  PLAYWRIGHT_BASE_URL: "https://6529.io",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
  PLAYWRIGHT_ENV: "production",
  PLAYWRIGHT_READONLY: "1",
};

const COMPOSER_SANDBOX_ENV = {
  PLAYWRIGHT_ENV: "local",
  PLAYWRIGHT_COMPOSER_SANDBOX: "1",
  PLAYWRIGHT_FORCE_WEB_SERVER: "1",
  USE_DEV_AUTH: "true",
  DEV_MODE_WALLET_ADDRESS: "0x0000000000000000000000000000000000000529",
  PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE: "playwright",
  PLAYWRIGHT_WEB_SERVER_COMMAND: "node tests/support/composerSandboxServer.cjs",
};

const AUTH_SANDBOX_ENV = {
  PLAYWRIGHT_ENV: "local",
  PLAYWRIGHT_AUTH_SANDBOX: "1",
  ...COMPOSER_SANDBOX_ENV,
};

const READONLY_SPECS = {
  social: ["tests/social/waves-profile-readonly.spec.ts"],
  inputDetection: ["tests/input/win8-touch-latch-readonly.spec.ts"],
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
};

function localPack(scriptKey, description, specs, tweaks = {}) {
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
    timeoutMinutes: tweaks.timeoutMinutes ?? 15,
  };
}

function localReadonlyPack(scriptKey, description, specs, tweaks = {}) {
  return {
    ...localPack(scriptKey, description, specs, tweaks),
    safety: "readonly",
    env: {
      PLAYWRIGHT_READONLY: "1",
      ...tweaks.env,
    },
  };
}

function sandboxPack(scriptKey, description, specs, env, projects = [DESKTOP]) {
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
    timeoutMinutes: 15,
  };
}

function stagingPack(alias, suffix, description, specs, tweaks = {}) {
  return {
    scriptKey: `test:e2e:staging${suffix ? `:${suffix}` : ""}`,
    alias,
    description,
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: STAGING_READONLY_ENV,
    specs,
    ...tweaks,
    projects: tweaks.projects ?? [DESKTOP, MOBILE],
    workers: 1,
    timeoutMinutes: tweaks.timeoutMinutes ?? 15,
  };
}

function productionPack(
  suffix,
  description,
  specs,
  triggers = ["cron", "manual"],
  timeoutMinutes = 15
) {
  return {
    scriptKey: `test:e2e:production:${suffix}`,
    alias: suffix,
    description,
    safety: "readonly",
    environments: ["production"],
    triggers,
    env: PRODUCTION_READONLY_ENV,
    specs,
    projects: [DESKTOP],
    workers: 1,
    timeoutMinutes,
  };
}

const PACKS = [
  {
    scriptKey: "test:e2e",
    description: "Full local suite on the desktop web shell.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    projects: [DESKTOP],
    timeoutMinutes: 60,
  },
  {
    scriptKey: "test:e2e:all-projects",
    description: "Full local suite across every configured project.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    timeoutMinutes: 90,
  },
  {
    scriptKey: "test:e2e:ui",
    description: "Playwright UI mode for local debugging.",
    safety: "local",
    environments: ["local"],
    triggers: ["manual"],
    extraArgs: ["--ui"],
    timeoutMinutes: 90,
  },

  {
    ...localPack(
      "test:e2e:smoke",
      "Fast @smoke subset of home, about, and The Memes.",
      SMOKE_SPECS,
      { grep: "@smoke", projects: [DESKTOP] }
    ),
    triggers: ["pr-ci", "manual"],
  },
  {
    ...localPack(
      "test:e2e:critical-shell",
      "Boot and guarded route-shell resilience pack.",
      ["tests/critical-shell"],
      { projects: [DESKTOP] }
    ),
    triggers: ["pr-ci", "manual"],
  },

  localReadonlyPack(
    "test:e2e:social-readonly",
    "Waves and profile read-only journeys.",
    READONLY_SPECS.social
  ),
  localReadonlyPack(
    "test:e2e:input-detection-readonly",
    "Windows touch-input detection read-only contract.",
    READONLY_SPECS.inputDetection,
    { projects: [DESKTOP] }
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
    "Network and open-data read-only coverage.",
    READONLY_SPECS.networkOpenData
  ),
  localReadonlyPack(
    "test:e2e:collections-readonly",
    "NextGen and collection read-only coverage.",
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
    READONLY_SPECS.adminGuards
  ),
  localReadonlyPack(
    "test:e2e:public-content-readonly",
    "Public content pages read-only coverage.",
    READONLY_SPECS.publicContent
  ),
  localReadonlyPack(
    "test:e2e:authenticated-shells-readonly",
    "Authenticated route shells with read-only dev auth.",
    ["tests/auth/authenticated-shells-readonly.spec.ts"],
    { traceOff: true }
  ),
  localReadonlyPack(
    "test:e2e:notifications-mutation-guard",
    "Negative contract: notifications must not mutate.",
    ["tests/auth/notifications-mutation-guard.spec.ts"],
    { projects: [DESKTOP], traceOff: true }
  ),
  localReadonlyPack(
    "test:e2e:profile-deep-links-readonly",
    "Profile deep-link redirect coverage.",
    READONLY_SPECS.profileDeepLinks
  ),
  localReadonlyPack(
    "test:e2e:search-waves-readonly",
    "Global and wave-local search coverage.",
    READONLY_SPECS.searchWaves
  ),

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
    "Signed participation sandbox that fails closed unsigned.",
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
    "Engine-diversity pass on Firefox and WebKit.",
    [
      "tests/surfaces",
      "tests/home/home.spec.ts",
      "tests/pages/the-memes.spec.ts",
    ],
    { projects: ["web-desktop-firefox", "web-desktop-webkit"] }
  ),
  localPack(
    "test:e2e:native-sim",
    "Capacitor and Electron browser-simulation surface pass.",
    [
      "tests/surfaces/core-surfaces.spec.ts",
      "tests/surfaces/native-shell-readonly.spec.ts",
    ],
    { projects: SIMULATION_PROJECTS }
  ),
  localReadonlyPack(
    "test:e2e:native-shell-readonly",
    "Native-shell browser-simulation read-only contracts.",
    ["tests/surfaces/native-shell-readonly.spec.ts"],
    { projects: SIMULATION_PROJECTS }
  ),
  localPack(
    "test:e2e:wcag-i18n",
    "WCAG and i18n public-route evidence pack.",
    ["tests/wcag-i18n"],
    { projects: [DESKTOP] }
  ),
  localPack(
    "test:e2e:wcag-i18n:surface-matrix",
    "WCAG and i18n evidence on desktop and mobile web.",
    ["tests/wcag-i18n"]
  ),

  stagingPack(
    "smoke",
    "smoke",
    "Staging @smoke subset on both web shells.",
    SMOKE_SPECS,
    { grep: "@smoke" }
  ),
  stagingPack("core", "", "Staging core surfaces on both web shells.", [
    "tests/surfaces",
    ...SMOKE_SPECS,
  ]),
  stagingPack(
    "social-readonly",
    "social-readonly",
    "Staging waves and profile read-only pack.",
    READONLY_SPECS.social
  ),
  stagingPack(
    "input-detection-readonly",
    "input-detection-readonly",
    "Staging Windows touch-input detection contract.",
    READONLY_SPECS.inputDetection,
    { projects: [DESKTOP] }
  ),
  stagingPack(
    "public-groups-tools-readonly",
    "public-groups-tools-readonly",
    "Staging public groups and tools read-only pack.",
    READONLY_SPECS.publicGroupsTools
  ),
  stagingPack(
    "delegation-readonly",
    "delegation-readonly",
    "Staging delegation read-only pack.",
    READONLY_SPECS.delegation
  ),
  stagingPack(
    "collections-readonly",
    "collections-readonly",
    "Staging collection read-only pack.",
    READONLY_SPECS.collections
  ),
  stagingPack(
    "admin-guards-readonly",
    "admin-guards-readonly",
    "Staging admin fail-closed guard pack.",
    READONLY_SPECS.adminGuards
  ),
  stagingPack(
    "public-content-readonly",
    "public-content-readonly",
    "Staging public-content read-only pack.",
    READONLY_SPECS.publicContent
  ),
  stagingPack(
    "profile-deep-links-readonly",
    "profile-deep-links-readonly",
    "Staging profile deep-link pack.",
    READONLY_SPECS.profileDeepLinks
  ),
  stagingPack(
    "search-waves-readonly",
    "search-waves-readonly",
    "Staging search pack.",
    READONLY_SPECS.searchWaves
  ),
  stagingPack(
    "media-readonly",
    "media-readonly",
    "Staging media and mint detail read-only pack.",
    READONLY_SPECS.media
  ),
  stagingPack(
    "network-open-data-readonly",
    "network-open-data-readonly",
    "Staging network and open-data read-only pack.",
    READONLY_SPECS.networkOpenData
  ),

  productionPack(
    "social-readonly",
    "Production waves and profile read-only canary.",
    READONLY_SPECS.social
  ),
  productionPack(
    "media-readonly",
    "Production media and mint detail read-only canary.",
    READONLY_SPECS.media
  ),
  productionPack(
    "delegation-readonly",
    "Production delegation read-only canary.",
    READONLY_SPECS.delegation
  ),
  productionPack(
    "network-open-data-readonly",
    "Production network and open-data read-only canary.",
    READONLY_SPECS.networkOpenData
  ),
  productionPack(
    "collections-readonly",
    "Production collection read-only canary.",
    READONLY_SPECS.collections
  ),
  productionPack(
    "public-groups-tools-readonly",
    "Production public groups and tools read-only canary.",
    READONLY_SPECS.publicGroupsTools
  ),
  productionPack(
    "admin-guards-readonly",
    "Production admin fail-closed guard canary.",
    READONLY_SPECS.adminGuards
  ),
  productionPack(
    "public-content-readonly",
    "Production public-content read-only canary.",
    READONLY_SPECS.publicContent
  ),
  productionPack(
    "profile-deep-links-readonly",
    "Production profile deep-link canary.",
    READONLY_SPECS.profileDeepLinks
  ),
  productionPack(
    "search-waves-readonly",
    "Production search canary.",
    READONLY_SPECS.searchWaves
  ),
  productionPack(
    "readonly",
    "Combined production-safe release validation.",
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
    ["post-deploy", "manual"],
    60
  ),
];

module.exports = { PACKS };
