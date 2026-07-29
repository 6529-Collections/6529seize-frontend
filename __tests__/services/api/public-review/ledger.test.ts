import type { ApiDropMetadataV2 } from "@/generated/models/ApiDropMetadataV2";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import {
  encodePublicReviewFeedback,
  PUBLIC_REVIEW_METADATA_KEYS,
} from "@/services/api/public-review/feedback-codec";
import {
  dedupePublicReviewLedgerRecords,
  fetchPublicReviewLedgerPage,
  filterPublicReviewLedgerRecords,
  getPublicReviewLedgerQueryKey,
  type PublicReviewLedgerApi,
} from "@/services/api/public-review/ledger";
import {
  PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
  PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
  PUBLIC_REVIEW_INITIAL_VERSION,
  type PublicReviewDiscussionDestination,
  type PublicReviewFeedbackConfig,
  type PublicReviewFeedbackRecord,
} from "@/services/api/public-review/types";

const destination: PublicReviewDiscussionDestination = {
  logicalKey: "stream-review",
  environment: "staging",
  waveId: "22222222-2222-4222-8222-222222222222",
};

const config: PublicReviewFeedbackConfig = {
  reviewId: "stream-contract",
  reviewVersion: PUBLIC_REVIEW_INITIAL_VERSION,
  reviewTitle: "Stream Contract",
  feedbackSchemaVersion: PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
  submissionsOpen: true,
  acceptsPublicExploitReports: true,
  categories: [
    { value: "security", label: "Security" },
    {
      value: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
      label: "Possible exploitable security vulnerability",
    },
  ],
  severityOptions: [{ value: "critical", label: "Critical" }],
  pages: [{ value: "architecture", label: "Architecture" }],
};

function makeDrop(serialNo: number, id = `drop-${serialNo}`): ApiDropV2 {
  return {
    id,
    serial_no: serialNo,
    created_at: 1_700_000_000_000 + serialNo,
    is_signed: false,
    hide_link_preview: false,
    parts_count: 1,
    author: {
      id: "author-1",
      handle: "reviewer",
      pfp: null,
    },
    drop_type: ApiDropMainType.Chat,
    reactions: [{ reaction: "👍", count: 3 }],
    boosts: 0,
    content: "Rendered feedback",
  } as unknown as ApiDropV2;
}

function makeFeed(drops: ApiDropV2[]): ApiWaveDropsFeedV2 {
  return {
    wave: { id: destination.waveId },
    drops,
  } as ApiWaveDropsFeedV2;
}

function makeMetadata(): ApiDropMetadataV2[] {
  const payload = encodePublicReviewFeedback({
    config,
    destination,
    draft: {
      category: "security",
      severity: "critical",
      comment: "Check the invariant.",
      whyItMatters: "",
      suggestedChange: "",
      preconditions: "",
      expectedBehavior: "",
      observedBehavior: "",
      reproduction: "",
    },
    page: {
      pageId: "architecture",
      pageTitle: "Architecture",
      canonicalPath: "/stream/review/architecture",
    },
    signer: {
      address: "0x000000000000000000000000000000000000dEaD",
      isSafeWallet: false,
    },
    submissionId: "44444444-4444-4444-8444-444444444444",
  });
  return payload.metadata;
}

function makeApi({
  drops,
  metadata,
}: {
  readonly drops: ApiDropV2[];
  readonly metadata: (dropId: string) => Promise<ApiDropMetadataV2[]>;
}): PublicReviewLedgerApi {
  return {
    fetchFeed: jest.fn().mockResolvedValue(makeFeed(drops)),
    fetchMetadata: jest.fn(({ dropId }) => metadata(dropId)),
  };
}

