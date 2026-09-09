import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS } from "../app/museum/network/research/catalog";
import { museumPublicationCatalogResolver } from "../lib/museum/publication/catalog";
import { GitHubMuseumPublicationSource } from "../lib/museum/publication/github";
import { legacyCaseyPublicationAssembler } from "../lib/museum/publication/legacyCasey";
import {
  buildImmutableMuseumBlobUrl,
  isExactGitCommit,
} from "../lib/museum/publication/security";
import type { MuseumPublication } from "../lib/museum/publication/types";

export const COMPATIBILITY_CONTRACT = "museum-publication-compatibility-v1";

interface MuseumPublicationCompatibilityResult {
  readonly contract: typeof COMPATIBILITY_CONTRACT;
  readonly source_commit: string;
  readonly accepted: boolean;
  readonly adapter_status: "current" | "stale" | "unavailable" | "invalid";
  readonly adapter_error_code: string | null;
  readonly publication_commit: string | null;
  readonly catalog_id: string | null;
  readonly catalog_content_hash: string | null;
}

interface VerifyMuseumPublicationCompatibilityOptions {
  readonly sourceCommit: string;
  readonly fetch?: typeof fetch;
}

interface MuseumResearchSectionDrift {
  readonly researchId: string;
  readonly heading: string;
  readonly occurrences: number;
  readonly reason:
    | "research_record_missing"
    | "pinned_document_missing"
    | "heading_count";
}

function markdownHeadingCounts(markdown: string): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  let fencedMarker: {
    readonly character: string;
    readonly length: number;
  } | null = null;

  for (const line of markdown.split(/\r?\n/u)) {
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    const fence = fenceMatch?.[1];
    if (fence !== undefined) {
      if (fencedMarker === null) {
        fencedMarker = { character: fence[0]!, length: fence.length };
      } else if (
        fence[0] === fencedMarker.character &&
        fence.length >= fencedMarker.length &&
        (fenceMatch?.[2] ?? "").trim() === ""
      ) {
        fencedMarker = null;
      }
      continue;
    }
    if (fencedMarker !== null) continue;

    const heading = /^\s{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/u
      .exec(line)?.[1]
      ?.trim();
    if (heading === undefined || heading.length === 0) continue;
    counts.set(heading, (counts.get(heading) ?? 0) + 1);
  }

  return counts;
}

/**
 * Confirms that each curated acquisition study still points at the immutable
 * manuscript whose selected headings were reviewed. This is a release
 * invariant: a missing or duplicated heading makes the publication unsafe to
 * expose because the landing page would present a partial or ambiguous study.
 */
export function findMuseumResearchSectionDrift(
  publication: MuseumPublication
): readonly MuseumResearchSectionDrift[] {
  const drift: MuseumResearchSectionDrift[] = [];
  for (const assignment of Object.values(
    MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS
  )) {
    const records = (publication.researchPublications ?? []).filter(
      (record) => record.id === assignment.researchId
    );
    if (records.length !== 1) {
      drift.push({
        researchId: assignment.researchId,
        heading: assignment.selectedSections[0] ?? "",
        occurrences: 0,
        reason: "research_record_missing",
      });
      continue;
    }

    const record = records[0]!;
    const documents = publication.documents.filter(
      (document) =>
        buildImmutableMuseumBlobUrl(
          publication.identity.commit,
          document.sourcePath
        ) === record.publicationUri
    );
    if (documents.length !== 1) {
      drift.push({
        researchId: assignment.researchId,
        heading: assignment.selectedSections[0] ?? "",
        occurrences: 0,
        reason: "pinned_document_missing",
      });
      continue;
    }

    const headingCounts = markdownHeadingCounts(documents[0]!.markdown);
    for (const heading of assignment.selectedSections) {
      const occurrences = headingCounts.get(heading) ?? 0;
      if (occurrences !== 1) {
        drift.push({
          researchId: assignment.researchId,
          heading,
          occurrences,
          reason: "heading_count",
        });
      }
    }
  }
  return drift;
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
    catalog_id: null,
    catalog_content_hash: null,
  };
}

/**
 * Binds the strict frontend publication adapter to one immutable canonical
 * Museum catalog/control commit. Callers must resolve source main before
 * invoking this function; the verified catalog supplies the distinct
 * publication/source commit returned as `publication_commit`.
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
    catalogResolver: museumPublicationCatalogResolver,
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
      catalog_id: null,
      catalog_content_hash: null,
    };
  }

  const identity = state.publication.identity;
  const publicationCommit = identity.commit;
  const identityMatches =
    identity.requestedRef === options.sourceCommit &&
    isExactGitCommit(publicationCommit) &&
    identity.catalogId === `6529NM-PUBCAT-${publicationCommit}` &&
    /^0x[a-f0-9]{64}$/u.test(identity.catalogContentHash ?? "");
  const researchSectionDrift = identityMatches
    ? findMuseumResearchSectionDrift(state.publication)
    : [];
  const researchSectionsMatch = researchSectionDrift.length === 0;
  return {
    contract: COMPATIBILITY_CONTRACT,
    source_commit: options.sourceCommit,
    accepted: identityMatches && researchSectionsMatch,
    adapter_status: "current",
    adapter_error_code: !identityMatches
      ? "publication_source_identity_mismatch"
      : researchSectionsMatch
        ? null
        : "publication_research_section_drift",
    publication_commit: publicationCommit,
    catalog_id: identity.catalogId ?? null,
    catalog_content_hash: identity.catalogContentHash ?? null,
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
