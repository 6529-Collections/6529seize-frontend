import Page, { generateMetadata } from "@/app/[user]/collected/page";
import { EMPTY_USER_PAGE_STATS_INITIAL_DATA } from "@/components/user/stats/userPageStats.types";
import { getUserPageStatsInitialData } from "@/components/user/stats/userPageStats.server";
import { render, screen } from "@testing-library/react";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import { getMetadataForUserPage } from "@/helpers/Helpers";
import { getAppMetadata } from "@/components/providers/metadata";

jest.mock("@/helpers/server.app.helpers");
jest.mock("@/helpers/server.helpers");
jest.mock("@/helpers/Helpers");
jest.mock("@/components/providers/metadata");
jest.mock("@/components/user/stats/userPageStats.server");
jest.mock("@/components/nft-transfer/TransferState", () => ({
  __esModule: true,
  TransferProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/user/layout/UserPageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/user/collected/UserPageCollected", () => ({
  __esModule: true,
  default: ({ initialStatsData }: { initialStatsData: unknown }) => (
    <div data-testid="collected">{JSON.stringify(initialStatsData)}</div>
  ),
}));

describe("user collected generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns metadata for collected page", async () => {
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({ h: "1" });
    const profile = { handle: "alice" } as any;
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    (getMetadataForUserPage as jest.Mock).mockReturnValue({ title: "t" });
    (getAppMetadata as jest.Mock).mockReturnValue({ title: "t" });

    const meta = await generateMetadata({
      params: Promise.resolve({ user: "alice" }),
    });

    expect(getAppCommonHeaders).toHaveBeenCalled();
    expect(getUserProfile).toHaveBeenCalledWith({
      user: "alice",
      headers: { h: "1" },
    });
    expect(getMetadataForUserPage).toHaveBeenCalledWith(profile, "Collected");
    expect(getAppMetadata).toHaveBeenCalledWith({ title: "t" });
    expect(meta).toEqual({ title: "t" });
  });

  it("falls back to empty stats when the profile has no stats identity", async () => {
    const profile = { handle: "alice" } as any;
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({ h: "1" });
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    (getUserPageStatsInitialData as jest.Mock).mockRejectedValueOnce(
      new Error("getStatsPath: no wallet available on profile")
    );

    const element = await Page({
      params: Promise.resolve({ user: "alice" }),
      searchParams: Promise.resolve({}),
    } as any);

    render(element);

    expect(await screen.findByTestId("collected")).toHaveTextContent(
      JSON.stringify(EMPTY_USER_PAGE_STATS_INITIAL_DATA)
    );
  });
});
