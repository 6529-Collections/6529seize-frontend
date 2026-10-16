import CommunityDownloadsSubscriptions from "@/components/community-downloads/CommunityDownloadsSubscriptions";
import { MEMES_CONTRACT } from "@/constants/constants";
import { TitleProvider } from "@/contexts/TitleContext";
import { act, render, screen } from "@testing-library/react";
import { withHostTimeZone } from "../../utils/timeZoneHarness";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const { commonApiFetch } = require("@/services/api/common-api");

describe("CommunityDownloadsSubscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and displays subscriptions", async () => {
    commonApiFetch.mockResolvedValue({
      count: 1,
      data: [
        {
          date: "20230101",
          contract: MEMES_CONTRACT,
          token_id: 1,
          upload_url: "https://example.com",
        },
      ],
    });
    await act(async () => {
      render(
        <TitleProvider>
          <CommunityDownloadsSubscriptions />
        </TitleProvider>
      );
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `subscriptions/uploads?contract=${MEMES_CONTRACT}&page_size=25&page=1`,
    });
    expect(screen.getByText("Sun, Jan 1, 2023")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://example.com" })
    ).toHaveAttribute("href", "https://example.com");
  });

  it.each(["America/Los_Angeles", "Pacific/Pago_Pago", "Pacific/Kiritimati"])(
    "shows the YYYY-MM-DD upload date as that day in a %s browser",
    async (zone) => {
      commonApiFetch.mockResolvedValue({
        count: 1,
        data: [
          {
            date: "2026-10-12",
            contract: MEMES_CONTRACT,
            token_id: 560,
            upload_url: "https://example.com/560",
          },
        ],
      });

      await withHostTimeZone(zone, async () => {
        await act(async () => {
          render(
            <TitleProvider>
              <CommunityDownloadsSubscriptions />
            </TitleProvider>
          );
        });

        expect(screen.getByText("Mon, Oct 12, 2026")).toBeInTheDocument();
      });
    }
  );

  it("shows placeholder when no downloads", async () => {
    commonApiFetch.mockResolvedValue({ count: 0, data: [] });
    await act(async () => {
      render(
        <TitleProvider>
          <CommunityDownloadsSubscriptions />
        </TitleProvider>
      );
    });
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });
});
