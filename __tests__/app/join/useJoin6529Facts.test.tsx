import { useJoin6529Facts } from "@/app/join/useJoin6529Facts";
import { STATS_QUERY_KEY } from "@/components/user/collected/stats/constants";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import { useIdentityActivity } from "@/hooks/useIdentityActivity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/hooks/useIdentityActivity", () => ({
  useIdentityActivity: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const activityMock = useIdentityActivity as jest.Mock;
const apiMock = commonApiFetch as jest.Mock;

const COLLECTED_STATS: ApiCollectedStats = {
  boost: 0,
  gradients_balance: 0,
  memes_balance: 1,
  nextgen_balance: 0,
  seasons: [],
  unique_memes: 1,
};

const renderFacts = ({
  enabled,
  identity,
}: {
  readonly enabled: boolean;
  readonly identity: string | null;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {
    ...renderHook(() => useJoin6529Facts({ enabled, identity }), { wrapper }),
    queryClient,
  };
};

describe("useJoin6529Facts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activityMock.mockReturnValue({ data: undefined });
  });

  it("loads both facts for the normalized profile identity", async () => {
    activityMock.mockReturnValue({
      data: { date_samples: [0, 1], last_date: "14.07.2026" },
    });
    apiMock.mockResolvedValue(COLLECTED_STATS);

    const { result } = renderFacts({ enabled: true, identity: " Punk6529 " });

    expect(result.current.hasParticipated).toBe(true);
    await waitFor(() => expect(result.current.hasCollected).toBe(true));
    expect(activityMock).toHaveBeenCalledWith({
      enabled: true,
      identity: "punk6529",
    });
    expect(apiMock).toHaveBeenCalledWith({
      endpoint: "collected-stats/punk6529",
      signal: expect.anything(),
    });
  });

  it("does not load facts until a logged-in profile identity is available", () => {
    const { result } = renderFacts({ enabled: false, identity: null });

    expect(result.current).toEqual({
      hasCollected: false,
      hasParticipated: false,
    });
    expect(activityMock).toHaveBeenCalledWith({
      enabled: false,
      identity: "",
    });
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("does not enable either query for an empty identity", () => {
    const { result } = renderFacts({ enabled: true, identity: "   " });

    expect(result.current).toEqual({
      hasCollected: false,
      hasParticipated: false,
    });
    expect(activityMock).toHaveBeenCalledWith({
      enabled: false,
      identity: "",
    });
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("keeps collection pending while collected stats are loading", async () => {
    apiMock.mockReturnValue(new Promise<ApiCollectedStats>(() => undefined));

    const { result } = renderFacts({ enabled: true, identity: "punk6529" });

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(result.current.hasCollected).toBe(false);
  });

  it("keeps collection pending when collected stats are unavailable", async () => {
    apiMock.mockRejectedValue(new Error("Collected stats unavailable"));

    const { queryClient, result } = renderFacts({
      enabled: true,
      identity: "punk6529",
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryState([
          STATS_QUERY_KEY,
          "collected-stats",
          "punk6529",
        ])?.status
      ).toBe("error")
    );
    expect(result.current.hasCollected).toBe(false);
  });
});
