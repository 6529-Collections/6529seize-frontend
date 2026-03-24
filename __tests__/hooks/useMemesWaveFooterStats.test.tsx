import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const useAuth = jest.fn();
const useSeizeSettings = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => useAuth(),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => useSeizeSettings(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const createDrop = ({
  id,
  serialNo,
  rating,
  maxRating = 5_000,
}: {
  readonly id: string;
  readonly serialNo: number;
  readonly rating: number;
  readonly maxRating?: number;
}) =>
  ({
    id,
    serial_no: serialNo,
    drop_type: ApiDropType.Participatory,
    context_profile_context: {
      rating,
      max_rating: maxRating,
    },
    wave: {
      id: "memes-wave",
      name: "The Memes",
      voting_credit_type: ApiWaveCreditType.Tdh,
      authenticated_user_eligible_to_vote: true,
      voting_period_start: null,
      voting_period_end: null,
    },
  }) as any;

describe("useMemesWaveFooterStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      connectedProfile: {
        id: "profile-1",
        handle: "me",
        primary_wallet: "0x123",
      },
      activeProfileProxy: null,
    });

    useSeizeSettings.mockReturnValue({
      isLoaded: true,
      seizeSettings: {
        memes_wave_id: "memes-wave",
      },
    });
  });

  it("requires a handle to request quick-vote summary data", () => {
    useAuth.mockReturnValue({
      connectedProfile: {
        id: "profile-1",
        handle: null,
        primary_wallet: "0x123",
      },
      activeProfileProxy: null,
    });

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
  });

  it("stays disabled for proxy sessions", () => {
    useAuth.mockReturnValue({
      connectedProfile: {
        id: "profile-1",
        handle: "me",
        primary_wallet: "0x123",
      },
      activeProfileProxy: {
        id: "proxy-1",
      },
    });

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
  });

  it("does not fetch until memes settings are loaded", () => {
    useSeizeSettings.mockReturnValue({
      isLoaded: false,
      seizeSettings: {
        memes_wave_id: "memes-wave",
      },
    });

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
  });

  it("fetches the first unvoted leaderboard item and derives footer stats from it", async () => {
    commonApiFetchMock.mockResolvedValue({
      count: 2,
      page: 1,
      next: true,
      wave: {
        id: "memes-wave",
        name: "The Memes",
        voting_credit_type: ApiWaveCreditType.Tdh,
        authenticated_user_eligible_to_vote: true,
        voting_period_start: null,
        voting_period_end: null,
      },
      drops: [
        createDrop({
          id: "drop-40",
          serialNo: 40,
          rating: 0,
          maxRating: 5_000,
        }),
      ],
    } as any);

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.uncastPower).toBe(5_000);
    expect(result.current.unratedCount).toBe(2);
    expect(result.current.votingLabel).toBe("TDH");
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves/memes-wave/leaderboard",
      params: {
        page: "1",
        page_size: "1",
        sort: "CREATED_AT",
        sort_direction: "DESC",
        unvoted_by_me: "true",
      },
    });
  });

  it("stays hidden when the summary response does not include usable vote context", async () => {
    commonApiFetchMock.mockResolvedValue({
      count: 1,
      page: 1,
      next: false,
      wave: {
        id: "memes-wave",
        name: "The Memes",
        voting_credit_type: ApiWaveCreditType.Tdh,
        authenticated_user_eligible_to_vote: true,
        voting_period_start: null,
        voting_period_end: null,
      },
      drops: [
        {
          ...createDrop({
            id: "drop-40",
            serialNo: 40,
            rating: 0,
          }),
          context_profile_context: null,
        },
      ],
    } as any);

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(1));

    expect(result.current.isReady).toBe(false);
    expect(result.current.uncastPower).toBeNull();
    expect(result.current.unratedCount).toBe(0);
    expect(result.current.votingLabel).toBeNull();
  });
});
