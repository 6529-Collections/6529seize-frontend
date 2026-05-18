import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  readonly unoptimized?: boolean;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ unoptimized, ...props }: MockImageProps) => (
    <img alt={props.alt ?? ""} {...props} data-unoptimized={unoptimized} />
  ),
}));

jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ id, content }: { id: string; content: string }) => (
    <div data-testid={`tooltip-${id}`}>{content}</div>
  ),
}));

describe("NFTMarketplaceLinks", () => {
  it("adds react-tooltip triggers to marketplace icon links", () => {
    render(<NFTMarketplaceLinks contract="0xabc" id={1} />);

    const openSeaLink = screen.getByRole("link", { name: "Open OpenSea" });
    const tooltipId = openSeaLink.getAttribute("data-tooltip-id");

    expect(tooltipId).not.toBeNull();
    if (!tooltipId) {
      throw new Error("Expected OpenSea tooltip id");
    }

    expect(screen.getByTestId(`tooltip-${tooltipId}`)).toHaveTextContent(
      "OpenSea"
    );
  });
});
