import { execFile } from "node:child_process";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import pRetry from "p-retry";

import {
  createMuseumPublicationBuildSnapshot,
  MUSEUM_PUBLICATION_BUILD_SNAPSHOT_PATH,
} from "../lib/museum/publication/buildSnapshot.server";
import { museumPublicationCatalogResolver } from "../lib/museum/publication/catalog";
import { GitHubMuseumPublicationSource } from "../lib/museum/publication/github";
import { legacyCaseyPublicationAssembler } from "../lib/museum/publication/legacyCasey";
import {
  isExactGitCommit,
  MUSEUM_REPOSITORY_NAME,
} from "../lib/museum/publication/security";

const BUILD_SNAPSHOT_RETRIES = 2;
const BUILD_SNAPSHOT_RETRY_DELAY_MS = 1_000;
const execFileAsync = promisify(execFile);
const retryOptions = {
  retries: BUILD_SNAPSHOT_RETRIES,
  minTimeout: BUILD_SNAPSHOT_RETRY_DELAY_MS,
  maxTimeout: 4_000,
  factor: 2,
  randomize: true,
};

/** Resolve Museum main through bounded Git execution and return its validated SHA. */
export async function resolveMuseumBuildCommit(): Promise<string> {
  // Resolve main without consuming the anonymous REST quota. The source still
  // verifies the catalog, manifest and document hashes at this immutable SHA.
  const { stdout } = await execFileAsync(
    "git",
    [
      "-c",
      "credential.helper=",
      "-c",
      "core.askPass=",
      "ls-remote",
      "--exit-code",
      "--refs",
      `https://github.com/${MUSEUM_REPOSITORY_NAME}.git`,
      "refs/heads/main",
    ],
    {
      encoding: "utf8",
      timeout: 30_000,
      killSignal: "SIGKILL",
      maxBuffer: 4096,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_ASKPASS: "",
        SSH_ASKPASS: "",
        GCM_INTERACTIVE: "never",
      },
    }
  );
  const [commit, ref, ...extra] = stdout.trim().split("\t");
  if (
    commit === undefined ||
    !isExactGitCommit(commit) ||
    ref !== "refs/heads/main" ||
    extra.length !== 0
  ) {
    throw new Error("publication_git_ref_invalid");
  }
  return commit;
}

/** Load a commit-pinned, verified publication and atomically replace its build snapshot. */
export async function buildMuseumPublicationSnapshot(): Promise<void> {
  const ref = await pRetry(resolveMuseumBuildCommit, retryOptions);
  const source = new GitHubMuseumPublicationSource({
    ref,
    assembler: legacyCaseyPublicationAssembler,
    catalogResolver: museumPublicationCatalogResolver,
  });
  const state = await pRetry(async () => {
    const candidate = await source.load();
    if (candidate.status !== "current") {
      throw new Error(
        candidate.errorCode ?? "publication_build_snapshot_unavailable"
      );
    }
    return candidate;
  }, retryOptions);

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

const invokedPath = process.argv[1]?.replaceAll("\\", "/");
if (invokedPath?.endsWith("/scripts/build-museum-publication-snapshot.ts")) {
  void buildMuseumPublicationSnapshot().catch((error: unknown) => {
    const errorCode =
      error instanceof Error && error.message.length > 0
        ? error.message
        : "publication_build_snapshot_failed";
    process.stderr.write(`${errorCode}\n`);
    process.exitCode = 1;
  });
}
