import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MEMES_CONTRACT } from "../../../constants";
import { TypeFilter } from "../../../components/latest-activity/LatestActivity";
import { MemePageActivity } from "../../../components/the-memes/MemePageActivity";

const fetchUrlMock = jest.fn();

jest.mock("../../../services/6529api", () => ({
  fetchUrl: (...args: any[]) => fetchUrlMock(...args),
}));

jest.mock("../../../components/latest-activity/LatestActivityRow", () => () => (
  <tr data-testid="activity-row" />
));

// Utility NFT object with required fields only
const nft = {
  id: 1,
  total_volume_last_24_hours: 0,
  total_volume_last_7_days: 0,
  total_volume_last_1_month: 0,
  total_volume: 0,
} as any;

beforeEach(() => {
  fetchUrlMock.mockResolvedValue({ count: 0, data: [] });
  process.env.API_ENDPOINT = "https://api.test";
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("MemePageActivity", () => {
  it("fetches activity with correct base url", async () => {
    render(<MemePageActivity show nft={nft} pageSize={10} />);

    await waitFor(() => {
      expect(fetchUrlMock).toHaveBeenCalledWith(
        `https://api.test/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=10&page=1`
      );
    });
  });

  it("updates url when filter is changed", async () => {
    render(<MemePageActivity show nft={nft} pageSize={5} />);

    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole("button", { name: /Filter/ }));
    await userEvent.click(screen.getByRole("button", { name: TypeFilter.SALES }));

    await waitFor(() => {
      expect(fetchUrlMock).toHaveBeenLastCalledWith(
        `https://api.test/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=5&page=1&filter=sales`
      );
    });
  });

  it("requests new page when pagination changes", async () => {
    fetchUrlMock.mockResolvedValueOnce({ count: 20, data: [{} as any] });
    render(<MemePageActivity show nft={nft} pageSize={10} />);
    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(screen.getByTestId("activity-row")).toBeInTheDocument());

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "2{enter}");

    await waitFor(() => {
      expect(fetchUrlMock).toHaveBeenLastCalledWith(
        `https://api.test/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=10&page=2`
      );
    });
  });
});

