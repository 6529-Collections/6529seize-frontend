import { render, screen } from "@testing-library/react";
import React from "react";

import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";
import MarketplacePreviewPlaceholder from "@/components/waves/marketplace/MarketplacePreviewPlaceholder";
import MarketplaceUnavailableCard from "@/components/waves/marketplace/MarketplaceUnavailableCard";

describe("Marketplace placeholder cards", () => {
  it("renders stable media frame in non-compact placeholder mode", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplacePreviewPlaceholder
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          compact={false}
        />
      </LinkPreviewProvider>
    );

    const media = screen.getByTestId("marketplace-preview-placeholder-media");
    expect(media).toHaveClass("tw-aspect-[16/9]");
    expect(media).toHaveClass("tw-min-h-[14rem]");
  });

  it("keeps placeholder layout the same in compact mode", () => {
    render(
      <MarketplacePreviewPlaceholder
        href="https://manifold.xyz/@andrew-hooker/id/4098474224"
        compact={true}
      />
    );

    expect(
      screen.getByTestId("marketplace-preview-placeholder-media")
    ).toBeInTheDocument();
  });

  it("renders stable unavailable card with compact mode support", () => {
    render(
      <MarketplaceUnavailableCard
        href="https://manifold.xyz/@andrew-hooker/id/4098474224"
        compact={true}
      />
    );

    const media = screen.getByTestId("marketplace-preview-unavailable-media");
    expect(media).toHaveClass("tw-aspect-[16/9]");
    expect(media).toHaveClass("tw-min-h-[14rem]");
    expect(screen.getByText("Preview unavailable")).toBeInTheDocument();
  });
});
