import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LatestActivity from "../../../components/latest-activity/LatestActivity";
import { fetchUrl, fetchAllPages } from "../../../services/6529api";
import { commonApiFetch } from "../../../services/api/common-api";

jest.mock("../../../services/6529api");
jest.mock("../../../services/api/common-api");
jest.mock(
  "../../../components/latest-activity/LatestActivityRow",
  () => (props: any) => <tr data-testid="row" />
);
jest.mock("../../../components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination" onClick={() => props.setPage(2)} />
));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

(fetchAllPages as jest.Mock).mockResolvedValue([]);
(fetchUrl as jest.Mock).mockResolvedValue({ count: 1, data: [] });
(commonApiFetch as jest.Mock).mockResolvedValue({ data: [] });

describe("LatestActivity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_ENDPOINT = "https://test.6529.io";
  });

  it("fetches with filters and updates on selection", async () => {
    render(<LatestActivity page={1} pageSize={10} showMore />);
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(fetchUrl).toHaveBeenCalledWith(
      "https://test.6529.io/api/transactions?page_size=10&page=1"
    );
    await userEvent.click(screen.getByText("Collection: All"));
    await userEvent.click(screen.getByText("Memes"));
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://test.6529.io/api/transactions?page_size=10&page=1&contract=0x33FD426905F149f8376e227d0C9D3340AaD17aF1"
      )
    );
  });

  it("hides View All link on nft-activity page", async () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/nft-activity" },
    });
    render(<LatestActivity page={1} pageSize={10} showMore />);
    // Wait for fetch
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(screen.queryByText("View All")).toBeNull();
  });
});
