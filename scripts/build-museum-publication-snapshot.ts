import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import pRetry from "p-retry";

import {
  createMuseumPublicationBuildSnapshot,
  MUSEUM_PUBLICATION_BUILD_SNAPSHOT_PATH,
} from "../lib/museum/publication/buildSnapshot.server";
import { museumPublicationCatalogResolver } from "../lib/museum/publication/catalog";
import { GitHubMuseumPublicationSource } from "../lib/museum/publication/github";
import { legacyCaseyPublicationAssembler } from "../lib/museum/publication/legacyCasey";

const BUILD_SNAPSHOT_RETRIES = 2;
const BUILD_SNAPSHOT_RETRY_DELAY_MS = 1_000;

async function main(): Promise<void> {
  const source = new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    catalogResolver: museumPublicationCatalogResolver,
  });
  const state = await pRetry(
    async () => {
      const candidate = await source.load();
      if (candidate.status !== "current") {
        throw new Error(
          candidate.errorCode ?? "publication_build_snapshot_unavailable"
        );
      }
      return candidate;
    },
    {
      retries: BUILD_SNAPSHOT_RETRIES,
      minTimeout: BUILD_SNAPSHOT_RETRY_DELAY_MS,
      factor: 2,
      randomize: true,
    }
  );

  const snapshot = createMuseumPublicationBuildSnapshot(state.publication);
  const outputPath = path.resolve(
    process.cwd(),
    MUSEUM_PUBLICATION_BUILD_SNAPSHOT_PATH
  );
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(snapshot)}\n`, "utf8");
  await rename(temporaryPath, outputPath);

  process.stdout.write(
    `${JSON.stringify({
      contract: snapshot.contract,
      generatedAt: snapshot.generatedAt,
      publicationCommit: snapshot.publication.identity.commit,
      catalogId: snapshot.publication.identity.catalogId ?? null,
      inventoryCount: snapshot.publication.identity.inventoryCount,
    })}\n`
  );
}

void main().catch((error: unknown) => {
  const errorCode =
    error instanceof Error && error.message.length > 0
      ? error.message
      : "publication_build_snapshot_failed";
  process.stderr.write(`${errorCode}\n`);
  process.exitCode = 1;
});
