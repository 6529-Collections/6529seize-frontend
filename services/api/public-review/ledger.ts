import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiDropMetadataV2 } from "@/generated/models/ApiDropMetadataV2";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import {
  decodePublicReviewFeedbackMetadata,
  hasPublicReviewMetadata,
} from "./feedback-codec";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewFeedbackRecord,
  PublicReviewLedgerFilters,
  PublicReviewLedgerPage,
  PublicReviewLedgerWarning,
} from "./types";

export const PUBLIC_REVIEW_LEDGER_PAGE_SIZE = 50;

export interface PublicReviewLedgerApi {
  readonly fetchFeed: (input: {
    readonly cursor: number | null;
    readonly limit: number;
    readonly signal?: AbortSignal | undefined;
    readonly waveId: string;
  }) => Promise<ApiWaveDropsFeedV2>;
  readonly fetchMetadata: (input: {
    readonly dropId: string;
    readonly signal?: AbortSignal | undefined;
  }) => Promise<readonly ApiDropMetadataV2[]>;
}

const DEFAULT_LEDGER_API: PublicReviewLedgerApi = {
  fetchFeed: ({ cursor, limit, signal, waveId }) =>
    commonApiFetch<ApiWaveDropsFeedV2>({
      endpoint: `v2/waves/${encodeURIComponent(waveId)}/drops`,
      params: {
        limit: `${limit}`,
        drop_type: ApiDropMainType.Chat,
        ...(cursor === null
          ? {}
          : {
              serial_no_limit: `${cursor}`,
              search_strategy: ApiDropSearchStrategy.Older,
            }),
      },
      signal,
      errorMode: "structured",
    }),
  fetchMetadata: ({ dropId, signal }) =>
    commonApiFetch<ApiDropMetadataV2[]>({
      endpoint: `v2/drops/${encodeURIComponent(dropId)}/metadata`,
      signal,
      errorMode: "structured",
    }),
};

export function getPublicReviewLedgerQueryKey({
  config,
  destination,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
}) {
  return [
    QueryKey.PUBLIC_REVIEW_LEDGER,
    {
      environment: destination.environment,
      waveId: destination.waveId,
      reviewId: config.reviewId,
      reviewVersion: config.reviewVersion,
    },
  ] as const;
}

function getNextRawCursor(
  drops: readonly ApiDropV2[],
  limit: number
): number | null {
  if (drops.length < limit) {
    return null;
  }

  const serialNumbers = drops.map((drop) => drop.serial_no);
  if (
    serialNumbers.some(
      (serialNo) => !Number.isSafeInteger(serialNo) || serialNo < 1
    )
  ) {
    throw new Error("The Wave feed returned an invalid raw pagination cursor.");
  }
  return Math.min(...serialNumbers);
}

function getReactionCount(drop: ApiDropV2): number {
  return (drop.reactions ?? []).reduce(
    (total, reaction) => total + Math.max(0, reaction.count),
    0
  );
}

function projectFeedbackRecord({
  config,
  destination,
  drop,
  metadata,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly drop: ApiDropV2;
  readonly metadata: readonly ApiDropMetadataV2[];
}): PublicReviewFeedbackRecord | null {
  const decoded = decodePublicReviewFeedbackMetadata({ config, metadata });
  if (!decoded.ok) {
    return null;
  }

  return {
    feedbackId: decoded.value.context.submissionId,
    dropId: drop.id,
    serialNo: drop.serial_no,
    destination,
    reviewId: config.reviewId,
    reviewVersion: config.reviewVersion,
    category: decoded.value.category,
    severity: decoded.value.severity,
    pageId: decoded.value.context.pageId,
    ...(decoded.value.context.sectionId
      ? { sectionId: decoded.value.context.sectionId }
      : {}),
    ...(decoded.value.context.reference
      ? { reference: decoded.value.context.reference }
      : {}),
    author: {
      id: drop.author.id,
      handle: drop.author.handle ?? null,
      pfp: drop.author.pfp ?? null,
    },
    createdAt: drop.created_at,
    body: drop.content ?? "",
    reactionsCount: getReactionCount(drop),
    disposition: "NEW",
    discussionPath: getWaveRoute({
      waveId: destination.waveId,
      serialNo: drop.serial_no,
      isDirectMessage: false,
      isApp: false,
    }),
  };
}

