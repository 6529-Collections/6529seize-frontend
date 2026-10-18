jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { createSolidityReferenceReader } from "@/lib/public-review/solidityReferenceData";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";
import { STREAM_SOLIDITY_REFERENCE_IDENTITY } from "@/lib/public-review/streamSolidityReferenceIdentity.server";

const FIXTURE_ROOT =
  process.env["PUBLIC_REVIEW_SOLIDITY_FIXTURE_ROOT"] ??
  path.resolve(process.cwd(), "public");
const INDEX_RELATIVE = path.join(
  "review-data",
  STREAM_REVIEW_SLUG,
  "index.json"
);
const hasFixture = existsSync(path.join(FIXTURE_ROOT, INDEX_RELATIVE));
if (!hasFixture && process.env["CI"]) {
  throw new Error(
    "Missing Solidity reference fixture for the remote file tests"
  );
}
const describeFixture = hasFixture ? describe : describe.skip;
const IDENTITY = STREAM_SOLIDITY_REFERENCE_IDENTITY;
const SITE = "https://6529.io";

/** A public folder holding only the review index, as the desktop app ships. */
function indexOnlyRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "review-index-only-"));
  mkdirSync(path.join(root, "review-data", STREAM_REVIEW_SLUG), {
    recursive: true,
  });
  copyFileSync(
    path.join(FIXTURE_ROOT, INDEX_RELATIVE),
    path.join(root, INDEX_RELATIVE)
  );
  return root;
}

/** The parts of a fetch Response the reader uses. */
function fakeResponse(status: number, body?: Buffer) {
  return {
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: async () => {
      const bytes = body ?? Buffer.alloc(0);
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      );
    },
  };
}

/** Serves the fixture's files as the site would; `tamper` corrupts one path. */
function siteFetch(tamper?: string) {
  return jest.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    if (url.origin !== SITE) {
      return fakeResponse(404);
    }
    const file = path.join(
      FIXTURE_ROOT,
      ...url.pathname.split("/").filter(Boolean)
    );
    if (!existsSync(file)) {
      return fakeResponse(404);
    }
    let body = readFileSync(file);
    if (tamper && url.pathname === tamper) {
      const value = JSON.parse(body.toString("utf8")) as Record<
        string,
        unknown
      >;
      body = Buffer.from(JSON.stringify({ ...value, tampered: true }));
    }
    return fakeResponse(200, body);
  });
}

describeFixture(
  "Solidity reference files missing from the public folder",
  () => {
    const originalFetch = global.fetch;
    let root: string;

    beforeEach(() => {
      root = indexOnlyRoot();
    });

    afterEach(() => {
      global.fetch = originalFetch;
      rmSync(root, { recursive: true, force: true });
      delete process.env["DESKTOP_RENDERER_DIR"];
    });

    it("loads a version that is not on disk from the site, checksums intact", async () => {
      const fetchMock = siteFetch();
      global.fetch = fetchMock as unknown as typeof fetch;
      const reader = createSolidityReferenceReader({
        identity: IDENTITY,
        publicRoot: root,
        remoteOrigin: SITE,
      });

      const { manifest, versionEntry } = await reader.loadManifest(
        IDENTITY.activeVersion
      );

      expect(manifest.definitionIndex.length).toBeGreaterThan(0);
      expect(fetchMock).toHaveBeenCalledWith(
        new URL(versionEntry.bundlePath, SITE),
        expect.anything()
      );
    });

    it("rejects a file from the site whose checksum does not match", async () => {
      const reader = createSolidityReferenceReader({
        identity: IDENTITY,
        publicRoot: root,
        remoteOrigin: SITE,
      });
      const { versions } = await reader.loadIndex();
      const entry = versions.find(
        ({ version }) => version === IDENTITY.activeVersion
      );
      expect(entry).toBeDefined();
      global.fetch = siteFetch(entry?.bundlePath) as unknown as typeof fetch;

      await expect(reader.loadManifest(IDENTITY.activeVersion)).rejects.toThrow(
        /checksum/i
      );
    });

    it("keeps a missing file an error when no site is configured", async () => {
      const fetchMock = siteFetch();
      global.fetch = fetchMock as unknown as typeof fetch;
      const reader = createSolidityReferenceReader({
        identity: IDENTITY,
        publicRoot: root,
      });

      await expect(
        reader.loadManifest(IDENTITY.activeVersion)
      ).rejects.toMatchObject({ code: "ENOENT" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("reports a file the site does not have", async () => {
      global.fetch = jest.fn(async () =>
        fakeResponse(404)
      ) as unknown as typeof fetch;
      const reader = createSolidityReferenceReader({
        identity: IDENTITY,
        publicRoot: root,
        remoteOrigin: SITE,
      });

      await expect(reader.loadManifest(IDENTITY.activeVersion)).rejects.toThrow(
        /HTTP 404/
      );
    });

    it("reads from the frontend folder the desktop app names", async () => {
      const frontend = mkdtempSync(path.join(os.tmpdir(), "frontend-root-"));
      try {
        mkdirSync(
          path.join(frontend, "public", "review-data", STREAM_REVIEW_SLUG),
          { recursive: true }
        );
        copyFileSync(
          path.join(FIXTURE_ROOT, INDEX_RELATIVE),
          path.join(frontend, "public", INDEX_RELATIVE)
        );
        process.env["DESKTOP_RENDERER_DIR"] = frontend;
        const reader = createSolidityReferenceReader({ identity: IDENTITY });

        const index = await reader.loadIndex();

        expect(index.versions.length).toBeGreaterThan(0);
      } finally {
        rmSync(frontend, { recursive: true, force: true });
      }
    });
  }
);
