import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { commonApiPost } from "@/services/api/common-api";
import { submitPublicReviewFeedback } from "@/services/api/public-review/feedback-api";
import {
  encodePublicReviewFeedback,
  PUBLIC_REVIEW_METADATA_KEYS,
} from "@/services/api/public-review/feedback-codec";
import {
  PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
  PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
  PUBLIC_REVIEW_INITIAL_VERSION,
  type PublicReviewDiscussionDestination,
  type PublicReviewFeedbackConfig,
} from "@/services/api/public-review/types";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const commonApiPostMock = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;
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

function makePayload() {
  return encodePublicReviewFeedback({
    config,
    destination,
    draft: {
      category: "security",
      severity: "critical",
      comment: "Check this invariant.",
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
}

describe("public review feedback transport", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("awaits and returns a verified Chat drop", async () => {
    const drop = {
      id: "drop-1",
      serial_no: 17,
      wave: { id: destination.waveId },
      drop_type: ApiDropType.Chat,
    } as ApiDrop;
    commonApiPostMock.mockResolvedValue(drop);
    const payload = makePayload();

    await expect(
      submitPublicReviewFeedback({ destination, payload })
    ).resolves.toBe(drop);
    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "drops",
      body: payload,
      signal: undefined,
      errorMode: "structured",
    });
  });

  it("rejects reordered metadata before sending", async () => {
    const payload = makePayload();
    payload.metadata = [
      payload.metadata[1]!,
      payload.metadata[0]!,
      payload.metadata[2]!,
      payload.metadata[3]!,
    ];

    await expect(
      submitPublicReviewFeedback({ destination, payload })
    ).rejects.toThrow("metadata is not canonical");
    expect(payload.metadata.map((item) => item.data_key)).not.toEqual(
      PUBLIC_REVIEW_METADATA_KEYS
    );
    expect(commonApiPostMock).not.toHaveBeenCalled();
  });

  it("rejects an API response for another Wave", async () => {
    commonApiPostMock.mockResolvedValue({
      id: "drop-1",
      serial_no: 17,
      wave: { id: "33333333-3333-4333-8333-333333333333" },
      drop_type: ApiDropType.Chat,
    } as ApiDrop);

    await expect(
      submitPublicReviewFeedback({
        destination,
        payload: makePayload(),
      })
    ).rejects.toThrow("outside the configured destination");
  });
});
