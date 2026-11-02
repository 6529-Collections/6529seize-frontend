/**
 * @jest-environment node
 */

import * as route from "@/app/.well-known/apple-app-site-association/route";
import { publicEnv } from "@/config/env";
import { isMobileAppDestination } from "@/helpers/mobileAppLinks";

jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://6529.io" },
}));

interface Component {
  readonly "/": string;
  readonly exclude?: boolean;
  readonly caseSensitive?: boolean;
}

interface Association {
  readonly applinks: {
    readonly details: ReadonlyArray<{
      readonly appIDs: readonly string[];
      readonly components: readonly Component[];
    }>;
  };
}

const escapeRegExp = (value: string) =>
  value.replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`);

// Apple's documented matching: components are tried in order and the first
// match wins; `*` matches zero or more characters and `?` exactly one.
function matches(component: Component, pathname: string): boolean {
  const source = escapeRegExp(component["/"])
    .replaceAll("*", ".*")
    .replaceAll("?", ".");
  const flags = component.caseSensitive === false ? "iu" : "u";
  return new RegExp(`^${source}$`, flags).test(pathname);
}

async function readAssociation(): Promise<Association> {
  return (await route.GET().json()) as Association;
}

async function opensInApp(pathname: string): Promise<boolean> {
  const { components } = (await readAssociation()).applinks.details[0]!;
  const match = components.find((component) => matches(component, pathname));
  return match !== undefined && match.exclude !== true;
}

const APP_PAGES = [
  "/",
  "/waves",
  "/waves/0d3c7a2b-5e1f-4a8e-9d1a-2b3c4d5e6f70",
  "/messages",
  "/notifications",
  "/the-memes/548",
  "/meme-lab/12",
  "/nextgen/collection/pebbles",
  "/punk6529",
  "/punk6529.eth",
  "/punk6529/collected",
  "/museum/network",
  "/network/nerd",
  "/author/nft6529",
  "/apiary",
  "/accessible",
];

const BROWSER_PAGES = [
  "/api",
  "/api/version",
  "/access",
  "/restricted",
  "/open-mobile",
  "/accept-connection-sharing",
  "/app-wallets",
  "/tools/app-wallets/import-wallet",
  "/auth/callback",
];

const BROWSER_FILES = [
  "/_next/static/chunks/main.js",
  "/.well-known/apple-app-site-association",
  "/6529.png",
  "/6529.PNG",
  "/favicon.ico",
  "/robots.txt",
  "/llms.txt",
  "/sitemap.xml",
  "/primary_address.csv",
  "/help-index.json",
  "/review-data/6529-stream/index.json",
  "/delegation-content/delegation-docs-2026-10-15/html/index.html",
];

describe("apple-app-site-association route", () => {
  beforeEach(() => {
    publicEnv.BASE_ENDPOINT = "https://6529.io";
  });

  it("is prerendered as JSON for the iOS app only", async () => {
    expect(route.dynamic).toBe("force-static");

    const response = route.GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");

    const association = (await response.json()) as Record<string, unknown>;
    expect(Object.keys(association)).toEqual(["applinks"]);
    const { details } = (association as unknown as Association).applinks;
    expect(details).toHaveLength(1);
    expect(details[0]!.appIDs).toEqual(["4962266Y3D.com.core6529.app"]);
  });

  it.each([
    ["https://6529.io", "4962266Y3D.com.core6529.app"],
    ["https://www.6529.io", "4962266Y3D.com.core6529.app"],
    ["https://staging.6529.io", "4962266Y3D.com.core6529staging.app"],
    ["https://STAGING.6529.IO/", "4962266Y3D.com.core6529staging.app"],
    ["https://prxtstaging.6529.io", "4962266Y3D.com.core6529.app"],
    ["https://staging.6529.io.example.com", "4962266Y3D.com.core6529.app"],
    ["http://localhost:3001", "4962266Y3D.com.core6529.app"],
  ])(
    "associates the configured deployment %s with %s",
    async (endpoint, appId) => {
      publicEnv.BASE_ENDPOINT = endpoint;

      const { details } = (await readAssociation()).applinks;
      expect(details).toHaveLength(1);
      expect(details[0]!.appIDs).toEqual([appId]);
    }
  );

  it("preserves route exclusions and cache headers on staging", async () => {
    const production = await readAssociation();
    publicEnv.BASE_ENDPOINT = "https://staging.6529.io";

    const response = route.GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    const staging = (await response.json()) as Association;
    expect(staging.applinks.details[0]!.components).toEqual(
      production.applinks.details[0]!.components
    );
  });

  it("puts every exclusion before the catch-all", async () => {
    const { components } = (await readAssociation()).applinks.details[0]!;
    expect(components.at(-1)).toMatchObject({ "/": "/*" });
    expect(components.at(-1)).not.toHaveProperty("exclude");
    expect(
      components.slice(0, -1).every((component) => component.exclude)
    ).toBe(true);
  });

  it.each(APP_PAGES)("opens %s in the app", async (pathname) => {
    await expect(opensInApp(pathname)).resolves.toBe(true);
  });

  it.each([...BROWSER_PAGES, ...BROWSER_FILES])(
    "keeps %s in the browser",
    async (pathname) => {
      await expect(opensInApp(pathname)).resolves.toBe(false);
    }
  );

  it.each([...APP_PAGES, ...BROWSER_PAGES])(
    "agrees with the Open in app link rules for %s",
    async (pathname) => {
      await expect(opensInApp(pathname)).resolves.toBe(
        isMobileAppDestination(pathname)
      );
    }
  );
});
