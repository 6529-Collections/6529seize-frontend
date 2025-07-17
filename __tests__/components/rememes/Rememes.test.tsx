import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Rememes, { RememeSort } from "@/components/rememes/Rememes";
import { fetchUrl } from "@/services/6529api";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/services/6529api");
jest.mock("@/components/nft-image/RememeImage", () => () => (
  <div data-testid="img" />
));
jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination" onClick={() => props.setPage(2)} />
));

(fetchUrl as jest.Mock).mockImplementation((url: string) => {
  if (url.includes("memes_lite")) return Promise.resolve({ data: [] });
  return Promise.resolve({
    count: 1,
    data: [
      {
        contract: "0x",
        id: 1,
        metadata: {},
        contract_opensea_data: {},
        replicas: [],
        image: "",
      },
    ],
  });
});

describe("Rememes component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_ENDPOINT = "https://test.6529.io";
    global.fetch = jest.fn(() => Promise.resolve({ json: () => ({}) } as any));
  });

  it("fetches rememes and changes sorting", async () => {
    render(<Rememes />);
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(fetchUrl).toHaveBeenCalledWith(
      "https://test.6529.io/api/rememes?page_size=40&page=1"
    );
    await screen.findByText("Sort: Random");
    await userEvent.click(screen.getByText("Sort: Random"));
    await userEvent.click(screen.getByText(RememeSort.CREATED_ASC));
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://test.6529.io/api/rememes?page_size=40&page=1&sort=created_at&sort_direction=desc"
      )
    );
  });
});
