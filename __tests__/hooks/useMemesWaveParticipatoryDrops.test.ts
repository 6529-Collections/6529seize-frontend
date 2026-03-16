import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useMemesWaveParticipatoryDrops } from "@/hooks/useMemesWaveParticipatoryDrops";

const useAuth = jest.fn();
const useSeizeSettings = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => useAuth(),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => useSeizeSettings(),
}));

const useQueryMock = useQuery as jest.Mock;

describe("useMemesWaveParticipatoryDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      connectedProfile: {
        handle: "me",
      },
      activeProfileProxy: null,
    });

    useSeizeSettings.mockReturnValue({
      isLoaded: true,
      seizeSettings: {
        memes_wave_id: "memes-wave",
      },
    });

    useQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isRefetching: false,
    });
  });

  it("disables focus and reconnect refetching for the footer queue", () => {
    renderHook(() => useMemesWaveParticipatoryDrops());

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.DROPS,
          {
            waveId: "memes-wave",
            context_profile: "me",
            proxyId: null,
            limit: 20,
            dropType: ApiDropType.Participatory,
            context: "memes-wave-footer",
          },
        ],
        enabled: true,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        queryFn: expect.any(Function),
      })
    );
  });
});
