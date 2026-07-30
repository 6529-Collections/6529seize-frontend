#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const {
  compareReviewVersions,
  compareStrings,
  invariant,
  normalizeLf,
  sha256Urn,
  stableJson,
} = require("./solidity-reference-lib.cjs");

const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_REVIEW_ID = "6529-stream";
const KNOWLEDGE_SOURCE_DIRECTORY = "ops/public-review-knowledge";
const KNOWLEDGE_MANIFEST_SCHEMA = "public-review.knowledge-manifest.v1";
const KNOWLEDGE_INDEX_SCHEMA = "public-review.knowledge-index.v1";
const KNOWLEDGE_SHARD_SCHEMA = "public-review.knowledge-shard.v1";
const GENERATOR_NAME = "6529-public-review-stream-knowledge";
const GENERATOR_VERSION = "1";
const LEGACY_RECORDS_PER_SHARD = 120;
const RECORDS_PER_SHARD = 160;
const RECORD_SHARD_LAYOUT_VERSION = "2026-07-27.1";
const MAX_PROTOCOL_SOURCE_EXCERPT_CHARACTERS = 1_200;
const MAX_SCRIPT_SOURCE_EXCERPT_CHARACTERS = 700;
const MAX_SEARCH_TEXT_CHARACTERS = 1_600;
const SAFE_REVIEW_ID = /^[a-z0-9][a-z0-9-]*$/;
const SAFE_VERSION = /^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]+$/;
const SENSITIVE_SIGNING_KEY_NAME = /(?:private.*key|signer.*key)/i;
const STREAM_SPLIT_WALLET_DEFINITION_ID =
  "smart-contracts/StreamSplitWallet.sol:StreamSplitWallet";
const STREAM_SPLIT_WALLET_ASSET_NATSPEC = new Map([
  [
    "observedReceived",
    "@notice Returns cumulative receipts for a supported asset as current " +
      "balance plus released funds: address(0) is native currency and a " +
      "nonzero address is the corresponding ERC-20.",
  ],
  [
    "releasable",
    "@notice Returns the currently releasable amount of a supported asset for " +
      "an account: address(0) is native currency and a nonzero address is the " +
      "corresponding ERC-20.",
  ],
  [
    "roundingDust",
    "@notice Returns unreleasable dust for a supported asset caused by integer " +
      "division rounding: address(0) is native currency and a nonzero address " +
      "is the corresponding ERC-20.",
  ],
  [
    "syncAsset",
    "@notice Emits the current cumulative receipt observation for the " +
      "supported asset: address(0) is native currency and a nonzero address " +
      "is the corresponding ERC-20.",
  ],
  [
    "release",
    "@notice Pulls releasable funds for a supported asset to an account or its " +
      "chosen recipient: address(0) is native currency and a nonzero address " +
      "is the corresponding ERC-20.",
  ],
]);
const MARKDOWN_DECORATION = new Set(["`", "*", "_", "~"]);
const LETTER_OR_NUMBER = /[\p{Letter}\p{Number}]/u;
const STOP_WORDS = new Set([
  "and",
  "are",
  "contract",
  "for",
  "from",
  "into",
  "not",
  "only",
  "review",
  "stream",
  "that",
  "the",
  "this",
  "with",
]);

class KnowledgePackDriftError extends Error {}

function readJson(filePath, label) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Unable to read ${label} at ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  invariant(
    parsed !== null && typeof parsed === "object" && !Array.isArray(parsed),
    `${label} must be a JSON object.`
  );
  return parsed;
}

function fileSha256(filePath) {
  return sha256Urn(fs.readFileSync(filePath));
}

function compactStableJson(value) {
  return `${JSON.stringify(JSON.parse(stableJson(value)))}\n`;
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join("/");
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const files = [];
  const visit = (current) => {
    for (const entry of fs
      .readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      const entryPath = path.join(current, entry.name);
      invariant(
        !entry.isSymbolicLink(),
        `Knowledge packs may not contain symbolic links: ${entryPath}`
      );
      if (entry.isDirectory()) {
        visit(entryPath);
      } else {
        invariant(entry.isFile(), `Unsupported knowledge entry: ${entryPath}`);
        files.push(entryPath);
      }
    }
  };
  visit(directory);
  return files.sort((left, right) => left.localeCompare(right, "en"));
}

