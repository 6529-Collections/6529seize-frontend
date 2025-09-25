import GradientsComponent from "@/components/6529Gradient/6529Gradient";
import { TitleProvider } from "@/contexts/TitleContext";
import { fetchAllPages } from "@/services/6529api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: () => "/6529-gradient",
}));
jest.mock("@/services/6529api", () => ({ fetchAllPages: jest.fn() }));
jest.mock("@/components/nft-image/NFTImage", () => (props: any) => (
  <div data-testid={`image-${props.nft.id}`}>{props.nft.name}</div>
));
jest.mock("@/components/address/Address", () => (props: any) => (
  <span data-testid="address">{props.display}</span>
));
jest.mock("@/components/dotLoader/DotLoader", () => () => (
  <span data-testid="loader" />
));
jest.mock("@/components/lfg-slideshow/LFGSlideshow", () => ({
  LFGButton: () => <div data-testid="lfg" />,
}));
jest.mock("@/components/collections-dropdown/CollectionsDropdown", () => () => (
  <div data-testid="dropdown" />
));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: any) => (
    <svg data-testid="icon" onClick={props.onClick} />
  ),
}));

const routerReplace = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ replace: routerReplace });
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

const nftData = [
  {
    id: 1,
    contract: "0x",
    name: "NFT1",
    owner: "0x1",
    owner_display: "A",
    boosted_tdh: 1,
    tdh_rank: 1,
  },
  {
    id: 2,
    contract: "0x",
    name: "NFT2",
    owner: "0x2",
    owner_display: "B",
    boosted_tdh: 2,
    tdh_rank: 2,
  },
];
(fetchAllPages as jest.Mock).mockResolvedValue(nftData);

beforeEach(() => {
  jest.clearAllMocks();
  (fetchAllPages as jest.Mock).mockResolvedValue(nftData);
});

const renderComponent = () => {
  return render(
    <TitleProvider>
      <GradientsComponent />
    </TitleProvider>
  );
};

describe("GradientsComponent", () => {
  it("fetches and displays NFTs then sorts descending", async () => {
    renderComponent();

    await waitFor(() => expect(fetchAllPages).toHaveBeenCalled());
    expect(fetchAllPages).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/nfts/gradients?page_size=101"
    );

    let links = await screen.findAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/6529-gradient/1");
    expect(links[1]).toHaveAttribute("href", "/6529-gradient/2");

    const icons = screen.getAllByTestId("icon");
    await userEvent.click(icons[1]); // click to switch sort direction to DESC

    await waitFor(() => {
      expect(routerReplace).toHaveBeenLastCalledWith(
        "/6529-gradient?sort=id&sort_dir=desc",
        { scroll: false }
      );
    });

    links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/6529-gradient/2");
    expect(links[1]).toHaveAttribute("href", "/6529-gradient/1");
  });

  it("sorts by TDH when selected", async () => {
    renderComponent();

    await waitFor(() => expect(fetchAllPages).toHaveBeenCalled());

    await userEvent.click(screen.getByText("TDH"));

    await waitFor(() => {
      expect(routerReplace).toHaveBeenLastCalledWith(
        "/6529-gradient?sort=tdh&sort_dir=asc",
        { scroll: false }
      );
    });

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/6529-gradient/2");
    expect(links[1]).toHaveAttribute("href", "/6529-gradient/1");
  });

  it("shows loader while fetching data", async () => {
    (fetchAllPages as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(await screen.findByTestId("loader")).toBeInTheDocument();
  });

  it("renders collections dropdown", async () => {
    renderComponent();
    await screen.findByTestId("dropdown");
    expect(screen.getByTestId("dropdown")).toBeInTheDocument();
  });
});
