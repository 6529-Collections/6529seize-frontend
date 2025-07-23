import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommunityDownloadsComponent from "@/components/community-downloads/CommunityDownloadsComponent";
import { fetchUrl } from "@/services/6529api";

jest.mock("@/services/6529api");

jest.mock("@/components/pagination/Pagination", () => ({
  __esModule: true,
  default: (p: any) => (
    <button data-testid="pager" onClick={() => p.setPage(p.page + 1)}>
      page
    </button>
  ),
}));

jest.mock("react-bootstrap", () => ({
  Container: (p: any) => <div>{p.children}</div>,
  Row: (p: any) => <div>{p.children}</div>,
  Col: (p: any) => <div>{p.children}</div>,
  Table: (p: any) => <table>{p.children}</table>,
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
    render(
      <CommunityDownloadsComponent title="T" url="https://test.6529.io/data" />
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.6529.io/data?page_size=25&page=1"
    );
    expect(
      await screen.findByText("https://testA.6529.io")
    ).toBeInTheDocument();
  });

  it("shows no results when empty", async () => {
    mockFetch.mockResolvedValue({ count: 0, data: [] });
    render(
      <CommunityDownloadsComponent title="T" url="https://test.6529.io/data" />
    );
    expect(await screen.findByText("NoResults")).toBeInTheDocument();
  });

  it("fetches next page when pagination clicked", async () => {
    mockFetch.mockResolvedValue({
      count: 60,
      data: [{ date: "20230101", url: "https://a" }],
    });
    render(
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
