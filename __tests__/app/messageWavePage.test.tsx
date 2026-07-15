import MessageWavePage from "@/app/messages/[wave]/page";
import { render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import {
  fetchWaveContext,
  isApiWaveDirectMessage,
} from "@/app/waves/waves-page.shared";

const mockFetchServerWaveFeedSeed = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/app/messages/page.client", () => ({
  __esModule: true,
  default: () => <div data-testid="messages-page-client" />,
}));

jest.mock("@/app/waves/waves-page.shared", () => ({
  fetchWaveContext: jest.fn(),
  isApiWaveDirectMessage: jest.fn(),
}));

jest.mock("@/app/waves/wave-feed-seed.server", () => ({
  fetchServerWaveFeedSeed: (...args: unknown[]) =>
    mockFetchServerWaveFeedSeed(...args),
}));

jest.mock("@/components/waves/WaveServerFeedSeed", () => ({
  __esModule: true,
  default: ({ wave }: { wave: { id: string } }) => (
    <div data-testid="wave-server-feed-seed" data-wave-id={wave.id} />
  ),
  WaveServerFeedSeedGate: ({ children }: any) => (
    <div data-testid="wave-server-feed-gate">{children}</div>
  ),
}));

describe("Message wave page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchServerWaveFeedSeed.mockReturnValue(new Promise(() => {}));
  });

  it("redirects non-DM waves to the waves route", async () => {
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    (fetchWaveContext as jest.Mock).mockResolvedValue({
      wave: { id: "wave-123" },
      headers: { "x-safe-server-context": "present" },
    });
    (isApiWaveDirectMessage as jest.Mock).mockReturnValue(false);

    await expect(
      MessageWavePage({
        params: Promise.resolve({ wave: "wave-123" }),
        searchParams: Promise.resolve({ drop: "drop-1", divider: "7" }),
      } as any)
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/waves/wave-123?drop=drop-1&divider=7"
    );
    expect(mockFetchServerWaveFeedSeed).not.toHaveBeenCalled();
  });

  it("renders message content for DM waves", async () => {
    (fetchWaveContext as jest.Mock).mockResolvedValue({
      wave: { id: "dm-123" },
      headers: { "x-safe-server-context": "present" },
    });
    (isApiWaveDirectMessage as jest.Mock).mockReturnValue(true);

    const result = await MessageWavePage({
      params: Promise.resolve({ wave: "dm-123" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
    render(result);
    expect(
      within(screen.getByTestId("wave-server-feed-gate")).getByTestId(
        "messages-page-client"
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("wave-server-feed-seed")).toHaveAttribute(
      "data-wave-id",
      "dm-123"
    );
    expect(mockFetchServerWaveFeedSeed).toHaveBeenCalledTimes(1);
    expect(mockFetchServerWaveFeedSeed).toHaveBeenCalledWith({
      headers: { "x-safe-server-context": "present" },
      routeFamily: "/messages/[wave]",
      waveId: "dm-123",
    });
    expect(
      (fetchWaveContext as jest.Mock).mock.invocationCallOrder[0]
    ).toBeLessThan(
      (isApiWaveDirectMessage as jest.Mock).mock.invocationCallOrder[0]!
    );
    expect(
      (isApiWaveDirectMessage as jest.Mock).mock.invocationCallOrder[0]
    ).toBeLessThan(mockFetchServerWaveFeedSeed.mock.invocationCallOrder[0]!);
  });

  it("does not start a feed for a missing or inaccessible DM wave", async () => {
    (fetchWaveContext as jest.Mock).mockResolvedValue({
      wave: null,
      headers: { "x-safe-server-context": "present" },
    });

    const result = await MessageWavePage({
      params: Promise.resolve({ wave: "missing-wave" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(result).toBeTruthy();
    expect(isApiWaveDirectMessage).not.toHaveBeenCalled();
    expect(mockFetchServerWaveFeedSeed).not.toHaveBeenCalled();
  });

  it("does not await the DM feed after metadata and route checks finish", async () => {
    let resolveContext:
      | ((value: {
          wave: { id: string };
          headers: Record<string, string>;
        }) => void)
      | undefined;
    (fetchWaveContext as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveContext = resolve;
      })
    );
    (isApiWaveDirectMessage as jest.Mock).mockReturnValue(true);
    mockFetchServerWaveFeedSeed.mockReturnValue(new Promise(() => {}));

    const pagePromise = MessageWavePage({
      params: Promise.resolve({ wave: "dm-deferred" }),
      searchParams: Promise.resolve({}),
    } as any);

    await Promise.resolve();
    expect(mockFetchServerWaveFeedSeed).not.toHaveBeenCalled();

    resolveContext?.({
      wave: { id: "dm-deferred" },
      headers: { "x-safe-server-context": "present" },
    });

    await expect(pagePromise).resolves.toBeTruthy();
    expect(mockFetchServerWaveFeedSeed).toHaveBeenCalledTimes(1);
  });
});
