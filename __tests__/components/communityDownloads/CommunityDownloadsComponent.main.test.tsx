import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommunityDownloadsComponent from "@/components/community-downloads/CommunityDownloadsComponent";
import { fetchUrl } from "@/services/6529api";
import { renderWithQueryClient } from "../../utils/reactQuery";
import { withHostTimeZone } from "../../utils/timeZoneHarness";

jest.mock("@/services/6529api");

jest.mock("@/components/pagination/Pagination", () => ({
  __esModule: true,
  default: (p: any) => (
    <button data-testid="pager" onClick={() => p.setPage(p.page + 1)}>
      page
    </button>
  ),
}));

jest.mock("@/components/nothingHereYet/NothingHereYetSummer", () => () => (
  <div>NoResults</div>
));

const mockFetch = fetchUrl as jest.Mock;

describe("CommunityDownloadsComponent", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("fetches and displays downloads", async () => {
    mockFetch.mockResolvedValue({
      count: 1,
      data: [{ date: "20230101", url: "https://testA.6529.io" }],
    });
    renderWithQueryClient(
      <CommunityDownloadsComponent title="T" url="https://test.6529.io/data" />
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.6529.io/data?page_size=25&page=1"
    );
    expect(
      await screen.findByText("https://testA.6529.io")
    ).toBeInTheDocument();
  });

  it("shows each feed's calendar-day dates as that day in a western browser", async () => {
    mockFetch.mockResolvedValue({
      count: 3,
      data: [
        // TDH and consolidated uploads
        { date: "20261012", url: "https://tdh.example" },
        // Royalties: a day stamped as UTC midnight
        { date: "2026-10-11T00:00:00.000Z", url: "https://royalties.example" },
        // Rememes: a real upload instant (02:03 UTC is still the 11th in Los Angeles)
        { date: "2026-10-12T02:03:14.446Z", url: "https://rememes.example" },
      ],
    });

    await withHostTimeZone("America/Los_Angeles", async () => {
      renderWithQueryClient(
        <CommunityDownloadsComponent
          title="T"
          url="https://test.6529.io/data"
        />
      );
      await screen.findByText("https://tdh.example");

      const rowFor = (url: string) =>
        screen.getByText(url).closest("tr") as HTMLElement;
      expect(rowFor("https://tdh.example")).toHaveTextContent(
        "Mon, Oct 12, 2026"
      );
      expect(rowFor("https://royalties.example")).toHaveTextContent(
        "Sun, Oct 11, 2026"
      );
      expect(rowFor("https://rememes.example")).toHaveTextContent(
        "Sun, Oct 11, 2026"
      );
    });
  });

  it("shows no results when empty", async () => {
    mockFetch.mockResolvedValue({ count: 0, data: [] });
    renderWithQueryClient(
      <CommunityDownloadsComponent title="T" url="https://test.6529.io/data" />
    );
    expect(await screen.findByText("NoResults")).toBeInTheDocument();
  });

  it("fetches next page when pagination clicked", async () => {
    mockFetch.mockResolvedValue({
      count: 60,
      data: [{ date: "20230101", url: "https://a" }],
    });
    renderWithQueryClient(
      <CommunityDownloadsComponent title="T" url="https://test.6529.io/data" />
    );
    await screen.findByText("https://a");
    mockFetch.mockResolvedValue({
      count: 60,
      data: [{ date: "20230102", url: "https://testB.6529.io" }],
    });
    await userEvent.click(screen.getByTestId("pager"));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenLastCalledWith(
        "https://test.6529.io/data?page_size=25&page=2"
      )
    );
  });
});
