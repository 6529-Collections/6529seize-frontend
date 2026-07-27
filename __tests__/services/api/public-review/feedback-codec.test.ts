import {
  decodePublicReviewFeedbackMetadata,
  encodePublicReviewFeedback,
  getPublicReviewFeedbackPrimaryComment,
  hasPublicReviewMetadata,
  PUBLIC_REVIEW_METADATA_KEYS,
  PublicReviewFeedbackValidationError,
  validatePublicReviewFeedbackConfig,
} from "@/services/api/public-review/feedback-codec";
import {
  PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
  PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
  PUBLIC_REVIEW_INITIAL_VERSION,
  type PublicReviewDiscussionDestination,
  type PublicReviewFeedbackConfig,
  type PublicReviewFeedbackDraft,
} from "@/services/api/public-review/types";

const FILE_SHA = `sha256:${"a".repeat(64)}`;
const SNIPPET_SHA = `sha256:${"c".repeat(64)}`;
const COMMIT = "b".repeat(40);
const SUBMISSION_ID = "44444444-4444-4444-8444-444444444444";
const SIGNER_ADDRESS = "0x000000000000000000000000000000000000dEaD";

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
    { value: "documentation", label: "Documentation" },
  ],
  severityOptions: [
    { value: "critical", label: "Critical" },
    { value: "suggestion", label: "Suggestion" },
  ],
  pages: [
    {
      value: "architecture",
      label: "Architecture",
      sectionValues: ["storage"],
    },
  ],
  source: {
    repository: "6529-Collections/stream-contracts",
    commit: COMMIT,
    files: [
      {
        path: "src/Stream.sol",
        lineCount: 300,
        sha256: FILE_SHA,
      },
    ],
  },
};

const draft: PublicReviewFeedbackDraft = {
  category: "security",
  severity: "critical",
  comment: "The withdrawal invariant needs another explicit check.",
  whyItMatters: "A mismatch could strand funds.",
  suggestedChange: "",
  preconditions: "",
  expectedBehavior: "",
  observedBehavior: "",
  reproduction: "",
};

function encode(lineStart: string | number = "42") {
  return encodePublicReviewFeedback({
    config,
    destination,
    draft,
    page: {
      pageId: "architecture",
      pageTitle: "Architecture",
      canonicalPath: "/stream/review/architecture",
      sectionId: "storage",
      sectionTitle: "Storage",
    },
    referenceSelection: {
      kind: "code",
      path: "src/Stream.sol",
      sourceSha256: FILE_SHA,
      lineStart,
      lineEnd: "45",
      contract: "Stream",
      declaration: "withdraw",
      snippetSha256: SNIPPET_SHA,
    },
    signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
    submissionId: SUBMISSION_ID,
  });
}

