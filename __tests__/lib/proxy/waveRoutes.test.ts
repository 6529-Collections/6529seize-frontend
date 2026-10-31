/**
 * @jest-environment node
 */

import fs from "node:fs";
import path from "node:path";
import {
  hasMalformedWaveId,
  MALFORMED_WAVE_ROUTE,
} from "@/lib/proxy/waveRoutes";

const APP_DIR = path.join(process.cwd(), "app");
const WAVE_ID = "5f207393-5418-4a75-8738-e40edb44a94d";

function malformed(pathname: string, search = ""): boolean {
  return hasMalformedWaveId(pathname, new URLSearchParams(search));
}

function childDirectories(...segments: string[]): string[] {
  return fs
    .readdirSync(path.join(APP_DIR, ...segments), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));
}

describe("hasMalformedWaveId", () => {
  describe("thread routes", () => {
    it.each([
      "/waves/not-a-real-id",
      "/waves/123",
      "/waves/private-wave",
      "/waves/Create",
      "/waves/5f207393-5418-4a75-8738-e40edb44a94",
      "/waves/5f207393-5418-4a75-8738-e40edb44a94de",
      "/waves/5f207393541844a758738e40edb44a94d",
      "/waves/5f207393-5418-4a75-8738-e40edb44a94g",
      `/waves/${WAVE_ID}%2F`,
      `/waves/${WAVE_ID}%20`,
      `/waves/${WAVE_ID}%0A`,
      "/waves/%E0%A4%A",
      "/messages/not-a-real-id",
      "/messages/123",
      `/messages/${WAVE_ID}%2F`,
    ])("answers %s", (pathname) => {
      expect(malformed(pathname)).toBe(true);
    });

    it.each([
      `/waves/${WAVE_ID}`,
      `/waves/${WAVE_ID.toUpperCase()}`,
      "/waves/5F207393-5418-4a75-8738-E40EDB44A94D",
      "/waves/00000000-0000-4000-8000-000000000529",
      // Percent-encoded characters decode before the check, like route params.
      "/waves/%35f207393-5418-4a75-8738-e40edb44a94d",
      `/messages/${WAVE_ID}`,
      `/messages/${WAVE_ID.toUpperCase()}`,
    ])("leaves %s to the app", (pathname) => {
      expect(malformed(pathname)).toBe(false);
    });

    it.each(["/waves/create", "/messages/create"])(
      "leaves the static route %s to the app",
      (pathname) => {
        expect(malformed(pathname)).toBe(false);
      }
    );

    it("does not judge drop deep-link params on a valid wave", () => {
      expect(malformed(`/waves/${WAVE_ID}`, "drop=anything")).toBe(false);
      expect(malformed(`/waves/${WAVE_ID}`, "serialNo=abc&divider=x")).toBe(
        false
      );
      expect(malformed(`/messages/${WAVE_ID}`, "drop=not-a-uuid")).toBe(false);
    });

    it("still answers a malformed wave whatever its drop deep link says", () => {
      expect(malformed("/waves/not-a-real-id", `drop=${WAVE_ID}`)).toBe(true);
      expect(malformed("/messages/not-a-real-id", "serialNo=12")).toBe(true);
    });
  });

  describe("competition routes", () => {
    it.each([
      "/waves/not-a-real-id/competitions",
      "/waves/not-a-real-id/competitions/new",
      "/waves/not-a-real-id/competitions/alpha",
      // `create` is only exempt on the thread route itself.
      "/waves/create/competitions",
      "/waves/create/competitions/alpha",
      `/waves/${WAVE_ID}%2F/competitions`,
    ])("answers %s", (pathname) => {
      expect(malformed(pathname)).toBe(true);
    });

    it.each([
      `/waves/${WAVE_ID}/competitions`,
      `/waves/${WAVE_ID}/competitions/new`,
      `/waves/${WAVE_ID}/competitions/${WAVE_ID}`,
      // Competition ids are resolved client-side and opaque to proxy: the
      // E2E sandbox serves ids such as `alpha`.
      `/waves/${WAVE_ID}/competitions/alpha`,
    ])("leaves %s to the app", (pathname) => {
      expect(malformed(pathname)).toBe(false);
    });
  });

  describe("legacy ?wave= links", () => {
    it.each([
      ["/waves", "wave=not-a-real-id"],
      ["/waves", "wave=123&serialNo=4"],
      ["/waves", "wave=%20"],
      ["/waves", `wave=${WAVE_ID}%2F`],
      ["/waves", `wave=not-a-real-id&wave=${WAVE_ID}`],
      ["/messages", "wave=not-a-real-id"],
      ["/messages", "wave=%E0%A4%A"],
    ])("answers %s?%s", (pathname, search) => {
      expect(malformed(pathname, search)).toBe(true);
    });

    it.each([
      ["/waves", ""],
      ["/waves", "wave="],
      ["/waves", "tab=chat"],
      ["/waves", `wave=${WAVE_ID}`],
      ["/waves", `wave=${WAVE_ID}&serialNo=4&divider=1`],
      ["/waves", `wave=${WAVE_ID}&wave=not-a-real-id`],
      ["/waves", "drop=not-a-uuid"],
      ["/messages", ""],
      ["/messages", `wave=${WAVE_ID}`],
      ["/messages", "create=dm"],
    ])("leaves %s?%s to the app", (pathname, search) => {
      expect(malformed(pathname, search)).toBe(false);
    });
  });

  describe("other routes", () => {
    it.each([
      ["/", ""],
      ["/the-memes/1", ""],
      ["/punk6529", "wave=not-a-real-id"],
      ["/network/wave-score", "wave=not-a-real-id"],
      // Redirected by proxy itself, so the destination answers.
      ["/my-stream", "wave=not-a-real-id"],
      ["/api/waves/not-a-real-id", ""],
      ["/api/og-metadata/waves/not-a-real-id", ""],
      ["/waves/not-a-real-id/members", ""],
      ["/messages/not-a-real-id/extra", ""],
      ["/waves//competitions", ""],
      ["/waves//not-a-real-id", ""],
      ["/wavesx/not-a-real-id", ""],
      ["/messagesx/not-a-real-id", ""],
      ["/waves/create/extra", ""],
    ])("ignores %s?%s", (pathname, search) => {
      expect(malformed(pathname, search)).toBe(false);
    });
  });
});