function resolveContainedPath(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label} must be a safe relative path.`
  );
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  invariant(
    resolved.startsWith(`${resolvedRoot}${path.sep}`),
    `${label} escapes its root.`
  );
  return resolved;
}

function publicPathToRelative(publicPath, prefix, label) {
  invariant(
    typeof publicPath === "string" && publicPath.startsWith(`${prefix}/`),
    `${label} is outside ${prefix}.`
  );
  const relativePath = publicPath.slice(prefix.length + 1);
  invariant(
    relativePath.length > 0 &&
      relativePath
        .split("/")
        .every(
          (segment) => segment.length > 0 && segment !== "." && segment !== ".."
        ),
    `${label} is not a safe relative path.`
  );
  return relativePath;
}

function generatorSourceSha256() {
  return fileSha256(__filename);
}

function knowledgeSourceRoot(repoRoot, reviewId, reviewVersion) {
  return path.join(
    repoRoot,
    KNOWLEDGE_SOURCE_DIRECTORY,
    reviewId,
    "versions",
    reviewVersion,
    "knowledge"
  );
}

function recordsPerShard(reviewVersion) {
  return compareReviewVersions(reviewVersion, RECORD_SHARD_LAYOUT_VERSION) < 0
    ? LEGACY_RECORDS_PER_SHARD
    : RECORDS_PER_SHARD;
}

function removeOrderedPrefix(value) {
  let index = 0;
  while (value[index] >= "0" && value[index] <= "9") {
    index += 1;
  }
  if (index === 0 || value[index] !== ".") {
    return value;
  }
  index += 1;
  while (index < value.length && value[index].trim().length === 0) {
    index += 1;
  }
  return value.slice(index);
}

function headingId(title) {
  const normalized = removeOrderedPrefix(
    Array.from(title.normalize("NFKD"))
      .filter((character) => !MARKDOWN_DECORATION.has(character))
      .join("")
      .toLowerCase()
  );
  let result = "";
  let separatorPending = false;
  for (const character of normalized) {
    if (LETTER_OR_NUMBER.test(character)) {
      if (separatorPending && result.length > 0) {
        result += "-";
      }
      result += character;
      separatorPending = false;
    } else if (result.length > 0) {
      separatorPending = true;
    }
  }
  return result;
}

function uniqueHeadingId(title, counts) {
  const base = headingId(title);
  if (!base) {
    return "";
  }
  const count = (counts.get(base) ?? 0) + 1;
  counts.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

function markdownToText(markdown) {
  return normalizeLf(markdown)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[^\n]*\n?/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[`*_~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeIdentifier(value) {
  return String(value ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values) {
  return [
    ...new Set(
      values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ].sort(compareStrings);
}

function identifierAliases(value) {
  const original = String(value ?? "").trim();
  if (!original) {
    return [];
  }
  const humanized = humanizeIdentifier(original);
  const withoutInterfacePrefix = /^I[A-Z]/.test(original)
    ? humanizeIdentifier(original.slice(1))
    : "";
  const withoutStreamPrefix = original.startsWith("Stream")
    ? humanizeIdentifier(original.slice("Stream".length))
    : "";
  return uniqueStrings([
    original,
    humanized,
    humanized.toLowerCase(),
    withoutInterfacePrefix,
    withoutInterfacePrefix.toLowerCase(),
    withoutStreamPrefix,
    withoutStreamPrefix.toLowerCase(),
  ]);
}

function searchTokens(value) {
  return uniqueStrings(
    humanizeIdentifier(String(value ?? ""))
      .normalize("NFKD")
      .toLowerCase()
      .match(/[\p{Letter}\p{Number}]+/gu) ?? []
  ).filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function boundedSearchText(values) {
  const text = markdownToText(values.filter(Boolean).join(" "));
  return text.length <= MAX_SEARCH_TEXT_CHARACTERS
    ? text
    : `${text.slice(0, MAX_SEARCH_TEXT_CHARACTERS - 1)}…`;
}

function evidenceStates(markdown) {
  const normalized = markdown
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .toUpperCase();
  const states = [];
  if (
    /\bIMPLEMENTED\b/.test(normalized) &&
    !/\bNOT IMPLEMENTED\b/.test(normalized)
  ) {
    states.push("IMPLEMENTED");
  }
  if (/\bTESTED\b/.test(normalized)) {
    states.push("TESTED");
  }
  if (
    /\b(?:PROPOSED|ACCEPTED TARGET\s*-\s*NOT IMPLEMENTED)\b/.test(normalized)
  ) {
    states.push("PROPOSED");
  }
  if (/\bOPEN FOR FEEDBACK\b/.test(normalized)) {
    states.push("OPEN_FOR_FEEDBACK");
  }
  if (/\bAUDIT PENDING\b/.test(normalized)) {
    states.push("AUDIT_PENDING");
  }
  if (/\bDEFERRED\b/.test(normalized)) {
    states.push("DEFERRED");
  }
  if (
    /\b(?:KNOWN LIMITATION|IMPORTANT LIMITATION|IMPORTANT LIMIT|EVIDENCE PENDING|CANDIDATE UNBOUND)\b/.test(
      normalized
    )
  ) {
    states.push("KNOWN_LIMITATION");
  }
  return states;
}

function editorialPagePath(reviewId, version, pageId) {
  const root = `/reviews/${reviewId}/versions/${version}`;
  return pageId === "overview" ? root : `${root}/${pageId}`;
}

function splitEditorialPage({
  markdown,
  page,
  reviewId,
  reviewVersion,
  sourceCommit,
}) {
  const lines = normalizeLf(markdown).split("\n");
  const headingCounts = new Map();
  const records = [];
  let pageHeading = page.title;
  let currentSection = {
    level: 1,
    title: page.title,
    anchor: null,
    parentTitle: null,
    lines: [],
  };
  let currentH2 = null;

  const flush = () => {
    const raw = currentSection.lines.join("\n").trim();
    const text = markdownToText(raw);
    if (!text) {
      return;
    }
    const subsection =
      currentSection.level === 3 ? headingId(currentSection.title) : null;
    const identitySuffix = currentSection.anchor ?? "intro";
    const id = `editorial:${page.id}:${identitySuffix}${
      subsection ? `:${subsection}` : ""
    }`;
    const canonicalPath = `${editorialPagePath(
      reviewId,
      reviewVersion,
      page.id
    )}${currentSection.anchor ? `#${currentSection.anchor}` : ""}`;
    const headingPath = uniqueStrings([
      pageHeading,
      currentSection.parentTitle,
      currentSection.title,
    ]);
    const aliases = uniqueStrings([
      page.title,
      currentSection.title,
      currentSection.parentTitle,
      ...searchTokens(currentSection.title),
    ]);
    records.push({
      id,
      category: "editorial",
      kind: "editorial_section",
      title:
        currentSection.level === 1
          ? page.title
          : `${page.title}: ${currentSection.title}`,
      name: currentSection.title,
      aliases,
      exactKeys: uniqueStrings([
        id,
        page.id,
        currentSection.anchor,
        currentSection.title,
      ]),
      canonicalPath,
      text,
      evidenceStates: evidenceStates(raw),
      provenance: {
        reviewVersion,
        sourceCommit,
        editorialPageId: page.id,
        editorialFile: page.file,
        heading: currentSection.title,
        headingPath,
        anchor: currentSection.anchor,
      },
      relationships: {
        relatedEditorialIds: [],
      },
      searchText: boundedSearchText([
        page.title,
        currentSection.title,
        currentSection.parentTitle,
        aliases.join(" "),
        text,
      ]),
    });
  };

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (!heading) {
      currentSection.lines.push(line);
      continue;
    }
    const level = heading[1].length;
    const title = heading[2].trim();
    if (level === 1) {
      pageHeading = title;
      currentSection.title = title;
      continue;
    }
    flush();
    if (level === 2) {
      const anchor = uniqueHeadingId(title, headingCounts);
      currentH2 = { title, anchor };
      currentSection = {
        level,
        title,
        anchor,
        parentTitle: null,
        lines: [],
      };
    } else {
      currentSection = {
        level,
        title,
        anchor: currentH2?.anchor ?? null,
        parentTitle: currentH2?.title ?? null,
        lines: [],
      };
    }
  }
  flush();
  return records;
}

function editorialIdentity(editorialRoot, manifest) {
  const files = ["manifest.json", ...manifest.pages.map((page) => page.file)];
  const identity = files
    .sort(compareStrings)
    .map((file) => {
      const buffer = fs.readFileSync(path.join(editorialRoot, file));
      return `${file}\n${sha256Urn(buffer)}\n${buffer.length}`;
    })
    .join("\n");
  return sha256Urn(identity);
}

function loadEditorialRecords({
  repoRoot,
  reviewId,
  reviewVersion,
  sourceRepository,
  sourceCommit,
}) {
  const editorialRoot = path.join(
    repoRoot,
    "content",
    "public-reviews",
    reviewId,
    "versions",
    reviewVersion,
    "editorial"
  );
  const manifestPath = path.join(editorialRoot, "manifest.json");
  const manifest = readJson(
    manifestPath,
    `${reviewId}@${reviewVersion} editorial`
  );
  invariant(
    manifest.schema_version === 1 &&
      manifest.review_id === reviewId &&
      manifest.review_version === reviewVersion &&
      manifest.source_commit === sourceCommit &&
      manifest.source_repository === `https://github.com/${sourceRepository}` &&
      Array.isArray(manifest.pages) &&
      manifest.pages.length > 0,
    `${reviewId}@${reviewVersion} editorial manifest identity drifted.`
  );
  const records = manifest.pages.flatMap((page) => {
    invariant(
      typeof page.id === "string" &&
        typeof page.title === "string" &&
        page.file === `${page.id}.md`,
      `${reviewId}@${reviewVersion} editorial page is invalid.`
    );
    const markdown = fs.readFileSync(
      path.join(editorialRoot, page.file),
      "utf8"
    );
    return splitEditorialPage({
      markdown,
      page,
      reviewId,
      reviewVersion,
      sourceCommit,
    });
  });
  invariant(
    records.length >= manifest.pages.length,
    "Editorial knowledge must retain at least one semantic section per page."
  );
  return {
    identitySha256: editorialIdentity(editorialRoot, manifest),
    manifest,
    manifestPath,
    manifestSha256: fileSha256(manifestPath),
    records,
  };
}

function sourceExcerpt(sourceText, range, { scope, kind }) {
  const maxCharacters =
    scope === "protocol"
      ? MAX_PROTOCOL_SOURCE_EXCERPT_CHARACTERS
      : scope === "script"
        ? MAX_SCRIPT_SOURCE_EXCERPT_CHARACTERS
        : 0;
  if (maxCharacters === 0 || !["function", "modifier"].includes(kind)) {
    return "";
  }
  if (
    !range ||
    !Number.isInteger(range.lineStart) ||
    !Number.isInteger(range.lineEnd)
  ) {
    return "";
  }
  const lines = normalizeLf(sourceText).split("\n");
  const excerpt = lines
    .slice(Math.max(0, range.lineStart - 1), range.lineEnd)
    .join("\n")
    .trim();
  if (excerpt.length <= maxCharacters) {
    return excerpt;
  }
  const headLength = Math.floor(maxCharacters * 0.72);
  const tailLength = maxCharacters - headLength - 7;
  return `${excerpt.slice(0, headLength)}\n…\n${excerpt.slice(-tailLength)}`;
}

function sourceReviewPath(reviewId, version, sourcePath, range) {
  const encoded = sourcePath.split("/").map(encodeURIComponent).join("/");
  const suffix = range
    ? `#L${range.lineStart}${
        range.lineEnd === range.lineStart ? "" : `-L${range.lineEnd}`
      }`
    : "";
  return `/reviews/${reviewId}/versions/${version}/reference/sources/${encoded}${suffix}`;
}

function definitionReviewPath(reviewId, version, key) {
  return `/reviews/${reviewId}/versions/${version}/reference/definitions/${key}`;
}

function declarationReviewPath(reviewId, version, definitionKey, declaration) {
  const plural = {
    error: "errors",
    event: "events",
    function: "functions",
  }[declaration.kind];
  return plural && declaration.key
    ? `${definitionReviewPath(
        reviewId,
        version,
        definitionKey
      )}/${plural}/${declaration.key}`
    : definitionReviewPath(reviewId, version, definitionKey);
}

function parameterSignature(inputs) {
  return (Array.isArray(inputs) ? inputs : [])
    .map((input) => input.type ?? input.typeString ?? "")
    .join(",");
}

function localDeclarationSemanticId(definition, group, declaration) {
  if (declaration.id) {
    return declaration.id;
  }
  const signature =
    group === "modifiers"
      ? `${declaration.name}(${parameterSignature(declaration.inputs)})`
      : declaration.name;
  return `${definition.id}#${group}:${signature}`;
}

function isSensitiveSigningKeyDeclaration(declaration, scope) {
  return (
    (scope === "test" || scope === "script") &&
    SENSITIVE_SIGNING_KEY_NAME.test(declaration.name ?? "")
  );
}

function declarationKnowledgeNatspec(declaration, definition) {
  if (definition?.id === STREAM_SPLIT_WALLET_DEFINITION_ID) {
    const assetAwareNatspec = STREAM_SPLIT_WALLET_ASSET_NATSPEC.get(
      declaration.name
    );
    if (assetAwareNatspec) {
      return assetAwareNatspec;
    }
  }
  return declaration.natspec;
}

function selectedDeclarationDetails(declaration, definition, scope) {
  const fields = [
    "anonymous",
    "canonicalSignature",
    "constant",
    "displaySignature",
    "functionKind",
    "immutable",
    "inputs",
    "memberDetails",
    "members",
    "modifiers",
    "name",
    "natspec",
    "outputs",
    "overrides",
    "selector",
    "stateMutability",
    "syntheticGetter",
    "topic0",
    "type",
    "typeString",
    "underlyingType",
    "virtual",
    "visibility",
  ];
  const details = Object.fromEntries(
    fields
      .filter((field) => declaration[field] !== undefined)
      .map((field) => [field, declaration[field]])
  );
  details.natspec = declarationKnowledgeNatspec(declaration, definition);
  if (
    declaration.valueSource !== undefined &&
    !isSensitiveSigningKeyDeclaration(declaration, scope)
  ) {
    details.valueSource = declaration.valueSource;
  }
  return details;
}

function declarationSummary(declaration, kind, definition) {
  const natspec = declarationKnowledgeNatspec(declaration, definition);
  if (natspec?.trim()) {
    return natspec.trim();
  }
  if (
    definition.id === STREAM_SPLIT_WALLET_DEFINITION_ID &&
    declaration.name === "_currentBalance"
  ) {
    return (
      "Returns the current balance of a supported asset: address(0) reads " +
      "native currency and a nonzero address reads the corresponding ERC-20."
    );
  }
  const signature =
    declaration.displaySignature ??
    declaration.canonicalSignature ??
    declaration.name;
  const details = [
    `${kind} ${signature}`,
    declaration.visibility ? `${declaration.visibility} visibility` : "",
    declaration.stateMutability
      ? `${declaration.stateMutability} mutability`
      : "",
    declaration.modifiers?.length
      ? `modifiers ${declaration.modifiers.join(", ")}`
      : "",
    `declared by ${definition.name}`,
  ].filter(Boolean);
  return `${details.join("; ")}.`;
}

function createTechnicalRecords({
  repoRoot,
  reviewId,
  reviewVersion,
  sourceCommit,
  reference,
}) {
  const versionRoot = path.join(
    repoRoot,
    "public",
    "review-data",
    reviewId,
    "versions",
    reviewVersion
  );
  const sourceTexts = new Map(
    reference.files.map((file) => [
      file.path,
      fs.readFileSync(
        path.join(versionRoot, "sources", ...file.path.split("/")),
        "utf8"
      ),
    ])
  );
  const records = [];
  const declarationIdsByDefinition = new Map();

  for (const definitionIndex of [...reference.definitionIndex].sort(
    (left, right) => left.id.localeCompare(right.id, "en")
  )) {
    const shardRelative = publicPathToRelative(
      definitionIndex.shardPath,
      `/review-data/${reviewId}/versions/${reviewVersion}/definitions`,
      `${definitionIndex.id} shard`
    );
    const shard = readJson(
      path.join(versionRoot, "definitions", shardRelative),
      `${definitionIndex.id} definition shard`
    );
    const definition = shard.definition;
    invariant(
      definition?.id === definitionIndex.id &&
        definition.key === definitionIndex.key,
      `${definitionIndex.id} definition shard identity drifted.`
    );
    const definitionId = `definition:${definition.id}`;
    const sourceText = sourceTexts.get(definition.sourcePath);
    invariant(
      sourceText !== undefined,
      `${definition.id} source text is missing.`
    );
    const definitionAliases = uniqueStrings([
      ...identifierAliases(definition.name),
      path.posix.basename(definition.sourcePath, ".sol"),
      definition.kind,
      definition.classification,
    ]);
    const definitionSummary = [
      definition.natspec,
      definition.classificationReason,
      `${definition.kind} ${definition.name} is classified as ${definition.classification}.`,
      definition.membership?.deployment?.status
        ? `Deployment status: ${definition.membership.deployment.status}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    records.push({
      id: definitionId,
      technicalId: definition.id,
      category: "technical",
      kind: definition.kind,
      title: `${definition.name} ${definition.kind}`,
      name: definition.name,
      aliases: definitionAliases,
      exactKeys: uniqueStrings([
        definitionId,
        definition.id,
        definition.key,
        definition.name,
        definition.sourcePath,
      ]),
      canonicalPath: definitionReviewPath(
        reviewId,
        reviewVersion,
        definition.key
      ),
      sourcePath: definition.sourcePath,
      sourceLink: sourceReviewPath(
        reviewId,
        reviewVersion,
        definition.sourcePath,
        definition.range
      ),
      scope: definition.scope,
      classification: definition.classification,
      summary: definitionSummary,
      provenance: {
        reviewVersion,
        sourceCommit,
        sourcePath: definition.sourcePath,
        range: definition.range,
      },
      technical: {
        abstract: definition.abstract,
        classificationReason: definition.classificationReason,
        inheritance: definition.inheritance,
        interface: definition.interface,
        membership: definition.membership,
        natspec: definition.natspec,
        release: definition.release,
        declarationCounts: definitionIndex.declarationCounts,
        abiSurfaceCounts: definitionIndex.abiSurfaceCounts,
      },
      relationships: {
        relatedDeclarationIds: [],
        relatedEditorialIds: [],
      },
      searchText: boundedSearchText([
        definition.name,
        definition.kind,
        definitionAliases.join(" "),
        definition.sourcePath,
        definition.scope,
        definition.classification,
        definitionSummary,
        (definition.inheritance ?? []).map((entry) => entry.name).join(" "),
      ]),
    });

    const localIds = [];
    const groups = [
      ["functions", "function"],
      ["events", "event"],
      ["errors", "error"],
      ["stateVariables", "state_variable"],
      ["modifiers", "modifier"],
      ["structs", "struct"],
      ["enums", "enum"],
      ["userDefinedValueTypes", "user_defined_value_type"],
    ];
    for (const [group, kind] of groups) {
      for (const declaration of definition.declarations?.[group] ?? []) {
        const technicalId = localDeclarationSemanticId(
          definition,
          group,
          declaration
        );
        const recordId = `declaration:${technicalId}`;
        const signature =
          declaration.canonicalSignature ??
          declaration.displaySignature ??
          (group === "modifiers"
            ? `${declaration.name}(${parameterSignature(declaration.inputs)})`
            : declaration.name);
        const aliases = uniqueStrings([
          ...identifierAliases(declaration.name),
          signature,
          `${definition.name}.${declaration.name}`,
          `${definition.name}.${signature}`,
          kind.replaceAll("_", " "),
        ]);
        const excerpt = isSensitiveSigningKeyDeclaration(
          declaration,
          definition.scope
        )
          ? undefined
          : sourceExcerpt(sourceText, declaration.range, {
              scope: definition.scope,
              kind,
            });
        const summary = declarationSummary(declaration, kind, definition);
        records.push({
          id: recordId,
          technicalId,
          category: "technical",
          kind,
          title: `${definition.name}.${signature}`,
          name: declaration.name,
          signature,
          selector: declaration.selector ?? null,
          topic0: declaration.topic0 ?? null,
          aliases,
          exactKeys: uniqueStrings([
            recordId,
            technicalId,
            declaration.key,
            declaration.name,
            signature,
            declaration.canonicalSignature,
            declaration.displaySignature,
            declaration.selector,
            declaration.topic0,
            definition.name,
            `${definition.name}.${declaration.name}`,
            `${definition.name}.${signature}`,
            definition.sourcePath,
          ]),
          canonicalPath: declarationReviewPath(
            reviewId,
            reviewVersion,
            definition.key,
            { ...declaration, kind }
          ),
          sourcePath: definition.sourcePath,
          sourceLink: sourceReviewPath(
            reviewId,
            reviewVersion,
            definition.sourcePath,
            declaration.range
          ),
          scope: definition.scope,
          classification: definition.classification,
          summary,
          bodyExcerpt: excerpt,
          provenance: {
            reviewVersion,
            sourceCommit,
            sourcePath: definition.sourcePath,
            range: declaration.range,
          },
          technical: {
            definitionId: definition.id,
            definitionName: definition.name,
            definitionKey: definition.key,
            definitionKind: definition.kind,
            definitionInheritance: definition.inheritance,
            declaration: selectedDeclarationDetails(
              declaration,
              definition,
              definition.scope
            ),
          },
          relationships: {
            relatedDefinitionId: definitionId,
            relatedEditorialIds: [],
          },
          searchText: boundedSearchText([
            definition.name,
            signature,
            aliases.join(" "),
            definition.sourcePath,
            definition.scope,
            definition.classification,
            summary,
            excerpt,
          ]),
        });
        localIds.push(recordId);
      }
    }
    const abiSurfaceIds = ["functions", "events", "errors"].flatMap((group) =>
      (definition.abiSurface?.[group] ?? []).map(
        (entry) => `declaration:${entry.declarationId}`
      )
    );
    declarationIdsByDefinition.set(
      definitionId,
      uniqueStrings([...localIds, ...abiSurfaceIds]).sort(compareStrings)
    );
  }

  for (const file of reference.files) {
    const sourceText = sourceTexts.get(file.path);
    for (const declaration of file.topLevelDeclarations ?? []) {
      const recordId = `declaration:${declaration.id}`;
      const aliases = uniqueStrings([
        ...identifierAliases(declaration.name),
        declaration.canonicalName,
        declaration.kind,
        file.path,
      ]);
      const excerpt = isSensitiveSigningKeyDeclaration(declaration, file.scope)
        ? undefined
        : sourceExcerpt(sourceText, declaration.range, {
            scope: file.scope,
            kind: `top_level_${declaration.kind}`,
          });
      records.push({
        id: recordId,
        technicalId: declaration.id,
        category: "technical",
        kind: `top_level_${declaration.kind}`,
        title: `${declaration.name} top-level ${declaration.kind}`,
        name: declaration.name,
        aliases,
        exactKeys: uniqueStrings([
          recordId,
          declaration.id,
          declaration.key,
          declaration.name,
          declaration.canonicalName,
          file.path,
        ]),
        canonicalPath: `/reviews/${reviewId}/versions/${reviewVersion}/reference/declarations/${declaration.key}`,
        sourcePath: file.path,
        sourceLink: sourceReviewPath(
          reviewId,
          reviewVersion,
          file.path,
          declaration.range
        ),
        scope: file.scope,
        classification: "top_level_declaration",
        summary:
          declaration.natspec?.trim() ||
          `Top-level ${declaration.kind} ${declaration.name} declared in ${file.path}.`,
        bodyExcerpt: excerpt,
        provenance: {
          reviewVersion,
          sourceCommit,
          sourcePath: file.path,
          range: declaration.range,
        },
        technical: {
          declaration: selectedDeclarationDetails(
            declaration,
            undefined,
            file.scope
          ),
        },
        relationships: {
          relatedEditorialIds: [],
        },
        searchText: boundedSearchText([
          declaration.name,
          declaration.canonicalName,
          aliases.join(" "),
          declaration.kind,
          file.path,
          excerpt,
        ]),
      });
    }
  }

  for (const record of records) {
    if (record.id.startsWith("definition:")) {
      record.relationships.relatedDeclarationIds =
        declarationIdsByDefinition.get(record.id) ?? [];
    }
  }
  return records;
}

function statusCanonicalPath(reviewId, version, anchor) {
  return `${editorialPagePath(
    reviewId,
    version,
    "security-testing-and-known-limitations"
  )}#${anchor}`;
}

function createStatusRecords({
  reviewId,
  reviewVersion,
  sourceCommit,
  publication,
  reference,
}) {
  const records = [];
  const readiness = reference.auditorEvidence?.readiness;
  const release = reference.auditorEvidence?.release;
  const riskRegister = reference.auditorEvidence?.riskRegister;
  const deploymentCounts = [...reference.definitionIndex].reduce(
    (counts, definition) => {
      const status = definition.membership?.deployment?.status ?? "unknown";
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    },
    {}
  );
  const stateFacts = [
    `Lifecycle: ${publication.lifecycleState}.`,
    `Deployment status: ${publication.deploymentStatus}.`,
    `Audit status: ${publication.auditStatus}.`,
    release?.status ? `Release evidence status: ${release.status}.` : "",
    readiness?.status
      ? `Public beta: ${readiness.status.public_beta}; production release: ${readiness.status.production_release}.`
      : "",
  ].filter(Boolean);
  records.push({
    id: `status:${reviewVersion}:review-state`,
    category: "status",
    kind: "review_status",
    title: "Stream review, deployment, audit, and readiness state",
    name: "review state",
    aliases: [
      "stream status",
      "stream deployed",
      "stream audit status",
      "stream readiness",
      "public beta",
      "production release",
    ],
    exactKeys: [`status:${reviewVersion}:review-state`, reviewVersion],
    canonicalPath: statusCanonicalPath(reviewId, reviewVersion, "current-path"),
    summary: stateFacts.join(" "),
    structured: {
      lifecycleState: publication.lifecycleState,
      deploymentStatus: publication.deploymentStatus,
      auditStatus: publication.auditStatus,
      releaseStatus: release?.status ?? null,
      readinessStatus: readiness?.status ?? null,
      deploymentCounts,
      unavailableReleaseCeremony:
        reference.auditorEvidence?.unavailableReleaseCeremony ?? null,
    },
    provenance: {
      reviewVersion,
      sourceCommit,
      sourcePath: "reference-manifest.json#auditorEvidence",
    },
    relationships: { relatedEditorialIds: [] },
    searchText: boundedSearchText(stateFacts),
  });

  for (const requirement of readiness?.requirements ?? []) {
    const id = `status:${reviewVersion}:requirement:${requirement.id}`;
    const summary = [
      `Readiness requirement ${requirement.id} is ${requirement.status} for ${requirement.phase}.`,
      requirement.notes,
      requirement.owner ? `Owner: ${requirement.owner}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    records.push({
      id,
      category: "status",
      kind: "readiness_requirement",
      title: humanizeIdentifier(requirement.id),
      name: requirement.id,
      aliases: uniqueStrings([
        requirement.id,
        humanizeIdentifier(requirement.id),
        requirement.phase,
        requirement.status,
      ]),
      exactKeys: [id, requirement.id],
      canonicalPath: statusCanonicalPath(
        reviewId,
        reviewVersion,
        "release-blockers"
      ),
      summary,
      structured: requirement,
      provenance: {
        reviewVersion,
        sourceCommit,
        sourcePath: "release-artifacts/latest/public-beta-evidence.json",
      },
      relationships: { relatedEditorialIds: [] },
      searchText: boundedSearchText([
        requirement.id,
        requirement.phase,
        requirement.status,
        requirement.notes,
      ]),
    });
  }

  for (const risk of riskRegister?.risks ?? []) {
    const id = `risk:${reviewVersion}:${risk.id}`;
    const summary = [
      risk.title,
      `Status: ${risk.status}; severity: ${risk.severity}.`,
      risk.mitigation,
      risk.residual_risk,
    ]
      .filter(Boolean)
      .join(" ");
    records.push({
      id,
      category: "status",
      kind: "risk",
      title: risk.title,
      name: risk.id,
      aliases: uniqueStrings([
        risk.id,
        risk.area,
        risk.title,
        risk.status,
        risk.severity,
      ]),
      exactKeys: [id, risk.id],
      canonicalPath: statusCanonicalPath(
        reviewId,
        reviewVersion,
        "known-limitations-and-unresolved-blockers"
      ),
      summary,
      structured: risk,
      provenance: {
        reviewVersion,
        sourceCommit,
        sourcePath: "release-artifacts/latest/risk-register.json",
      },
      relationships: { relatedEditorialIds: [] },
      searchText: boundedSearchText([
        risk.id,
        risk.area,
        risk.title,
        risk.status,
        risk.severity,
        risk.mitigation,
        risk.residual_risk,
      ]),
    });
  }

  for (const [name, report] of Object.entries(
    reference.auditorEvidence?.blockerReports ?? {}
  )) {
    const id = `evidence:${reviewVersion}:blocker-report:${name}`;
    records.push({
      id,
      category: "status",
      kind: "release_evidence",
      title: `${humanizeIdentifier(name)} blocker report`,
      name,
      aliases: uniqueStrings([
        name,
        humanizeIdentifier(name),
        "blocker report",
        report.path,
      ]),
      exactKeys: [id, name, report.path, report.sha256],
      canonicalPath: statusCanonicalPath(
        reviewId,
        reviewVersion,
        "release-blockers"
      ),
      summary: `${report.path} is retained as ${report.sha256}.`,
      structured: report,
      provenance: {
        reviewVersion,
        sourceCommit,
        sourcePath: report.path,
      },
      relationships: { relatedEditorialIds: [] },
      searchText: boundedSearchText([
        name,
        report.path,
        report.sha256,
        "release blockers",
      ]),
    });
  }
  return records;
}

function relatedEditorialIds(record, editorialRecords) {
  if (record.category === "editorial") {
    return [];
  }
  const queryTokens = searchTokens(
    [
      record.title,
      record.name,
      record.signature,
      record.summary,
      record.scope,
      record.classification,
    ].join(" ")
  );
  if (queryTokens.length === 0) {
    return [];
  }
  return editorialRecords
    .map((editorial) => {
      const haystack = editorial.searchText.toLowerCase();
      const score = queryTokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0
      );
      return { id: editorial.id, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.id.localeCompare(right.id, "en")
    )
    .slice(0, 3)
    .map((candidate) => candidate.id);
}

function recordCounts(records) {
  return records.reduce(
    (counts, record) => {
      counts.total += 1;
      counts.byCategory[record.category] =
        (counts.byCategory[record.category] ?? 0) + 1;
      counts.byKind[record.kind] = (counts.byKind[record.kind] ?? 0) + 1;
      if (record.scope) {
        counts.byScope[record.scope] = (counts.byScope[record.scope] ?? 0) + 1;
      }
      return counts;
    },
    { total: 0, byCategory: {}, byKind: {}, byScope: {} }
  );
}

function contentRecord(record) {
  const content = { ...record };
  delete content.searchText;
  if (record.category === "technical") {
    delete content.aliases;
    delete content.exactKeys;
  }
  if (!content.bodyExcerpt) {
    delete content.bodyExcerpt;
  }
  return content;
}

function catalogSearchText(record) {
  if (record.category !== "technical") {
    return record.searchText;
  }
  if (record.scope === "test") {
    return "";
  }
  return boundedSearchText([
    record.summary,
    record.technical?.declaration?.natspec,
  ]);
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) =>
        entry !== null &&
        entry !== undefined &&
        entry !== "" &&
        (!Array.isArray(entry) || entry.length > 0)
    )
  );
}

function knowledgeSemanticIdentity(manifest) {
  const clone = { ...manifest };
  delete clone.knowledgeSha256;
  return sha256Urn(stableJson(clone));
}

function buildKnowledgePack({
  repoRoot = REPOSITORY_ROOT,
  reviewId = DEFAULT_REVIEW_ID,
  reviewVersion,
  publication,
  referenceIndexEntry,
}) {
  invariant(
    SAFE_REVIEW_ID.test(reviewId) && SAFE_VERSION.test(reviewVersion),
    "Knowledge review identity is invalid."
  );
  const versionRoot = path.join(
    repoRoot,
    "public",
    "review-data",
    reviewId,
    "versions",
    reviewVersion
  );
  const referencePath = path.join(versionRoot, "reference-manifest.json");
  const reference = readJson(
    referencePath,
    `${reviewId}@${reviewVersion} reference manifest`
  );
  invariant(
    reference.reviewId === reviewId &&
      reference.reviewVersion === reviewVersion &&
      reference.source?.commit === referenceIndexEntry.commit &&
      reference.source?.tree === referenceIndexEntry.tree &&
      reference.generator?.outputSha256 === referenceIndexEntry.bundleSha256,
    `${reviewId}@${reviewVersion} reference identity drifted.`
  );
  const editorial = loadEditorialRecords({
    repoRoot,
    reviewId,
    reviewVersion,
    sourceRepository: reference.source.repository,
    sourceCommit: reference.source.commit,
  });
  const technicalRecords = createTechnicalRecords({
    repoRoot,
    reviewId,
    reviewVersion,
    sourceCommit: reference.source.commit,
    reference,
  });
  const statusRecords = createStatusRecords({
    reviewId,
    reviewVersion,
    sourceCommit: reference.source.commit,
    publication,
    reference,
  });
  const records = [
    ...editorial.records,
    ...technicalRecords,
    ...statusRecords,
  ].sort((left, right) => left.id.localeCompare(right.id, "en"));
  invariant(
    new Set(records.map((record) => record.id)).size === records.length,
    `${reviewId}@${reviewVersion} knowledge record IDs are duplicated.`
  );
  for (const record of records) {
    record.relationships.relatedEditorialIds = relatedEditorialIds(
      record,
      editorial.records
    );
  }

  const basePublicPath = `/review-data/${reviewId}/versions/${reviewVersion}/knowledge`;
  const files = new Map();
  const recordShards = [];
  const shardPathByRecordId = new Map();
  const shardSize = recordsPerShard(reviewVersion);
  for (let offset = 0; offset < records.length; offset += shardSize) {
    const shardNumber = Math.floor(offset / shardSize);
    const fileName = `${String(shardNumber).padStart(3, "0")}.json`;
    const relativePath = `records/${fileName}`;
    const publicPath = `${basePublicPath}/${relativePath}`;
    const shardRecords = records.slice(offset, offset + shardSize);
    for (const record of shardRecords) {
      shardPathByRecordId.set(record.id, publicPath);
    }
    const buffer = Buffer.from(
      compactStableJson({
        schemaVersion: KNOWLEDGE_SHARD_SCHEMA,
        reviewId,
        reviewVersion,
        shard: shardNumber,
        records: shardRecords.map(contentRecord),
      })
    );
    files.set(relativePath, buffer);
    recordShards.push({
      path: publicPath,
      sha256: sha256Urn(buffer),
      recordCount: shardRecords.length,
    });
  }

  const searchRecords = records.map((record) =>
    compactObject({
      id: record.id,
      category: record.category,
      kind: record.kind,
      title: record.title,
      name: record.name,
      signature: record.signature,
      selector: record.selector,
      topic0: record.topic0,
      aliases:
        record.category === "technical"
          ? []
          : (record.aliases ?? [])
              .filter((alias) => alias.length <= 160)
              .slice(0, 12),
      sourcePath: record.sourcePath,
      scope: record.scope,
      classification: record.classification,
      definitionName: record.technical?.definitionName,
      searchText: catalogSearchText(record),
      recordShard: Number(
        path.posix.basename(shardPathByRecordId.get(record.id), ".json")
      ),
    })
  );
  const searchIndexPath = `${basePublicPath}/search-index.json`;
  const searchIndexBuffer = Buffer.from(
    compactStableJson({
      schemaVersion: KNOWLEDGE_INDEX_SCHEMA,
      reviewId,
      reviewVersion,
      source: {
        repository: reference.source.repository,
        commit: reference.source.commit,
        tree: reference.source.tree,
      },
      referenceBundleSha256: reference.generator.outputSha256,
      records: searchRecords,
    })
  );
  files.set("search-index.json", searchIndexBuffer);

  const counts = recordCounts(records);
  const manifest = {
    schemaVersion: KNOWLEDGE_MANIFEST_SCHEMA,
    reviewId,
    reviewVersion,
    source: {
      repository: reference.source.repository,
      commit: reference.source.commit,
      tree: reference.source.tree,
    },
    publication: {
      lifecycleState: publication.lifecycleState,
      deploymentStatus: publication.deploymentStatus,
      auditStatus: publication.auditStatus,
    },
    reference: {
      manifestPath: referenceIndexEntry.bundlePath,
      manifestSha256: fileSha256(referencePath),
      bundleSha256: reference.generator.outputSha256,
    },
    editorial: {
      manifestPath: `/content/public-reviews/${reviewId}/versions/${reviewVersion}/editorial/manifest.json`,
      manifestSha256: editorial.manifestSha256,
      corpusSha256: editorial.identitySha256,
      pageCount: editorial.manifest.pages.length,
      sectionCount: editorial.records.length,
    },
    generator: {
      name: GENERATOR_NAME,
      version: GENERATOR_VERSION,
      sourceSha256: generatorSourceSha256(),
    },
    searchIndex: {
      path: searchIndexPath,
      sha256: sha256Urn(searchIndexBuffer),
      recordCount: searchRecords.length,
    },
    recordShards,
    counts,
    knowledgeSha256: null,
  };
  manifest.knowledgeSha256 = knowledgeSemanticIdentity(manifest);
  files.set("manifest.json", Buffer.from(stableJson(manifest)));
  return { files, manifest, records, searchIndex: searchRecords };
}

function expectedFileMap(pack, knowledgeRoot) {
  return new Map(
    [...pack.files.entries()].map(([relativePath, buffer]) => [
      path.join(knowledgeRoot, ...relativePath.split("/")),
      buffer,
    ])
  );
}

function assertFileMapEquals(expected, knowledgeRoot, label) {
  const actualPaths = listFiles(knowledgeRoot);
  const expectedPaths = [...expected.keys()].sort(compareStrings);
  if (stableJson(actualPaths) !== stableJson(expectedPaths)) {
    throw new KnowledgePackDriftError(`${label} file set drifted.`);
  }
  for (const [filePath, buffer] of expected) {
    if (!fs.readFileSync(filePath).equals(buffer)) {
      throw new KnowledgePackDriftError(
        `${label} file drifted: ${normalizeRelativePath(
          path.relative(knowledgeRoot, filePath)
        )}`
      );
    }
  }
}

function writePackAtomically(pack, knowledgeRoot, { replace = false } = {}) {
  invariant(
    replace || !fs.existsSync(knowledgeRoot),
    "Knowledge destination already exists."
  );
  const versionRoot = path.dirname(knowledgeRoot);
  fs.mkdirSync(versionRoot, { recursive: true });
  const stageRoot = fs.mkdtempSync(
    path.join(versionRoot, `.knowledge-stage-${process.pid}-`)
  );
  const backupRoot = path.join(
    versionRoot,
    `.knowledge-backup-${process.pid}-${Date.now()}`
  );
  let renamed = false;
  let backedUp = false;
  try {
    for (const [relativePath, buffer] of pack.files) {
      const filePath = resolveContainedPath(
        stageRoot,
        relativePath,
        "Knowledge file"
      );
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buffer, { flag: "wx" });
    }
    if (replace && fs.existsSync(knowledgeRoot)) {
      fs.renameSync(knowledgeRoot, backupRoot);
      backedUp = true;
    }
    fs.renameSync(stageRoot, knowledgeRoot);
    renamed = true;
    if (backedUp) {
      fs.rmSync(backupRoot, { recursive: true, force: true });
      backedUp = false;
    }
  } catch (error) {
    if (backedUp && !fs.existsSync(knowledgeRoot)) {
      fs.renameSync(backupRoot, knowledgeRoot);
      backedUp = false;
    }
    throw error;
  } finally {
    if (!renamed && fs.existsSync(stageRoot)) {
      fs.rmSync(stageRoot, { recursive: true, force: true });
    }
    if (backedUp && fs.existsSync(backupRoot)) {
      fs.rmSync(backupRoot, { recursive: true, force: true });
    }
  }
}

function knowledgeContext(repoRoot, reviewId, reviewVersion) {
  const publicationConfig = readJson(
    path.join(
      repoRoot,
      "config",
      "public-reviews",
      `${reviewId}.publication.json`
    ),
    `${reviewId} publication`
  );
  const publication = publicationConfig.versions?.find(
    (candidate) => candidate.version === reviewVersion
  );
  invariant(
    publication,
    `${reviewId}@${reviewVersion} publication is missing.`
  );
  const referenceIndex = readJson(
    path.join(repoRoot, "public", "review-data", reviewId, "index.json"),
    `${reviewId} reference index`
  );
  const referenceIndexEntry = referenceIndex.versions?.find(
    (candidate) => candidate.version === reviewVersion
  );
  invariant(
    referenceIndexEntry,
    `${reviewId}@${reviewVersion} reference index entry is missing.`
  );
  return {
    publicationConfig,
    publication,
    referenceIndex,
    referenceIndexEntry,
  };
}

function validateKnowledgePack({
  repoRoot,
  reviewId,
  reviewVersion,
  requireCurrentGenerator = false,
  publicationOverride,
  referenceIndexEntryOverride,
  knowledgeRootOverride,
}) {
  const context =
    publicationOverride && referenceIndexEntryOverride
      ? {
          publication: publicationOverride,
          referenceIndexEntry: referenceIndexEntryOverride,
        }
      : knowledgeContext(repoRoot, reviewId, reviewVersion);
  const versionRoot = path.join(
    repoRoot,
    "public",
    "review-data",
    reviewId,
    "versions",
    reviewVersion
  );
  const knowledgeRoot =
    knowledgeRootOverride ??
    knowledgeSourceRoot(repoRoot, reviewId, reviewVersion);
  const manifestPath = path.join(knowledgeRoot, "manifest.json");
  const manifest = readJson(
    manifestPath,
    `${reviewId}@${reviewVersion} knowledge manifest`
  );
  const referencePath = path.join(versionRoot, "reference-manifest.json");
  const reference = readJson(
    referencePath,
    `${reviewId}@${reviewVersion} reference manifest`
  );
  const editorial = loadEditorialRecords({
    repoRoot,
    reviewId,
    reviewVersion,
    sourceRepository: reference.source.repository,
    sourceCommit: reference.source.commit,
  });
  invariant(
    manifest.schemaVersion === KNOWLEDGE_MANIFEST_SCHEMA &&
      manifest.reviewId === reviewId &&
      manifest.reviewVersion === reviewVersion &&
      manifest.source?.repository === reference.source.repository &&
      manifest.source?.commit === reference.source.commit &&
      manifest.source?.tree === reference.source.tree &&
      manifest.reference?.manifestPath ===
        context.referenceIndexEntry.bundlePath &&
      manifest.reference?.manifestSha256 === fileSha256(referencePath) &&
      manifest.reference?.bundleSha256 === reference.generator.outputSha256 &&
      manifest.editorial?.manifestSha256 === editorial.manifestSha256 &&
      manifest.editorial?.corpusSha256 === editorial.identitySha256 &&
      manifest.publication?.lifecycleState ===
        context.publication.lifecycleState &&
      manifest.publication?.deploymentStatus ===
        context.publication.deploymentStatus &&
      manifest.publication?.auditStatus === context.publication.auditStatus,
    `${reviewId}@${reviewVersion} knowledge identity drifted.`
  );
  invariant(
    Array.isArray(manifest.recordShards),
    `${reviewId}@${reviewVersion} knowledge manifest record shards are invalid.`
  );
  invariant(
    manifest.knowledgeSha256 === knowledgeSemanticIdentity(manifest),
    `${reviewId}@${reviewVersion} knowledge semantic checksum drifted.`
  );
  invariant(
    !requireCurrentGenerator ||
      (manifest.generator?.name === GENERATOR_NAME &&
        manifest.generator?.version === GENERATOR_VERSION &&
        manifest.generator?.sourceSha256 === generatorSourceSha256()),
    `${reviewId}@${reviewVersion} knowledge generator drifted; advance the review version and regenerate.`
  );

  const publicPrefix = `/review-data/${reviewId}/versions/${reviewVersion}/knowledge`;
  const searchRelative = publicPathToRelative(
    manifest.searchIndex?.path,
    publicPrefix,
    "Knowledge search index"
  );
  const searchPath = resolveContainedPath(
    knowledgeRoot,
    searchRelative,
    "Knowledge search index"
  );
  invariant(
    fileSha256(searchPath) === manifest.searchIndex.sha256,
    `${reviewId}@${reviewVersion} knowledge search-index checksum drifted.`
  );
  const searchIndex = readJson(searchPath, "knowledge search index");
  invariant(
    searchIndex.schemaVersion === KNOWLEDGE_INDEX_SCHEMA &&
      searchIndex.reviewId === reviewId &&
      searchIndex.reviewVersion === reviewVersion &&
      searchIndex.referenceBundleSha256 === reference.generator.outputSha256 &&
      Array.isArray(searchIndex.records) &&
      searchIndex.records.length === manifest.searchIndex.recordCount,
    `${reviewId}@${reviewVersion} knowledge search index is invalid.`
  );

  const expectedPaths = new Set(["manifest.json", searchRelative]);
  const shardRecords = [];
  for (const [index, shardEntry] of manifest.recordShards.entries()) {
    invariant(
      shardEntry !== null &&
        typeof shardEntry === "object" &&
        !Array.isArray(shardEntry),
      `${reviewId}@${reviewVersion} knowledge shard ${index} manifest entry is invalid.`
    );
    const relativePath = publicPathToRelative(
      shardEntry.path,
      publicPrefix,
      `Knowledge shard ${index}`
    );
    expectedPaths.add(relativePath);
    const shardPath = resolveContainedPath(
      knowledgeRoot,
      relativePath,
      `Knowledge shard ${index}`
    );
    invariant(
      fileSha256(shardPath) === shardEntry.sha256,
      `${reviewId}@${reviewVersion} knowledge shard ${index} checksum drifted.`
    );
    const shard = readJson(shardPath, `knowledge shard ${index}`);
    invariant(
      shard.schemaVersion === KNOWLEDGE_SHARD_SCHEMA &&
        shard.reviewId === reviewId &&
        shard.reviewVersion === reviewVersion &&
        shard.shard === index &&
        Array.isArray(shard.records) &&
        shard.records.length === shardEntry.recordCount,
      `${reviewId}@${reviewVersion} knowledge shard ${index} is invalid.`
    );
    shardRecords.push(...shard.records);
  }
  const actualPaths = listFiles(knowledgeRoot).map((filePath) =>
    normalizeRelativePath(path.relative(knowledgeRoot, filePath))
  );
  invariant(
    stableJson(actualPaths.sort(compareStrings)) ===
      stableJson([...expectedPaths].sort(compareStrings)),
    `${reviewId}@${reviewVersion} knowledge file set drifted.`
  );
  const searchIds = searchIndex.records.map((record) => record.id);
  const shardIds = shardRecords.map((record) => record.id);
  invariant(
    new Set(searchIds).size === searchIds.length &&
      new Set(shardIds).size === shardIds.length &&
      stableJson([...searchIds].sort(compareStrings)) ===
        stableJson([...shardIds].sort(compareStrings)) &&
      manifest.counts?.total === searchIds.length,
    `${reviewId}@${reviewVersion} knowledge record inventory drifted.`
  );
  const technicalIds = new Set(
    searchIndex.records
      .filter((record) => record.id.startsWith("declaration:"))
      .map((record) => record.id.slice("declaration:".length))
  );
  for (const declaration of reference.declarationIndex ?? []) {
    invariant(
      technicalIds.has(declaration.id),
      `${reviewId}@${reviewVersion} declaration ${declaration.id} is absent from knowledge.`
    );
  }
  for (const declaration of (reference.declarationIndex ?? []).filter(
    (candidate) =>
      candidate.scope === "protocol" &&
      candidate.kind === "function" &&
      candidate.canonicalSignature
  )) {
    const record = searchIndex.records.find(
      (candidate) => candidate.id === `declaration:${declaration.id}`
    );
    invariant(
      record?.signature === declaration.canonicalSignature,
      `${reviewId}@${reviewVersion} protocol callable ${declaration.canonicalSignature} lacks an exact key.`
    );
  }
  return { manifest, searchIndex, records: shardRecords };
}

function generateKnowledgePacks({
  repoRoot = REPOSITORY_ROOT,
  reviewId = DEFAULT_REVIEW_ID,
  checkOnly = false,
  refreshRetained = false,
  writeOutput = process.stdout.write.bind(process.stdout),
} = {}) {
  const context = knowledgeContext(
    repoRoot,
    reviewId,
    readJson(
      path.join(repoRoot, "public", "review-data", reviewId, "index.json"),
      `${reviewId} reference index`
    ).activeVersion
  );
  invariant(
    context.publicationConfig.schemaVersion ===
      "public-review.publication.v2" &&
      context.publicationConfig.reviewId === reviewId &&
      context.publicationConfig.versions.length ===
        context.referenceIndex.versions.length,
    `${reviewId} publication and reference indexes drifted.`
  );
  const orderedVersions = context.referenceIndex.versions.map(
    (entry) => entry.version
  );
  invariant(
    stableJson(orderedVersions) ===
      stableJson([...orderedVersions].sort(compareReviewVersions)),
    `${reviewId} reference versions are not ordered.`
  );

  for (const entry of context.referenceIndex.versions) {
    const publication = context.publicationConfig.versions.find(
      (candidate) => candidate.version === entry.version
    );
    invariant(
      publication,
      `${reviewId}@${entry.version} publication is missing.`
    );
    const knowledgeRoot = knowledgeSourceRoot(
      repoRoot,
      reviewId,
      entry.version
    );
    const active = entry.version === context.referenceIndex.activeVersion;
    if (!fs.existsSync(knowledgeRoot)) {
      invariant(
        !checkOnly,
        `${reviewId}@${entry.version} knowledge pack is missing; regenerate.`
      );
      const pack = buildKnowledgePack({
        repoRoot,
        reviewId,
        reviewVersion: entry.version,
        publication,
        referenceIndexEntry: entry,
      });
      writePackAtomically(pack, knowledgeRoot);
    } else if ((active || refreshRetained) && !checkOnly) {
      const pack = buildKnowledgePack({
        repoRoot,
        reviewId,
        reviewVersion: entry.version,
        publication,
        referenceIndexEntry: entry,
      });
      try {
        assertFileMapEquals(
          expectedFileMap(pack, knowledgeRoot),
          knowledgeRoot,
          `${reviewId}@${entry.version} knowledge pack`
        );
      } catch (error) {
        if (!(error instanceof KnowledgePackDriftError)) {
          throw error;
        }
        writePackAtomically(pack, knowledgeRoot, { replace: true });
      }
    }
    validateKnowledgePack({
      repoRoot,
      reviewId,
      reviewVersion: entry.version,
      requireCurrentGenerator: active,
    });
    if (active) {
      const expectedPack = buildKnowledgePack({
        repoRoot,
        reviewId,
        reviewVersion: entry.version,
        publication,
        referenceIndexEntry: entry,
      });
      assertFileMapEquals(
        expectedFileMap(expectedPack, knowledgeRoot),
        knowledgeRoot,
        `${reviewId}@${entry.version} knowledge pack`
      );
    }
  }
  writeOutput(
    `${checkOnly ? "Verified" : "Generated"} ${
      context.referenceIndex.versions.length
    } Stream knowledge pack(s) offline.\n`
  );
}

function main(argv = process.argv.slice(2)) {
  try {
    let checkOnly = false;
    let refreshRetained = false;
    let reviewId = DEFAULT_REVIEW_ID;
    for (let index = 0; index < argv.length; index += 1) {
      if (argv[index] === "--check") {
        checkOnly = true;
      } else if (argv[index] === "--refresh-retained") {
        refreshRetained = true;
      } else if (argv[index] === "--review-id") {
        reviewId = argv[index + 1];
        index += 1;
      } else {
        throw new Error(`Unknown argument: ${argv[index]}`);
      }
    }
    generateKnowledgePacks({
      reviewId,
      checkOnly,
      refreshRetained,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  GENERATOR_NAME,
  GENERATOR_VERSION,
  KNOWLEDGE_INDEX_SCHEMA,
  KNOWLEDGE_MANIFEST_SCHEMA,
  KNOWLEDGE_SHARD_SCHEMA,
  KNOWLEDGE_SOURCE_DIRECTORY,
  buildKnowledgePack,
  generateKnowledgePacks,
  generatorSourceSha256,
  headingId,
  knowledgeSourceRoot,
  splitEditorialPage,
  validateKnowledgePack,
};
