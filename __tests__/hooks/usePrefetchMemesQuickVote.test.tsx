import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  getMemesQuickVoteDiscoveryQueryKey,
  getMemesQuickVoteDiscoveryStateKey,
  getMemesQuickVoteDropQueryKey,
  getMemesQuickVoteSummaryQueryKey,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { usePrefetchMemesQuickVote } from "@/hooks/usePrefetchMemesQuickVote";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/hooks/useMemesQuickVoteContext", () => ({
  useMemesQuickVoteContext: jest.fn(),
}));

jest.mock("@/hooks/useMemesQuickVoteStorage", () => ({
  useMemesQuickVoteStorage: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const useMemesQuickVoteContextMock =
  useMemesQuickVoteContext as jest.MockedFunction<
    typeof useMemesQuickVoteContext
  >;
const useMemesQuickVoteStorageMock =
  useMemesQuickVoteStorage as jest.MockedFunction<
    typeof useMemesQuickVoteStorage
  >;
const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const WAVE_ID = "memes-wave";
const CONTEXT_PROFILE = "me";
const WAVE = {
  id: WAVE_ID,
  name: "The Memes",
  voting_credit_type: ApiWaveCreditType.Tdh,
} as const;

const createDrop = (id: string, serialNo: number) =>
  ({
    id,
    serial_no: serialNo,
    wave: WAVE,
    context_profile_context: {
      rating: 0,
      max_rating: 5_000,
    },
    author: {
      handle: `artist-${serialNo}`,
      primary_address: `0x${serialNo}`,
    },
    metadata: [],
    parts: [],
  }) as any;

describe("usePrefetchMemesQuickVote", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    useMemesQuickVoteContextMock.mockReturnValue({
      contextProfile: CONTEXT_PROFILE,
      isEnabled: true,
      isLoaded: true,
      memesWaveId: WAVE_ID,
      proxyId: null,
    });
    useMemesQuickVoteStorageMock.mockReturnValue({
      skippedDropIds: ["drop-10"],
    } as any);

    const summaryDrop = createDrop("drop-30", 30);
    const discoveryDrop = createDrop("drop-20", 20);

    commonApiFetchMock.mockImplementation(async (request: any) => {
      const { endpoint, params } = request as {
        readonly endpoint: string;
        readonly params?: Record<string, string>;
      };

      if (
        endpoint === `waves/${WAVE_ID}/leaderboard` &&
        params?.page_size === "1"
      ) {
        return {
          count: 2,
          drops: [summaryDrop],
          next: true,
          page: 1,
          wave: WAVE,
        } as any;
      }

      if (
        endpoint === `waves/${WAVE_ID}/leaderboard` &&
        params?.page_size === "20"
      ) {
        return {
          count: 2,
          drops: [summaryDrop, discoveryDrop],
          next: false,
          page: 1,
          wave: WAVE,
        } as any;
      }

      if (endpoint === `drops/${summaryDrop.id}`) {
        return summaryDrop;
      }

      if (endpoint === `drops/${discoveryDrop.id}`) {
        return discoveryDrop;
      }

      throw new Error(`Unexpected request: ${JSON.stringify(request)}`);
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("prefetches summary, discovery, and the first two hydrated drops for the reserved session", async () => {
    const { result } = renderHook(() => usePrefetchMemesQuickVote(), {
      wrapper,
    });

    await act(async () => {
      await result.current(7);
    });

    expect(
      queryClient.getQueryData(
        getMemesQuickVoteSummaryQueryKey({
          contextProfile: CONTEXT_PROFILE,
          proxyId: null,
          waveId: WAVE_ID,
        })
      )
    ).toBeDefined();
    expect(
      queryClient.getQueryData(
        getMemesQuickVoteDiscoveryQueryKey({
          discoveryStateKey: getMemesQuickVoteDiscoveryStateKey({
            contextProfile: CONTEXT_PROFILE,
            enabled: true,
            memesWaveId: WAVE_ID,
            sessionId: 7,
          }),
          fetchVersion: 0,
          waveId: WAVE_ID,
        })
      )
    ).toEqual({
      pages: [
        {
          drops: expect.arrayContaining([
            expect.objectContaining({ id: "drop-30" }),
            expect.objectContaining({ id: "drop-20" }),
          ]),
          nextPage: null,
          pageCount: 2,
        },
      ],
    });
    expect(
      queryClient.getQueryData(getMemesQuickVoteDropQueryKey("drop-30"))
    ).toEqual(expect.objectContaining({ id: "drop-30" }));
    expect(
      queryClient.getQueryData(getMemesQuickVoteDropQueryKey("drop-20"))
    ).toEqual(expect.objectContaining({ id: "drop-20" }));
  });
});
