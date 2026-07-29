import { render, screen } from "@testing-library/react";

import { createEtherscanHandler } from "@/components/drops/view/part/dropPartMarkdown/handlers/etherscan";

const mockEtherscanLinkPreview = jest.fn(({ href }: { href: string }) => (
  <div data-testid="etherscan-link-preview" data-href={href} />
));

jest.mock("@/components/waves/etherscan/EtherscanLinkPreview", () => ({
  __esModule: true,
  default: (props: { href: string }) => mockEtherscanLinkPreview(props),
}));

describe("createEtherscanHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches only approved HTTPS Etherscan URLs", () => {
    const { match: isMatch } = createEtherscanHandler();

    expect(
      isMatch(
        "https://etherscan.io/address/0x0000000000000000000000000000000000000001"
      )
    ).toBe(true);
    expect(isMatch("https://sepolia.etherscan.io/txs")).toBe(true);
    expect(isMatch("https://foo.etherscan.io/txs")).toBe(false);
    expect(isMatch("http://etherscan.io/txs")).toBe(false);
    expect(isMatch("vitalik.eth")).toBe(false);
  });

  it("renders the Etherscan preview boundary", () => {
    const href = "https://etherscan.io/txs";
    const element = createEtherscanHandler().render(href);

    render(<>{element}</>);

    expect(mockEtherscanLinkPreview).toHaveBeenCalledWith({ href });
    expect(screen.getByTestId("etherscan-link-preview")).toHaveAttribute(
      "data-href",
      href
    );
  });
});
