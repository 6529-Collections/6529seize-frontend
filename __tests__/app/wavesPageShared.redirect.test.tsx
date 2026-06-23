import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { commonApiFetch } from "@/services/api/common-api";
import { renderWavesPageContent } from "@/app/waves/waves-page.shared";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn().mockResolvedValue({ "x-test": "1" }),
}));

jest.mock("@/helpers/stream.helpers", () => ({
  prefetchWavesOverview: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/app/waves/page.client", () => ({
  __esModule: true,
  default: () => <div data-testid="waves-page-client" />,
}));

const mockCookieStore = {
  get: jest.fn(),
};

const makeWave = (isDirectMessage: boolean) => ({
  id: isDirectMessage ? "dm-wave" : "regular-wave",
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
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    mockCookieStore.get.mockReturnValue(undefined);
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
  });
});
