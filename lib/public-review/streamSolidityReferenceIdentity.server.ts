import "next/dist/compiled/server-only";

import streamReferenceConfig from "@/config/public-reviews/6529-stream.reference.json";
import { getPublicReviewLifecycleCapabilities } from "@/lib/public-review/publicReviewLifecycle";
import type { PublicReviewDefinition } from "@/lib/public-review/publicReviewTypes";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import {
  STREAM_REVIEW_VERSION_IDENTITIES,
  type StreamReviewVersionIdentity,
} from "@/lib/public-review/streamReviewPublication";
import type { SolidityReferenceReviewIdentity } from "@/lib/public-review/solidityReferenceTypes";

const SAFE_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SOURCE_COMMIT_PATTERN = /^[0-9a-f]{40}$/;

interface StreamSolidityReferenceConfig {
  readonly output: {
    readonly retainedVersions: readonly string[];
  };
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly source: {
    readonly commit: string;
    readonly repository: string;
  };
}

function invalidIdentity(): never {
  throw new Error("The Stream Solidity source-index identity is invalid.");
}

export function createStreamSolidityReferenceIdentity({
  referenceConfig,
  reviewDefinition,
  trustedVersions,
}: {
  readonly referenceConfig: StreamSolidityReferenceConfig;
  readonly reviewDefinition: PublicReviewDefinition;
  readonly trustedVersions: readonly StreamReviewVersionIdentity[];
}): SolidityReferenceReviewIdentity {
  const retainedVersions = referenceConfig.output.retainedVersions;
  if (
    referenceConfig.reviewId !== STREAM_REVIEW_SLUG ||
    !SAFE_VERSION_PATTERN.test(referenceConfig.reviewVersion) ||
    !SOURCE_COMMIT_PATTERN.test(referenceConfig.source.commit) ||
    retainedVersions.length === 0 ||
    retainedVersions.some(
      (version) =>
        typeof version !== "string" || !SAFE_VERSION_PATTERN.test(version)
    ) ||
    new Set(retainedVersions).size !== retainedVersions.length ||
    trustedVersions.length !== retainedVersions.length
  ) {
    invalidIdentity();
  }

  const trustedSourceCommits: Record<string, string> = {};
  for (const [index, identity] of trustedVersions.entries()) {
    if (
      identity.version !== retainedVersions[index] ||
      !SAFE_VERSION_PATTERN.test(identity.version) ||
      !SOURCE_COMMIT_PATTERN.test(identity.sourceCommit) ||
      trustedSourceCommits[identity.version] !== undefined
    ) {
      invalidIdentity();
    }
    trustedSourceCommits[identity.version] = identity.sourceCommit;
  }

  if (
    !retainedVersions.includes(referenceConfig.reviewVersion) ||
    trustedSourceCommits[referenceConfig.reviewVersion] !==
      referenceConfig.source.commit ||
    reviewDefinition.slug !== referenceConfig.reviewId ||
    reviewDefinition.versions.length === 0
  ) {
    invalidIdentity();
  }

  const seenReviewVersions = new Set<string>();
  for (const candidate of reviewDefinition.versions) {
    if (
      seenReviewVersions.has(candidate.version) ||
      candidate.source.repository !== referenceConfig.source.repository ||
      trustedSourceCommits[candidate.version] !== candidate.source.commit
    ) {
      invalidIdentity();
    }
    seenReviewVersions.add(candidate.version);
  }

  const activeStreamReviewVersion = reviewDefinition.versions.find(
    (candidate) => candidate.version === reviewDefinition.activeVersion
  );
  if (!activeStreamReviewVersion) {
    invalidIdentity();
  }

  const publiclyAvailableStreamReviewVersions =
    reviewDefinition.versions.filter(
      (candidate) =>
        getPublicReviewLifecycleCapabilities(candidate.status)
          .publicRoutesAvailable
    );
  const referenceActiveStreamReviewVersion =
    publiclyAvailableStreamReviewVersions.find(
      (candidate) => candidate.version === reviewDefinition.activeVersion
    ) ??
    publiclyAvailableStreamReviewVersions.at(-1) ??
    activeStreamReviewVersion;

  return Object.freeze({
    activeSourceCommit: referenceActiveStreamReviewVersion.source.commit,
    activeVersion: referenceActiveStreamReviewVersion.version,
    availableVersions: Object.freeze(
      publiclyAvailableStreamReviewVersions.map(
        (candidate) => candidate.version
      )
    ),
    reviewId: reviewDefinition.slug,
    sourceCommits: Object.freeze(trustedSourceCommits),
    sourceIndexActiveVersion: referenceConfig.reviewVersion,
    sourceIndexAvailableVersions: Object.freeze([...retainedVersions]),
    sourceRepository: referenceConfig.source.repository,
  });
}

export const STREAM_SOLIDITY_REFERENCE_IDENTITY =
  createStreamSolidityReferenceIdentity({
    referenceConfig: streamReferenceConfig,
    reviewDefinition: STREAM_REVIEW_DEFINITION,
    trustedVersions: STREAM_REVIEW_VERSION_IDENTITIES,
  });
