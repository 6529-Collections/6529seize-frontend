"use strict";

const fs = require("node:fs");
const path = require("node:path");
const corrections = require("../../lib/public-review/streamReviewEditorialCorrections.json");
const messages = require("../../i18n/messages/public-review-corrections.json");
const development = require("../../i18n/messages/public-review-development-current.json");
const { sha256Urn, stableJson } = require("./solidity-reference-lib.cjs");
const {
  knowledgeSourceRoot,
  splitEditorialPage,
  validateKnowledgePack,
} = require("./stream-knowledge.cjs");

/** Stops packaging if a correction no longer describes its pinned source. */
function invariant(condition, message) {
  if (!condition) throw new Error(`Stream current knowledge: ${message}`);
}

/** Encodes search and shard files using the saved pack's canonical JSON format. */
function compactBuffer(value) {
  return Buffer.from(`${JSON.stringify(JSON.parse(stableJson(value)))}\n`);
}

/** Rebuilds corrected sections with their saved record IDs and relationships. */
function correctedEditorialRecords(repoRoot, sourceRecords) {
  const editorialRoot = path.join(
    repoRoot,
    "content/public-reviews",
    corrections.reviewId,
    "versions",
    corrections.reviewVersion,
    "editorial"
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(editorialRoot, "manifest.json"), "utf8")
  );
  const recordsById = new Map(
    sourceRecords.map((record) => [record.id, record])
  );
  const replacements = new Map();
  for (const [pageId, correction] of Object.entries(corrections.pages)) {
    const page = manifest.pages.find((entry) => entry.id === pageId);
    invariant(page?.file === `${pageId}.md`, `Missing pinned page ${pageId}.`);
    const markdown = fs.readFileSync(
      path.join(editorialRoot, page.file),
      "utf8"
    );
    invariant(
      sha256Urn(markdown) === `sha256:${correction.sha256}`,
      `Saved editorial changed: ${pageId}.`
    );
    let corrected = markdown;
    for (const [original, key] of correction.replacements) {
      invariant(
        typeof messages[key] === "string" &&
          corrected.split(original).length === 2,
        `Required replacement changed: ${pageId}/${key}.`
      );
      corrected = corrected.replace(original, () => messages[key]);
    }
    const splitOptions = {
      page,
      reviewId: corrections.reviewId,
      reviewVersion: corrections.reviewVersion,
      sourceCommit: corrections.source.commit,
    };
    const savedSections = splitEditorialPage({ ...splitOptions, markdown });
    const currentSections = splitEditorialPage({
      ...splitOptions,
      markdown: corrected,
    });
    invariant(
      savedSections.length === currentSections.length,
      `Section structure changed: ${pageId}.`
    );
    currentSections.forEach((section, index) => {
      const saved = savedSections[index];
      const source = recordsById.get(saved.id);
      invariant(
        source?.text === saved.text,
        `Saved knowledge differs from editorial: ${saved.id}.`
      );
      // Current entry guides can use different headings. Link to the page;
      // keep the saved section identity for technical-record relationships.
      replacements.set(saved.id, {
        ...section,
        id: saved.id,
        exactKeys: source.exactKeys,
        canonicalPath: `/reviews/${corrections.reviewId}${
          pageId === "overview" ? "" : `/${pageId}`
        }`,
        provenance: {
          ...section.provenance,
          view: "current",
          savedRecordId: saved.id,
          savedCanonicalPath: source.canonicalPath,
        },
        relationships: source.relationships,
      });
    });
  }
  return replacements;
}

