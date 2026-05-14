import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import { commonApiFetch } from "@/services/api/common-api";
import {
  fetchQuorumParticipationDropPreviewBySerialNoV2,
  serialPreviewBatcher,
} from "@/services/api/quorum-participation-drop-preview-v2-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const buildWaveOverview = (id: string) =>
  ({
    id,
    name: `Wave ${id}`,
    pfp: null,
    last_drop_time: 1000,
    is_private: false,
    context_profile_context: {
      pinned: false,
      can_chat: true,
    },
  }) as any;

const buildDropV2 = (
  serialNo: number,
  waveId: string,
  overrides: Partial<ApiDropV2> = {}
): ApiDropV2 =>
  ({
    id: `drop-${serialNo}`,
    serial_no: serialNo,
    created_at: 1000,
    is_signed: false,
    hide_link_preview: false,
    title: `Drop ${serialNo}`,
    content: `Body ${serialNo}`,
    media: [],
    attachments: [],
    parts_count: 1,
    author: {
      id: "profile-1",
      handle: "alice",
      pfp: null,
      level: 0,
      classification: ApiProfileClassification.Pseudonym,
      primary_address: "0xabc",
      badges: {},
    },
    drop_type: ApiDropMainType.Submission,
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    nft_links: [],
    reactions: [],
    boosts: 0,
    submission_context: {
      status: ApiSubmissionDropStatus.Active,
      has_metadata: false,
      voting: {
        is_open: true,
        total_votes_given: 0,
        current_calculated_vote: 0,
        predicted_final_vote: 0,
        voters_count: 0,
        place: 0,
        context_profile_context: {
          can_vote: true,
          min: 0,
          max: 0,
          current: 0,
        },
      },
    },
    context_profile_context: {
      boosted: false,
      bookmarked: false,
      subscribed: false,
    },
    wave: buildWaveOverview(waveId),
    ...overrides,
  }) as ApiDropV2;

describe("fetchQuorumParticipationDropPreviewBySerialNoV2", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    serialPreviewBatcher.resetForTests();
  });

  afterEach(() => {
    serialPreviewBatcher.resetForTests();
    jest.useRealTimers();
  });

  it("batches same-tick serial preview requests into one drops request", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [buildDropV2(7, "wave-1"), buildDropV2(8, "wave-1")],
      page: 1,
      next: false,
    });

    const firstPromise = fetchQuorumParticipationDropPreviewBySerialNoV2({
      waveId: "wave-1",
      serialNo: 7,
    });
    const secondPromise = fetchQuorumParticipationDropPreviewBySerialNoV2({
      waveId: "wave-1",
      serialNo: 8,
    });

    await expect(Promise.all([firstPromise, secondPromise])).resolves.toEqual([
      expect.objectContaining({ id: "drop-7", serial_no: 7 }),
      expect.objectContaining({ id: "drop-8", serial_no: 8 }),
    ]);

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/drops",
      params: {
        serial_nos: "7,8",
        page_size: "2",
      },
      signal: expect.objectContaining({ aborted: false }),
    });
  });

  it("dedupes duplicate serial numbers within one batch", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [buildDropV2(7, "wave-1")],
      page: 1,
      next: false,
    });

    const firstPromise = fetchQuorumParticipationDropPreviewBySerialNoV2({
      waveId: "wave-1",
      serialNo: 7,
    });
    const secondPromise = fetchQuorumParticipationDropPreviewBySerialNoV2({
      waveId: "wave-1",
      serialNo: 7,
    });

    await expect(Promise.all([firstPromise, secondPromise])).resolves.toEqual([
      expect.objectContaining({ id: "drop-7" }),
      expect.objectContaining({ id: "drop-7" }),
    ]);

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/drops",
      params: {
        serial_nos: "7",
        page_size: "1",
      },
      signal: expect.objectContaining({ aborted: false }),
    });
  });

  it("returns null for missing serials and wrong-wave results", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [buildDropV2(7, "other-wave")],
      page: 1,
      next: false,
    });

    const wrongWavePromise = fetchQuorumParticipationDropPreviewBySerialNoV2({
      waveId: "wave-1",
      serialNo: 7,
    });
    const missingPromise = fetchQuorumParticipationDropPreviewBySerialNoV2({
      waveId: "wave-1",
      serialNo: 8,
    });

    await expect(
      Promise.all([wrongWavePromise, missingPromise])
    ).resolves.toEqual([null, null]);
  });

  it("chunks batches above the endpoint page size", async () => {
    commonApiFetchMock.mockImplementation(async (request) => {
      const serialNos = request.params?.serial_nos.split(",").map(Number);

      return {
        data: serialNos?.map((serialNo) => buildDropV2(serialNo, "wave-1")),
        page: 1,
        next: false,
      };
    });

    const promises = Array.from({ length: 101 }, (_, index) =>
      fetchQuorumParticipationDropPreviewBySerialNoV2({
        waveId: "wave-1",
        serialNo: index + 1,
      })
    );

    const drops = await Promise.all(promises);

    expect(drops).toHaveLength(101);
    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(commonApiFetchMock).toHaveBeenNthCalledWith(1, {
      endpoint: "v2/drops",
      params: {
        serial_nos: Array.from({ length: 100 }, (_, index) => index + 1).join(
          ","
        ),
        page_size: "100",
      },
      signal: expect.objectContaining({ aborted: false }),
    });
    expect(commonApiFetchMock).toHaveBeenNthCalledWith(2, {
      endpoint: "v2/drops",
      params: {
        serial_nos: "101",
        page_size: "1",
      },
      signal: expect.objectContaining({ aborted: false }),
    });
  });

  it("aborts the underlying batch request when its caller signal is aborted", async () => {
    jest.useFakeTimers();
    const abortError = new DOMException("Request aborted", "AbortError");
    let abortListener: (() => void) | undefined;
    const callerSignal = {
      aborted: false,
      reason: abortError,
      addEventListener: jest.fn((_event, listener) => {
        abortListener = listener as () => void;
      }),
      removeEventListener: jest.fn(),
      throwIfAborted: jest.fn(),
    } as unknown as AbortSignal;
    let requestSignal: AbortSignal | undefined;

    commonApiFetchMock.mockImplementation(
      async (request) =>
        new Promise(() => {
          requestSignal = request.signal;
        })
    );

    const previewPromise = fetchQuorumParticipationDropPreviewBySerialNoV2({
      waveId: "wave-1",
      serialNo: 7,
      signal: callerSignal,
    });

    jest.runOnlyPendingTimers();
    expect(requestSignal).toBeDefined();

    (callerSignal as { aborted: boolean }).aborted = true;
    abortListener?.();

    await expect(previewPromise).rejects.toBe(abortError);
    expect(requestSignal?.aborted).toBe(true);
  });
});
