import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// E2E selector lint — a dedicated, single-purpose flat config.
//
// The main eslint.config.mjs globally ignores tests/** (E2E specs are not
// part of the app lint surface), and a global ignore cannot be re-included
// by a per-block `files` entry in the same config. This standalone config
// exists so exactly one rule applies to Playwright specs without unleashing
// the full app rule set on them.
//
// Run via `./bin/6529 run lint:e2e-selectors` (wired into app PR CI).
//
// Policy: new spec code locates elements through the accessibility tree
// (getByRole / getByLabel / getByTestId / getByText), which keeps tests
// resilient while surfaces change and doubles as a WCAG signal. Literal
// CSS/XPath lookups on `page` are the anti-pattern this catches; scoping
// chains (e.g. container.locator(...) under an accessible query) remain
// allowed.
//
// GRANDFATHERED below lists the spec files that predate the rule; they are
// exempt until cleaned up. Ratchet direction is down: remove entries as
// files are migrated, never add new ones (new specs must comply from the
// start).

const GRANDFATHERED = [
  "tests/admin/admin-destructive-guards-readonly.spec.ts",
  "tests/auth/authenticated-shells-readonly.spec.ts",
  "tests/collections/nextgen-collections-readonly.spec.ts",
  "tests/content/public-content-readonly.spec.ts",
  "tests/critical-shell/critical-shell.spec.ts",
  "tests/delegation/delegation-readonly.spec.ts",
  "tests/media/media-mint-detail-readonly.spec.ts",
  "tests/network-open-data/network-open-data-api-readonly.spec.ts",
  "tests/pages/404.spec.ts",
  "tests/pages/6529-gradient.spec.ts",
  "tests/pages/about.spec.ts",
  "tests/pages/access.spec.ts",
  "tests/pages/buidl.spec.ts",
  "tests/pages/consolidation-mapping-tool.spec.ts",
  "tests/pages/delegation-mapping-tool.spec.ts",
  "tests/pages/dispute-resolution.spec.ts",
  "tests/pages/meme-accounting.spec.ts",
  "tests/pages/meme-gas.spec.ts",
  "tests/pages/network-activity.spec.ts",
  "tests/pages/network-tdh.spec.ts",
  "tests/pages/network.spec.ts",
  "tests/pages/nft-activity.spec.ts",
  "tests/pages/restricted.spec.ts",
  "tests/pages/the-memes.spec.ts",
  "tests/profile-cms/phase5-8-smoke.spec.ts",
  "tests/public-groups-tools/public-groups-tools-readonly.spec.ts",
  "tests/social/create-wave-sandbox.spec.ts",
  "tests/social/search-waves-readonly.spec.ts",
  "tests/social/wave-edit-drop-sandbox.spec.ts",
  "tests/social/wave-reaction-sandbox.spec.ts",
  "tests/social/waves-composer-sandbox.spec.ts",
  "tests/social/waves-profile-readonly.spec.ts",
  "tests/surfaces/core-surfaces.spec.ts",
  "tests/surfaces/native-shell-readonly.spec.ts",
  "tests/wcag-i18n/public-routes.spec.ts",
];

export default defineConfig([
  {
    files: ["tests/**/*.spec.ts"],
    ignores: GRANDFATHERED,
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='page'][callee.property.name='locator'][arguments.0.type='Literal']",
          message:
            "New spec code must locate elements through the accessibility tree: " +
            "page.getByRole() / getByLabel() / getByTestId() / getByText(). " +
            "If CSS is unavoidable, scope it under an accessible query or add a " +
            "data-testid to the component. Grandfathered legacy files are listed " +
            "in eslint.config.e2e-selectors.mjs (ratchet: remove entries, never add).",
        },
      ],
    },
  },
]);