describe("public review ledger projection", () => {
  it("advances from the minimum raw cursor when no raw drops project", async () => {
    const api = makeApi({
      drops: [makeDrop(100), makeDrop(99)],
      metadata: async () => [],
    });

    const page = await fetchPublicReviewLedgerPage({
      api,
      config,
      destination,
      limit: 2,
    });

    expect(page.records).toEqual([]);
    expect(page.nextCursor).toBe(99);
    expect(page.rawDropCount).toBe(2);
  });

  it("warns and omits failures to hydrate full metadata", async () => {
    const api = makeApi({
      drops: [makeDrop(100)],
      metadata: async () => {
        throw new Error("metadata unavailable");
      },
    });

    const page = await fetchPublicReviewLedgerPage({
      api,
      config,
      destination,
    });

    expect(page.records).toEqual([]);
    expect(page.warnings).toEqual([
      { code: "METADATA_HYDRATION_FAILED", dropId: "drop-100" },
    ]);
  });

  it("warns for review-shaped metadata that is not canonical", async () => {
    const metadata = makeMetadata();
    metadata[0] = {
      data_key: PUBLIC_REVIEW_METADATA_KEYS[0],
      data_value: "unsupported-schema",
    };
    const api = makeApi({
      drops: [makeDrop(100)],
      metadata: async () => metadata,
    });

    const page = await fetchPublicReviewLedgerPage({
      api,
      config,
      destination,
    });

    expect(page.records).toEqual([]);
    expect(page.warnings).toEqual([
      { code: "INVALID_REVIEW_METADATA", dropId: "drop-100" },
    ]);
  });

  it("projects valid feedback with deterministic NEW disposition", async () => {
    const api = makeApi({
      drops: [makeDrop(100)],
      metadata: async () => makeMetadata(),
    });

    const page = await fetchPublicReviewLedgerPage({
      api,
      config,
      destination,
    });

    expect(page.records).toHaveLength(1);
    expect(page.records[0]).toMatchObject({
      feedbackId: "44444444-4444-4444-8444-444444444444",
      serialNo: 100,
      category: "security",
      severity: "critical",
      pageId: "architecture",
      reactionsCount: 3,
      disposition: "NEW",
    });
    expect(page.records[0]!.discussionPath).toContain("serialNo=100");
  });

  it("treats a null reply marker as top-level and excludes actual replies", async () => {
    const topLevelDrop = {
      ...makeDrop(100),
      reply_to_drop: null,
    } as unknown as ApiDropV2;
    const replyDrop = {
      ...makeDrop(99),
      reply_to_drop: { drop_id: "drop-100" },
    } as unknown as ApiDropV2;
    const api = makeApi({
      drops: [topLevelDrop, replyDrop],
      metadata: async () => makeMetadata(),
    });

    const page = await fetchPublicReviewLedgerPage({
      api,
      config,
      destination,
    });

    expect(page.records.map((record) => record.serialNo)).toEqual([100]);
    expect(api.fetchMetadata).toHaveBeenCalledTimes(1);
    expect(api.fetchMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ dropId: "drop-100" })
    );
  });

  it("ignores malformed reaction counts", async () => {
    const drop = {
      ...makeDrop(100),
      reactions: [
        { reaction: "valid", count: 4 },
        { reaction: "negative", count: -3 },
        { reaction: "fractional", count: 1.5 },
        { reaction: "not-a-number", count: Number.NaN },
      ],
    } as ApiDropV2;
    const api = makeApi({
      drops: [drop],
      metadata: async () => makeMetadata(),
    });

    const page = await fetchPublicReviewLedgerPage({
      api,
      config,
      destination,
    });

    expect(page.records[0]?.reactionsCount).toBe(4);
  });

  it("rejects a raw feed from a different Wave", async () => {
    const api = makeApi({
      drops: [],
      metadata: async () => [],
    });
    (api.fetchFeed as jest.Mock).mockResolvedValue({
      wave: { id: "33333333-3333-4333-8333-333333333333" },
      drops: [],
    });

    await expect(
      fetchPublicReviewLedgerPage({ api, config, destination })
    ).rejects.toThrow("does not match");
  });

  it("partitions query keys by environment, Wave, review, and version", () => {
    const stagingKey = getPublicReviewLedgerQueryKey({
      config,
      destination,
    });
    const productionKey = getPublicReviewLedgerQueryKey({
      config,
      destination: {
        ...destination,
        environment: "production",
        waveId: "33333333-3333-4333-8333-333333333333",
      },
    });

    expect(stagingKey).not.toEqual(productionKey);
    expect(JSON.stringify(stagingKey)).toContain("2026-07-26.1");
  });

  it("partitions query keys by raw Wave page size", () => {
    const compactKey = getPublicReviewLedgerQueryKey({
      config,
      destination,
      pageSize: 25,
    });
    const fullKey = getPublicReviewLedgerQueryKey({
      config,
      destination,
      pageSize: 50,
    });

    expect(compactKey).not.toEqual(fullKey);
  });

  it("filters loaded records and deduplicates immutable drop IDs", () => {
    const record = {
      feedbackId: "feedback-1",
      dropId: "drop-1",
      category: "security",
      severity: "critical",
      pageId: "architecture",
      disposition: "NEW",
      body: "Withdrawal invariant",
      author: { handle: "reviewer" },
    } as PublicReviewFeedbackRecord;

    expect(
      filterPublicReviewLedgerRecords({
        records: [record],
        filters: {
          category: "security",
          severity: "",
          pageId: "",
          contract: "",
          disposition: "NEW",
          search: "withdrawal",
        },
      })
    ).toEqual([record]);
    expect(dedupePublicReviewLedgerRecords([record, record])).toEqual([record]);
  });

  it("retains separate drops that reuse a client-authored submission ID", () => {
    const first = {
      feedbackId: "copied-submission-id",
      dropId: "drop-1",
    } as PublicReviewFeedbackRecord;
    const second = {
      feedbackId: "copied-submission-id",
      dropId: "drop-2",
    } as PublicReviewFeedbackRecord;

    expect(dedupePublicReviewLedgerRecords([first, second])).toEqual([
      first,
      second,
    ]);
  });

  it("bounds concurrent metadata hydration", async () => {
    let activeRequests = 0;
    let maximumConcurrentRequests = 0;
    const drops = Array.from({ length: 18 }, (_, index) =>
      makeDrop(100 - index)
    );
    const api = makeApi({
      drops,
      metadata: async () => {
        activeRequests += 1;
        maximumConcurrentRequests = Math.max(
          maximumConcurrentRequests,
          activeRequests
        );
        await Promise.resolve();
        activeRequests -= 1;
        return makeMetadata();
      },
    });

    await fetchPublicReviewLedgerPage({ api, config, destination });

    expect(maximumConcurrentRequests).toBeLessThanOrEqual(8);
  });
});
