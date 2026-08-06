import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { GitHubMuseumPublicationSource } from "../lib/museum/publication/github";
import { legacyCaseyPublicationAssembler } from "../lib/museum/publication/legacyCasey";
import { isExactGitCommit } from "../lib/museum/publication/security";

export const COMPATIBILITY_CONTRACT = "museum-publication-compatibility-v1";

interface MuseumPublicationCompatibilityResult {
  readonly contract: typeof COMPATIBILITY_CONTRACT;
  readonly source_commit: string;
  readonly accepted: boolean;
  readonly adapter_status: "current" | "stale" | "unavailable" | "invalid";
  readonly adapter_error_code: string | null;
  readonly publication_commit: string | null;
}

interface VerifyMuseumPublicationCompatibilityOptions {
  readonly sourceCommit: string;
  readonly fetch?: typeof fetch;
}

function invalidResult(
  sourceCommit: string
): MuseumPublicationCompatibilityResult {
  return {
    contract: COMPATIBILITY_CONTRACT,
    source_commit: sourceCommit,
    accepted: false,
    adapter_status: "invalid",
    adapter_error_code: "publication_invalid_commit",
    publication_commit: null,
  };
}

/**
 * Binds the strict frontend publication adapter to one immutable canonical
 * Museum source commit. Callers must resolve source main before invoking this
 * function; it deliberately does not accept a branch name or a moving ref.
 */
export async function verifyMuseumPublicationCompatibility(
  options: VerifyMuseumPublicationCompatibilityOptions
): Promise<MuseumPublicationCompatibilityResult> {
  if (!isExactGitCommit(options.sourceCommit)) {
    return invalidResult(options.sourceCommit);
  }

  const state = await new GitHubMuseumPublicationSource({
    ref: options.sourceCommit,
    assembler: legacyCaseyPublicationAssembler,
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
  }).load();

  if (state.status !== "current") {
    return {
      contract: COMPATIBILITY_CONTRACT,
      source_commit: options.sourceCommit,
      accepted: false,
      adapter_status: state.status,
      adapter_error_code: state.errorCode ?? "publication_source_unavailable",
      publication_commit: null,
    };
  }

  const identityMatches =
    state.publication.identity.commit === options.sourceCommit &&
    state.publication.identity.requestedRef === options.sourceCommit;
  return {
    contract: COMPATIBILITY_CONTRACT,
    source_commit: options.sourceCommit,
    accepted: identityMatches,
    adapter_status: "current",
    adapter_error_code: identityMatches
      ? null
      : "publication_source_identity_mismatch",
    publication_commit: state.publication.identity.commit,
  };
}

interface CompatibilityCliOptions {
  readonly sourceCommit: string;
  readonly outputPath: string | null;
}

function parseCliOptions(args: readonly string[]): CompatibilityCliOptions {
  let sourceCommit: string | null = null;
  let outputPath: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];
    if (argument === "--source-commit" && value !== undefined) {
      sourceCommit = value;
      index += 1;
      continue;
    }
    if (argument === "--output" && value !== undefined) {
      outputPath = value;
      index += 1;
      continue;
    }
    throw new Error("museum_publication_compatibility_usage");
  }

  if (sourceCommit === null) {
    throw new Error("museum_publication_compatibility_usage");
  }
  return { sourceCommit, outputPath };
}

function outputPathWithinRepository(outputPath: string): string {
  const repositoryRoot = process.cwd();
  const resolvedPath = path.resolve(repositoryRoot, outputPath);
  const relativePath = path.relative(repositoryRoot, resolvedPath);
  if (
    relativePath.length === 0 ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("museum_publication_compatibility_output_unsafe");
  }
  return resolvedPath;
}

async function emitResult(
  result: MuseumPublicationCompatibilityResult,
  outputPath: string | null
): Promise<void> {
  const serialized = `${JSON.stringify(result)}\n`;
  if (outputPath !== null) {
    const resolvedPath = outputPathWithinRepository(outputPath);
    await mkdir(path.dirname(resolvedPath), { recursive: true });
    await writeFile(resolvedPath, serialized, "utf8");
  }
  process.stdout.write(serialized);
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const result = await verifyMuseumPublicationCompatibility(options);
  await emitResult(result, options.outputPath);
  if (!result.accepted) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1]?.replaceAll("\\", "/");
if (invokedPath?.endsWith("/scripts/museum-publication-compatibility.ts")) {
  void main().catch((error: unknown) => {
    const errorCode =
      error instanceof Error && error.message.length > 0
        ? error.message
        : "museum_publication_compatibility_failed";
    process.stderr.write(`${errorCode}\n`);
    process.exitCode = 1;
  });
}