describe("public review feedback codec", () => {
  it("accepts the configured Stream type and severity vocabularies", () => {
    expect(() =>
      validatePublicReviewFeedbackConfig({
        ...config,
        categories: [
          "question",
          "documentation",
          "artist-workflow",
          "product-or-ux",
          "protocol-design",
          "implementation-bug",
          PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
          "testing-or-evidence-gap",
          "accessibility-or-localization",
        ].map((value) => ({ value, label: value })),
        severityOptions: [
          "critical",
          "high",
          "medium",
          "low",
          "informational",
          "not-assessed",
        ].map((value) => ({ value, label: value })),
      })
    ).not.toThrow();
  });

  it("does not require the public exploit category outside public review", () => {
    expect(() =>
      validatePublicReviewFeedbackConfig({
        ...config,
        submissionsOpen: false,
        acceptsPublicExploitReports: false,
        categories: config.categories.filter(
          (option) => option.value !== PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE
        ),
      })
    ).not.toThrow();
  });

  it("recognizes only canonical public-review metadata keys", () => {
    expect(
      hasPublicReviewMetadata([{ data_key: PUBLIC_REVIEW_METADATA_KEYS[2] }])
    ).toBe(true);
    expect(hasPublicReviewMetadata([{ data_key: "review_future" }])).toBe(
      false
    );
  });

  it("encodes one top-level Chat drop with exactly four canonical fields", () => {
    const payload = encode();

    expect(payload.wave_id).toBe(destination.waveId);
    expect(payload.reply_to).toBeUndefined();
    expect(payload.signature).toBeNull();
    expect(payload.signer_address).toBe(SIGNER_ADDRESS);
    expect(payload.is_safe_signature).toBe(false);
    expect(payload.metadata.map((item) => item.data_key)).toEqual([
      "review_schema",
      "type",
      "severity",
      "context",
    ]);
    expect(PUBLIC_REVIEW_METADATA_KEYS).toEqual([
      "review_schema",
      "type",
      "severity",
      "context",
    ]);
    expect(JSON.parse(payload.metadata[3]!.data_value)).toEqual({
      submissionId: SUBMISSION_ID,
      reviewId: "stream-contract",
      reviewVersion: "2026-07-26.1",
      pageId: "architecture",
      sectionId: "storage",
      reference: {
        kind: "code",
        repository: "6529-Collections/stream-contracts",
        commit: COMMIT,
        path: "src/Stream.sol",
        sourceSha256: FILE_SHA,
        lineStart: 42,
        lineEnd: 45,
        contract: "Stream",
        declaration: "withdraw",
        snippetSha256: SNIPPET_SHA,
      },
    });
    expect(payload.parts[0]!.content).toContain(
      `/blob/${COMMIT}/src/Stream.sol#L42-L45`
    );
  });

  it("extracts the primary comment without exposing review metadata", () => {
    const payload = encode();

    expect(
      getPublicReviewFeedbackPrimaryComment(payload.parts[0]!.content)
    ).toBe(draft.comment);
    expect(
      getPublicReviewFeedbackPrimaryComment("  Plain Wave comment  ")
    ).toBe("Plain Wave comment");
    expect(getPublicReviewFeedbackPrimaryComment("## Summary\n\nDetails")).toBe(
      "## Summary\n\nDetails"
    );
  });

  it.each(["0", "01", "-1", "1.5", " 1"])(
    "rejects the non-canonical source line %s",
    (lineStart) => {
      expect(() => encode(lineStart)).toThrow(
        PublicReviewFeedbackValidationError
      );
    }
  );

  it("rejects source lines beyond the pinned file", () => {
    expect(() =>
      encodePublicReviewFeedback({
        config,
        destination,
        draft,
        page: {
          pageId: "architecture",
          pageTitle: "Architecture",
          canonicalPath: "/stream/review/architecture",
        },
        referenceSelection: {
          kind: "code",
          path: "src/Stream.sol",
          sourceSha256: FILE_SHA,
          lineStart: 299,
          lineEnd: 301,
        },
        signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
        submissionId: SUBMISSION_ID,
      })
    ).toThrow("outside the pinned file");
  });

  it("posts exploitable-vulnerability feedback to the same public Wave", () => {
    const payload = encodePublicReviewFeedback({
      config,
      destination,
      draft: {
        ...draft,
        category: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
      },
      page: {
        pageId: "architecture",
        pageTitle: "Architecture",
        canonicalPath: "/stream/review/architecture",
      },
      signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
      submissionId: SUBMISSION_ID,
    });

    expect(payload.wave_id).toBe(destination.waveId);
    expect(payload.metadata[1]).toEqual({
      data_key: "type",
      data_value: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
    });
    expect(payload.reply_to).toBeUndefined();
  });

  it("rejects public exploit submissions outside the lifecycle capability", () => {
    expect(() =>
      encodePublicReviewFeedback({
        config: {
          ...config,
          acceptsPublicExploitReports: false,
        },
        destination,
        draft: {
          ...draft,
          category: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
        },
        page: {
          pageId: "architecture",
          pageTitle: "Architecture",
          canonicalPath: "/stream/review/architecture",
        },
        signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
        submissionId: SUBMISSION_ID,
      })
    ).toThrow("configured disclosure policy");
  });

  it("rejects all new payloads when lifecycle capabilities close submissions", () => {
    expect(() =>
      encodePublicReviewFeedback({
        config: {
          ...config,
          submissionsOpen: false,
          acceptsPublicExploitReports: false,
        },
        destination,
        draft,
        page: {
          pageId: "architecture",
          pageTitle: "Architecture",
          canonicalPath: "/stream/review/architecture",
        },
        signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
        submissionId: SUBMISSION_ID,
      })
    ).toThrow("not accepting new feedback");
  });

  it("keeps closed-review exploit records readable in the public ledger", () => {
    const payload = encodePublicReviewFeedback({
      config,
      destination,
      draft: {
        ...draft,
        category: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
      },
      page: {
        pageId: "architecture",
        pageTitle: "Architecture",
        canonicalPath: "/stream/review/architecture",
      },
      signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
      submissionId: SUBMISSION_ID,
    });

    expect(
      decodePublicReviewFeedbackMetadata({
        config: {
          ...config,
          submissionsOpen: false,
          acceptsPublicExploitReports: false,
        },
        metadata: payload.metadata,
      })
    ).toMatchObject({
      ok: true,
      value: {
        category: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
      },
    });
  });

  it("rejects a stale source checksum", () => {
    expect(() =>
      encodePublicReviewFeedback({
        config,
        destination,
        draft,
        page: {
          pageId: "architecture",
          pageTitle: "Architecture",
          canonicalPath: "/stream/review/architecture",
        },
        referenceSelection: {
          kind: "code",
          path: "src/Stream.sol",
          sourceSha256: `sha256:${"c".repeat(64)}`,
          lineStart: 1,
          lineEnd: 2,
        },
        signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
        submissionId: SUBMISSION_ID,
      })
    ).toThrow("checksum does not match");
  });

  it("rejects a section when the configured page has no section allowlist", () => {
    expect(() =>
      encodePublicReviewFeedback({
        config: {
          ...config,
          pages: [{ value: "architecture", label: "Architecture" }],
        },
        destination,
        draft,
        page: {
          pageId: "architecture",
          pageTitle: "Architecture",
          canonicalPath: "/stream/review/architecture",
          sectionId: "forged-section",
        },
        signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
        submissionId: SUBMISSION_ID,
      })
    ).toThrow("section is not part");
  });

  it("preserves Safe signer context while keeping the Chat signature null", () => {
    const payload = encodePublicReviewFeedback({
      config,
      destination,
      draft,
      page: {
        pageId: "architecture",
        pageTitle: "Architecture",
        canonicalPath: "/stream/review/architecture",
      },
      signer: { address: SIGNER_ADDRESS.toLowerCase(), isSafeWallet: true },
      submissionId: SUBMISSION_ID,
    });

    expect(payload.signature).toBeNull();
    expect(payload.signer_address).toBe(SIGNER_ADDRESS);
    expect(payload.is_safe_signature).toBe(true);
  });

  it("fails closed without an active authenticated signer address", () => {
    expect(() =>
      encodePublicReviewFeedback({
        config,
        destination,
        draft,
        page: {
          pageId: "architecture",
          pageTitle: "Architecture",
          canonicalPath: "/stream/review/architecture",
        },
        signer: { address: "", isSafeWallet: false },
        submissionId: SUBMISSION_ID,
      })
    ).toThrow("active authenticated signer address");
  });

  it.each(["a".repeat(64), `sha256:${"A".repeat(64)}`, "sha256:abc"])(
    "rejects the non-canonical checksum URN %s",
    (sourceSha256) => {
      expect(() =>
        encodePublicReviewFeedback({
          config,
          destination,
          draft,
          page: {
            pageId: "architecture",
            pageTitle: "Architecture",
            canonicalPath: "/stream/review/architecture",
          },
          referenceSelection: {
            kind: "code",
            path: "src/Stream.sol",
            sourceSha256,
            lineStart: 1,
            lineEnd: 2,
          },
          signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
          submissionId: SUBMISSION_ID,
        })
      ).toThrow();
    }
  );

  it("rejects a source manifest that uses a bare checksum", () => {
    expect(() =>
      encodePublicReviewFeedback({
        config: {
          ...config,
          source: {
            ...config.source!,
            files: [
              {
                ...config.source!.files[0]!,
                sha256: "a".repeat(64),
              },
            ],
          },
        },
        destination,
        draft,
        page: {
          pageId: "architecture",
          pageTitle: "Architecture",
          canonicalPath: "/stream/review/architecture",
        },
        signer: { address: SIGNER_ADDRESS, isSafeWallet: false },
        submissionId: SUBMISSION_ID,
      })
    ).toThrow("checksum URN");
  });

  it("round-trips canonical metadata and rejects reordered fields", () => {
    const payload = encode();
    const decoded = decodePublicReviewFeedbackMetadata({
      config,
      metadata: payload.metadata,
    });
    const reordered = decodePublicReviewFeedbackMetadata({
      config,
      metadata: [
        payload.metadata[1]!,
        payload.metadata[0]!,
        payload.metadata[2]!,
        payload.metadata[3]!,
      ],
    });

    expect(decoded).toMatchObject({
      ok: true,
      value: {
        schema: PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
        category: "security",
        severity: "critical",
      },
    });
    expect(reordered.ok).toBe(false);
  });

  it("rejects non-canonical context JSON even when its values match", () => {
    const payload = encode();
    const context = JSON.parse(payload.metadata[3]!.data_value);
    const nonCanonical = [
      payload.metadata[0]!,
      payload.metadata[1]!,
      payload.metadata[2]!,
      {
        data_key: "context",
        data_value: JSON.stringify({
          reviewId: context.reviewId,
          submissionId: context.submissionId,
          reviewVersion: context.reviewVersion,
          pageId: context.pageId,
          sectionId: context.sectionId,
          reference: context.reference,
        }),
      },
    ];

    expect(
      decodePublicReviewFeedbackMetadata({
        config,
        metadata: nonCanonical,
      }).ok
    ).toBe(false);
  });
});
