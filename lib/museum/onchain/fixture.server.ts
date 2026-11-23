import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CidFetcher } from "./ipfs";
import {
  fixtureCidFetcher,
  fixtureRegistrySnapshot,
  type ProfileFixture,
} from "./fixture";
import type { RegistrySnapshot } from "./registry";

/**
 * Reads a fixture directory: `records.json` (the release's record list) and
 * each record's payload under `payloads/<local_id>.json`, as exact bytes.
 */
export async function loadFixtureSource(
  root: string,
  fallback: CidFetcher
): Promise<{ registry: RegistrySnapshot; fetchCid: CidFetcher }> {
  const fixture = JSON.parse(
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- the fixture root is set by the Playwright run, not by a request.
    await readFile(path.join(root, "records.json"), "utf8")
  ) as ProfileFixture;
  const payloads = new Map<string, Uint8Array>();
  await Promise.all(
    fixture.records.map(async (record) => {
      const file = path.join(
        root,
        "payloads",
        `${path.basename(record.local_id)}.json`
      );
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- confined to the fixture root's payloads directory.
      const bytes = await readFile(file);
      payloads.set(record.rawCid.toLowerCase(), new Uint8Array(bytes));
    })
  );
  return {
    registry: fixtureRegistrySnapshot(fixture),
    fetchCid: fixtureCidFetcher(payloads, fallback),
  };
}
