import { redirect } from "next/navigation";
import { commonApiFetch } from "@/services/api/common-api";
import { renderWavesPageContent } from "@/app/waves/waves-page.shared";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { PublicWaveFeedResult } from "@/app/waves/public-wave-feed.server";

const mockFetchServerWaveFeedSeed = jest.fn();
const mockFetchPublicWaveFeed = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn().mockResolvedValue({ "x-test": "1" }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/app/waves/wave-feed-seed.server", () => ({
  fetchServerWaveFeedSeed: (...args: unknown[]) =>
    mockFetchServerWaveFeedSeed(...args),
}));

jest.mock("@/app/waves/public-wave-feed.server", () => ({
  fetchPublicWaveFeed: (...args: unknown[]) =>
    mockFetchPublicWaveFeed(...args),
}));

jest.mock("@/components/waves/PublicWaveFeed", () => ({
  __esModule: true,
  default: ({
    feed,
  }: {
    readonly feed: Extract<PublicWaveFeedResult, { ok: true }>;
  }) => (
    <div data-testid="public-wave-feed">{feed.waveName}</div>
  ),
}));

jest.mock("@/components/waves/WaveServerFeedSeed", () => ({
  __esModule: true,
  default: () => null,
  WaveServerFeedSeedGate: ({ children }: any) => children,
}));

jest.mock("@/app/waves/page.client", () => ({
  __esModule: true,
  default: ({ publicFeedFallback }: { readonly publicFeedFallback?: ReactNode }) => (
    <div data-testid="waves-page-client">{publicFeedFallback}</div>
  ),
}));

const makeWave = (
  isDirectMessage: boolean,
  visibilityGroupId: string | null = null
) => ({
  id: isDirectMessage ? "dm-wave" : "regular-wave",
  name: isDirectMessage ? "Direct message" : "Public Wave",
  author: {
    handle: "wave-author",
    primary_address: "0x0000000000000000000000000000000000000001",
  },
  created_at: 1_750_000_000_000,
  visibility: {
    scope: {
      group: visibilityGroupId ? { id: visibilityGroupId } : null,
    },
  },
  chat: {
    scope: {
      group: {
        is_direct_message: isDirectMessage,
      },
    },
  },
});

describe("renderWavesPageContent route family redirects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchServerWaveFeedSeed.mockResolvedValue({
      ok: false,
      waveId: "regular-wave",
    });
    mockFetchPublicWaveFeed.mockResolvedValue({
      ok: false,
      waveId: "regular-wave",
    });
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("redirects DM waves from /waves to /messages", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue(makeWave(true));

    await expect(
      renderWavesPageContent({
        waveId: "dm-wave",
        searchParams: { drop: "drop-1", serialNo: "42" },
        routeContext: "waves",
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/messages/dm-wave?drop=drop-1&serialNo=42"
    );
    expect(mockFetchServerWaveFeedSeed).not.toHaveBeenCalled();
    expect(mockFetchPublicWaveFeed).not.toHaveBeenCalled();
  });

  it("redirects non-DM waves from /messages to /waves", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue(makeWave(false));

    await expect(
      renderWavesPageContent({
        waveId: "regular-wave",
        searchParams: { drop: "drop-1", divider: "7" },
        routeContext: "messages",
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/waves/regular-wave?drop=drop-1&divider=7"
    );
    expect(mockFetchServerWaveFeedSeed).not.toHaveBeenCalled();
    expect(mockFetchPublicWaveFeed).not.toHaveBeenCalled();
  });

  it("passes a server-rendered anonymous slot to public Wave detail routes", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue(makeWave(false));
    mockFetchPublicWaveFeed.mockResolvedValue({
      ok: true,
      waveId: "regular-wave",
      waveName: "Public Wave",
      hasMore: false,
      items: [
        {
          id: "drop-1",
          serialNo: 1,
          createdAt: 1_750_000_000_000,
          authorLabel: "artist",
          title: "Public drop",
          excerpt: "Public content",
          href: "/waves/regular-wave?drop=drop-1",
        },
      ],
    });

    const page = await renderWavesPageContent({
      waveId: "regular-wave",
      searchParams: {},
      routeContext: "waves",
    });
    render(page);

    expect(mockFetchPublicWaveFeed).toHaveBeenCalledWith("regular-wave");
    expect(screen.getByTestId("public-wave-feed")).toHaveTextContent(
      "Public Wave"
    );
    expect(screen.getByTestId("waves-page-client")).toContainElement(
      screen.getByTestId("public-wave-feed")
    );
  });

  it("does not request anonymous content for private Wave details", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue(
      makeWave(false, "private-group")
    );

    const page = await renderWavesPageContent({
      waveId: "regular-wave",
      searchParams: {},
      routeContext: "waves",
    });
    render(page);

    expect(mockFetchPublicWaveFeed).not.toHaveBeenCalled();
    expect(screen.queryByTestId("public-wave-feed")).not.toBeInTheDocument();
  });

  it("does not request anonymous content for direct messages", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue(makeWave(true));

    const page = await renderWavesPageContent({
      waveId: "dm-wave",
      searchParams: {},
      routeContext: "messages",
    });
    render(page);

    expect(mockFetchPublicWaveFeed).not.toHaveBeenCalled();
    expect(screen.queryByTestId("public-wave-feed")).not.toBeInTheDocument();
  });

  it.each([
    {
      label: "empty",
      result: {
        ok: true,
        waveId: "regular-wave",
        waveName: "Public Wave",
        hasMore: false,
        items: [],
      },
    },
    {
      label: "unavailable",
      result: { ok: false, waveId: "regular-wave" },
    },
  ])("emits no public fallback for an $label result", async ({ result }) => {
    (commonApiFetch as jest.Mock).mockResolvedValue(makeWave(false));
    mockFetchPublicWaveFeed.mockResolvedValue(result);

    const page = await renderWavesPageContent({
      waveId: "regular-wave",
      searchParams: {},
      routeContext: "waves",
    });
    render(page);

    expect(mockFetchPublicWaveFeed).toHaveBeenCalledWith("regular-wave");
    expect(screen.queryByTestId("public-wave-feed")).not.toBeInTheDocument();
  });
});
