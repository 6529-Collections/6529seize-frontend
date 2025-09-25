import Rememes, { RememeSort } from "@/components/rememes/Rememes";
import { TitleProvider } from "@/contexts/TitleContext";
import { fetchUrl } from "@/services/6529api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue(undefined),
  }),
  usePathname: jest.fn().mockReturnValue("/rememes"),
}));
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));
jest.mock("@/components/nft-image/RememeImage", () => () => (
  <div data-testid="img" />
));
jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination" onClick={() => props.setPage(2)} />
));
jest.mock("@/components/lfg-slideshow/LFGSlideshow", () => ({
  LFGButton: () => <div data-testid="lfg-button" />,
}));
jest.mock("@/components/collections-dropdown/CollectionsDropdown", () => () => (
  <div data-testid="collections-dropdown" />
));
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

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
    global.fetch = jest.fn(() => Promise.resolve({ json: () => ({}) } as any));
  });

  it("fetches rememes and changes sorting", async () => {
    render(
      <TitleProvider>
        <Rememes />
      </TitleProvider>
    );
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(fetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/rememes?page_size=40&page=1"
    );
    await screen.findByText("Sort: Random");
    await userEvent.click(screen.getByText("Sort: Random"));
    await userEvent.click(screen.getByText(RememeSort.CREATED_ASC));
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/rememes?page_size=40&page=1&sort=created_at&sort_direction=desc"
      )
    );
  });
});
