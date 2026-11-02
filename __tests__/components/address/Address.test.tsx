import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Address from "@/components/address/Address";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (p: any) => <img {...p} />,
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (p: any) => <svg {...p} />,
}));

jest.mock("@/helpers/Helpers", () => ({
  numberWithCommas: (n: number) => String(n),
  parseEmojis: (s: string) => s,
}));

jest.mock("@/components/address/WalletAddress", () => ({
  WalletAddress: (props: any) => (
    <div data-testid="wallet" {...props}>
      {props.display}
    </div>
  ),
}));

const baseTags = {
  memesCardsSets: 0,
  memesCardsSetS1: 0,
  memesCardsSetS2: 0,
  memesCardsSetS3: 0,
  memesCardsSetS4: 0,
  memesCardsSetS5: 0,
  memesCardsSetS6: 0,
  memesBalance: 0,
  genesis: 0,
  gradientsBalance: 0,
};

describe("Address component", () => {
  it("renders single wallet via WalletAddress", () => {
    render(<Address wallets={["0x1"]} display="Alice" />);
    expect(screen.getByTestId("wallet")).toHaveTextContent("Alice");
  });

  it.each([2, 4])(
    "expands and shows all %i wallets when dropdown image clicked",
    async (walletCount) => {
      const user = userEvent.setup();
      const addresses = ["0x1", "0x2", "0x3", "0x4"] as const;
      render(
        <Address
          wallets={addresses.slice(0, walletCount)}
          display="A - B - C - D"
        />
      );
      expect(screen.queryAllByTestId("wallet")).toHaveLength(0);
      await user.click(screen.getByAltText("consolidation"));
      const wallets = screen.getAllByTestId("wallet");
      expect(wallets).toHaveLength(walletCount);
      addresses.slice(0, walletCount).forEach((address, index) => {
        expect(wallets[index]).toHaveTextContent(address);
      });
    }
  );

  it("shows all four wallets without expansion on a profile page", () => {
    render(
      <Address
        wallets={["0x1", "0x2", "0x3", "0x4"]}
        display="a.eth - b.eth - c.eth - d.eth"
        isUserPage
      />
    );
    expect(screen.getAllByTestId("wallet")).toHaveLength(4);
    expect(screen.getByText("d.eth")).toBeInTheDocument();
  });

  it("renders consolidated display text as text, not markup", () => {
    const display = '<img src="x" onerror="alert(1)"> a.eth';
    const { container } = render(
      <Address wallets={["0x1", "0x2"]} display={display} isUserPage />
    );
    expect(screen.getAllByText(display).length).toBeGreaterThan(0);
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });

  it("shows rank tag when expandedTags true", () => {
    render(
      <Address
        wallets={["0x1"]}
        display="A"
        tags={{ ...baseTags, balance_rank: 1 }}
        expandedTags
      />
    );
    expect(screen.getByText("All Cards Rank #1")).toBeInTheDocument();
  });
});
