import LatestActivity from "@/components/latest-activity/LatestActivity";
import { MEMES_CONTRACT } from "@/constants/constants";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";

const mockNftMarketActivity = jest.fn(
  ({ contract, filter }: { contract?: string; filter: string }) => (
    <div
      data-testid="nft-market-activity"
      data-contract={contract ?? "all"}
      data-filter={filter}
    />
  )
);

jest.mock("@/components/nft-market-activity/NftMarketActivity", () => ({
  __esModule: true,
  default: (props: { contract?: string; filter: string }) =>
    mockNftMarketActivity(props),
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("LatestActivity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the merged all-collection activity feed", () => {
    render(<LatestActivity page={1} pageSize={50} showMore />);

    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-contract",
      "all"
    );
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-filter",
      "all"
    );
    expect(screen.getByRole("link", { name: "View All" })).toHaveAttribute(
      "href",
      "/nft-activity"
    );
  });

  it("maps collection and marketplace action filters to the API", async () => {
    const user = userEvent.setup();
    render(<LatestActivity page={1} pageSize={50} showMore />);

    await user.click(
      screen.getByRole("button", { name: "Collection: All Collections" })
    );
    await user.click(screen.getByRole("menuitem", { name: "The Memes" }));
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-contract",
      MEMES_CONTRACT
    );

    await user.click(
      screen.getByRole("button", { name: "Activity type: All activity" })
    );
    await user.click(screen.getByRole("menuitem", { name: "Offers" }));
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-filter",
      "offers"
    );
  });

  it("hides the View All link on the dedicated activity page", () => {
    mockUsePathname.mockReturnValue("/nft-activity");
    render(<LatestActivity page={1} pageSize={50} showMore />);
    expect(
      screen.queryByRole("link", { name: "View All" })
    ).not.toBeInTheDocument();
  });
});