// The patterns above spell out the route shapes under `[wave]`. A route added
// beside or below them would be answered as a malformed wave id (a new static
// sibling) or skip the check entirely (a new nested shape) until the policy in
// lib/proxy/waveRoutes.ts is updated to match.
describe("wave route tree", () => {
  it("has `create` as the only static sibling of [wave]", () => {
    expect(childDirectories("waves")).toEqual(["[wave]", "create"]);
    expect(childDirectories("messages")).toEqual([
      "[wave]",
      "create",
      "encrypted",
    ]);
  });

  it("has only the routes the wave-id policy knows below [wave]", () => {
    expect(childDirectories("waves", "[wave]")).toEqual(["competitions"]);
    expect(childDirectories("waves", "[wave]", "competitions")).toEqual([
      "[competition]",
    ]);
    expect(
      childDirectories("waves", "[wave]", "competitions", "[competition]")
    ).toEqual([]);
    expect(childDirectories("messages", "[wave]")).toEqual([]);
  });

  it("never answers the static create routes", () => {
    for (const family of ["waves", "messages"]) {
      expect(malformed(`/${family}/create`)).toBe(false);
    }
  });
});

// Proxy rewrites malformed wave links to this route so the branded not-found
// page renders with a real 404. A `loading.tsx` or layout `Suspense` above its
// page would stream a shell first and commit a 200, so none may sit there.
describe("malformed wave route", () => {
  const routeDirectory = path.join(
    APP_DIR,
    ...MALFORMED_WAVE_ROUTE.split("/").filter(Boolean)
  );

  function streamingBoundaries(): string[] {
    const boundaries: string[] = [];
    for (const directory of [APP_DIR, routeDirectory]) {
      if (fs.existsSync(path.join(directory, "loading.tsx"))) {
        boundaries.push(path.join(directory, "loading.tsx"));
      }
      for (const file of ["layout.tsx", "template.tsx"]) {
        const filePath = path.join(directory, file);
        if (
          fs.existsSync(filePath) &&
          /<Suspense[\s>]/u.test(fs.readFileSync(filePath, "utf8"))
        ) {
          boundaries.push(filePath);
        }
      }
    }
    return boundaries;
  }

  it("has a page that calls notFound()", () => {
    const page = fs.readFileSync(path.join(routeDirectory, "page.tsx"), "utf8");
    expect(page).toMatch(/\bnotFound\(\)/u);
  });

  it("has no streaming boundary above its page", () => {
    expect(streamingBoundaries()).toEqual([]);
  });

  it("is never itself answered as a malformed wave id", () => {
    expect(malformed(MALFORMED_WAVE_ROUTE)).toBe(false);
    expect(malformed(MALFORMED_WAVE_ROUTE, "wave=not-a-real-id")).toBe(false);
  });

  it("cannot shadow a profile handle", () => {
    const segment = MALFORMED_WAVE_ROUTE.slice(1);
    expect(segment).not.toMatch(/^\w{3,15}$/);
  });
});