async function hydrateLedgerDrop({
  api,
  config,
  destination,
  drop,
  signal,
}: {
  readonly api: PublicReviewLedgerApi;
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly drop: ApiDropV2;
  readonly signal?: AbortSignal | undefined;
}): Promise<
  | {
      readonly kind: "record";
      readonly record: PublicReviewFeedbackRecord | null;
      readonly metadata: readonly ApiDropMetadataV2[];
    }
  | { readonly kind: "failure" }
> {
  try {
    const metadata = await api.fetchMetadata({ dropId: drop.id, signal });
    return {
      kind: "record",
      metadata,
      record: projectFeedbackRecord({
        config,
        destination,
        drop,
        metadata,
      }),
    };
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return { kind: "failure" };
  }
}

export async function fetchPublicReviewLedgerPage({
  api = DEFAULT_LEDGER_API,
  config,
  cursor = null,
  destination,
  limit = PUBLIC_REVIEW_LEDGER_PAGE_SIZE,
  signal,
}: {
  readonly api?: PublicReviewLedgerApi | undefined;
  readonly config: PublicReviewFeedbackConfig;
  readonly cursor?: number | null | undefined;
  readonly destination: PublicReviewDiscussionDestination;
  readonly limit?: number | undefined;
  readonly signal?: AbortSignal | undefined;
}): Promise<PublicReviewLedgerPage> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
    throw new Error(
      "Public review ledger page size must be between 1 and 200."
    );
  }
  if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 1)) {
    throw new Error("Public review ledger cursor is invalid.");
  }

  const feed = await api.fetchFeed({
    cursor,
    limit,
    signal,
    waveId: destination.waveId,
  });
  if (feed.wave.id !== destination.waveId) {
    throw new Error(
      "The Wave feed does not match this environment's review destination."
    );
  }

  const candidateDrops = feed.drops.filter(
    (drop) =>
      drop.drop_type === ApiDropMainType.Chat &&
      drop.reply_to_drop === undefined
  );
  const hydrated = await Promise.all(
    candidateDrops.map((drop) =>
      hydrateLedgerDrop({
        api,
        config,
        destination,
        drop,
        signal,
      })
    )
  );
  const records: PublicReviewFeedbackRecord[] = [];
  const warnings: PublicReviewLedgerWarning[] = [];

  hydrated.forEach((result, index) => {
    const drop = candidateDrops[index]!;
    if (result.kind === "failure") {
      warnings.push({
        code: "METADATA_HYDRATION_FAILED",
        dropId: drop.id,
      });
      return;
    }
    if (result.record) {
      records.push(result.record);
      return;
    }
    if (hasPublicReviewMetadata(result.metadata)) {
      warnings.push({ code: "INVALID_REVIEW_METADATA", dropId: drop.id });
    }
  });

  return {
    destination,
    records,
    warnings,
    nextCursor: getNextRawCursor(feed.drops, limit),
    rawDropCount: feed.drops.length,
  };
}

export function filterPublicReviewLedgerRecords({
  filters,
  records,
}: {
  readonly filters: PublicReviewLedgerFilters;
  readonly records: readonly PublicReviewFeedbackRecord[];
}): PublicReviewFeedbackRecord[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return records.filter((record) => {
    if (filters.category && record.category !== filters.category) {
      return false;
    }
    if (filters.pageId && record.pageId !== filters.pageId) {
      return false;
    }
    if (filters.severity && record.severity !== filters.severity) {
      return false;
    }
    if (filters.disposition && record.disposition !== filters.disposition) {
      return false;
    }
    if (
      filters.contract &&
      (record.reference?.kind !== "code" ||
        record.reference.contract !== filters.contract)
    ) {
      return false;
    }
    if (!search) {
      return true;
    }

    const searchableValues = [
      record.body,
      record.author.handle ?? "",
      record.pageId,
      record.sectionId ?? "",
      record.reference?.kind === "code" ? record.reference.path : "",
      record.reference?.kind === "code"
        ? (record.reference.contract ?? "")
        : "",
    ];
    return searchableValues.some((value) =>
      value.toLocaleLowerCase().includes(search)
    );
  });
}

export function dedupePublicReviewLedgerRecords(
  records: readonly PublicReviewFeedbackRecord[]
): PublicReviewFeedbackRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.feedbackId)) {
      return false;
    }
    seen.add(record.feedbackId);
    return true;
  });
}