/** Uses the launch card's current wording without claiming new source evidence. */
function correctedDevelopmentRecord(source) {
  invariant(source?.structured, "Missing active development status.");
  const saved = source.structured;
  const requirements = saved.evidenceSummary.requirements;
  const headline = `${development["publicReview.development.heading"]} ${development["publicReview.development.answer"]}`;
  const summary = development["publicReview.development.summary"];
  const beforeLaunch = ["connections", "audit", "liveTesting", "launchSetup"]
    .map((id) => ({
      id,
      text: development[`publicReview.development.beforeLaunch.${id}`],
    }))
    .concat(saved.beforeLaunch);
  const text = [
    headline,
    summary,
    `Checked ${saved.checkedAt}.`,
    `Evidence checklist: ${requirements.complete} complete, ${requirements.pending} pending, ${requirements.missing} missing requirements.`,
    `${saved.evidenceSummary.openReleaseBlockers} open release blockers in the saved risk register.`,
    ...saved.recentlyCompleted.map((item) => item.text),
    ...saved.workingOn.map((item) => item.text),
    ...beforeLaunch.map((item) => item.text),
  ].join(" ");
  return {
    ...source,
    summary: text,
    structured: {
      ...source.structured,
      headline,
      summary,
      beforeLaunch,
    },
    provenance: { ...source.provenance, view: "current" },
    searchText: text,
  };
}

/**
 * Returns only the active pack's corrected files. Saved source packs and older
 * published versions remain byte-for-byte unchanged. Existing consumer URLs,
 * record IDs, and technical evidence are retained; the new checksum expires
 * the Help Bot's cached evidence. Source and correction drift fail closed.
 */
function getStreamCurrentKnowledgeFiles({
  repoRoot,
  reviewId,
  reviewVersion,
  activeVersion,
}) {
  if (
    reviewId !== corrections.reviewId ||
    reviewVersion !== corrections.reviewVersion ||
    reviewVersion !== activeVersion
  ) {
    return new Map();
  }
  const pack = validateKnowledgePack({
    repoRoot,
    reviewId,
    reviewVersion,
    requireCurrentGenerator: true,
  });
  invariant(
    pack.manifest.source.repository === corrections.source.repository &&
      pack.manifest.source.commit === corrections.source.commit,
    "Source identity changed."
  );
  const replacements = correctedEditorialRecords(repoRoot, pack.records);
  const status = pack.records.find(
    (record) => record.id === "status:latest-development"
  );
  replacements.set(
    "status:latest-development",
    correctedDevelopmentRecord(status)
  );
  const root = knowledgeSourceRoot(repoRoot, reviewId, reviewVersion);
  const files = new Map();
  const manifest = structuredClone(pack.manifest);
  const matchedIds = new Set();
  manifest.recordShards.forEach((descriptor, index) => {
    const relativePath = `records/${String(index).padStart(3, "0")}.json`;
    const shard = JSON.parse(
      fs.readFileSync(path.join(root, relativePath), "utf8")
    );
    let changed = false;
    shard.records = shard.records.map((record) => {
      const replacement = replacements.get(record.id);
      if (!replacement) return record;
      changed = true;
      matchedIds.add(record.id);
      const { searchText: _searchText, ...content } = replacement;
      return content;
    });
    if (changed) {
      const buffer = compactBuffer(shard);
      files.set(relativePath, buffer);
      descriptor.sha256 = sha256Urn(buffer);
    }
  });
  invariant(
    matchedIds.size === replacements.size,
    "Correction records are missing."
  );
  const searchIndex = structuredClone(pack.searchIndex);
  searchIndex.records = searchIndex.records.map((record) => {
    const replacement = replacements.get(record.id);
    return replacement
      ? {
          ...record,
          title: replacement.title,
          name: replacement.name,
          aliases: replacement.aliases
            .filter((alias) => alias.length <= 160)
            .slice(0, 12),
          searchText: replacement.searchText,
        }
      : record;
  });
  const searchBuffer = compactBuffer(searchIndex);
  files.set("search-index.json", searchBuffer);
  manifest.searchIndex.sha256 = sha256Urn(searchBuffer);
  manifest.currentView = {
    sourceKnowledgeSha256: pack.manifest.knowledgeSha256,
    correctionsSha256: sha256Urn(
      stableJson({ corrections, messages, development })
    ),
    generatorSha256: sha256Urn(fs.readFileSync(__filename)),
    correctedRecordIds: [...replacements.keys()].sort(),
  };
  delete manifest.knowledgeSha256;
  manifest.knowledgeSha256 = sha256Urn(stableJson(manifest));
  files.set("manifest.json", Buffer.from(stableJson(manifest)));
  return files;
}

module.exports = { getStreamCurrentKnowledgeFiles };
