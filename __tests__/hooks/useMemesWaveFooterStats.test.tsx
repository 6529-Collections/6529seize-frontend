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

const commonApiFetchMock = commonApiFetch as jest.Mock;

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
  id: string;
  serialNo: number;
  rating: number;
  maxRating?: number;
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
      voting_credit_type: ApiWaveCreditType.Tdh,
      authenticated_user_eligible_to_vote: true,
    },
  }) as any;

const createPage = ({
  count,
  startSerialNo,
  unratedIndexes = [],
}: {
  count: number;
  startSerialNo: number;
  unratedIndexes?: number[];
}) =>
  Array.from({ length: count }, (_, index) =>
    createDrop({
      id: `drop-${startSerialNo - index}`,
      serialNo: startSerialNo - index,
      rating: unratedIndexes.includes(index) ? 0 : index + 1,
    })
  );

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

  it("requires a handle to request contextual drops", () => {
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

  it("does not fetch until memes settings and auth are ready", () => {
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

  it("paginates through all participatory drops and derives uncast power", async () => {
    const firstPage = createPage({
      count: 20,
      startSerialNo: 40,
      unratedIndexes: [0],
    });
    const secondPage = createPage({
      count: 1,
      startSerialNo: 20,
      unratedIndexes: [0],
    });

    commonApiFetchMock.mockImplementation(
      async ({ params }: { params: Record<string, string> }) => {
        if (!params.serial_no_less_than) {
          return firstPage;
        }

        if (params.serial_no_less_than === "21") {
          return secondPage;
        }

        return [];
      }
    );

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.uncastPower).toBe(5_000);
    expect(result.current.unratedCount).toBe(2);
    expect(result.current.votingLabel).toBe("TDH");
    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(commonApiFetchMock).toHaveBeenNthCalledWith(1, {
      endpoint: "drops",
      params: {
        context_profile: "me",
        wave_id: "memes-wave",
        limit: "20",
        drop_type: "PARTICIPATORY",
      },
    });
    expect(commonApiFetchMock).toHaveBeenNthCalledWith(2, {
      endpoint: "drops",
      params: {
        context_profile: "me",
        wave_id: "memes-wave",
        limit: "20",
        drop_type: "PARTICIPATORY",
        serial_no_less_than: "21",
      },
    });
  });

  it("stays hidden when the fetched drops have no usable vote context", async () => {
    commonApiFetchMock.mockResolvedValue([
      {
        id: "a",
        serial_no: 100,
        drop_type: ApiDropType.Participatory,
        context_profile_context: null,
        wave: {
          voting_credit_type: ApiWaveCreditType.Tdh,
          authenticated_user_eligible_to_vote: true,
        },
      },
    ]);

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(1));

    expect(result.current.isReady).toBe(false);
    expect(result.current.uncastPower).toBeNull();
    expect(result.current.unratedCount).toBe(0);
  });

  it("ignores unrated drops that are no longer quick-vote eligible", async () => {
    commonApiFetchMock.mockResolvedValue([
      {
        id: "a",
        serial_no: 100,
        drop_type: ApiDropType.Participatory,
        context_profile_context: {
          rating: 0,
          max_rating: 5_000,
        },
        wave: {
          voting_credit_type: ApiWaveCreditType.Tdh,
          authenticated_user_eligible_to_vote: false,
        },
      },
    ]);

    const { result } = renderHook(() => useMemesWaveFooterStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(1));

    expect(result.current.isReady).toBe(false);
    expect(result.current.uncastPower).toBeNull();
    expect(result.current.unratedCount).toBe(0);
  });
});
