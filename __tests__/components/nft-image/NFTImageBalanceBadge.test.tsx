import NFTImageBalanceBadge from "@/components/nft-image/NFTImageBalanceBadge";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/nft-image/NFTImage.module.scss", () => ({
  balance: "balance",
  balanceBigger: "balanceBigger",
  balanceInline: "balanceInline",
}));

describe("NFTImageBalanceBadge", () => {
  it("uses consistent labels for ownership states", () => {
    const { rerender } = render(
      <NFTImageBalanceBadge state="seized" balance={3} height={300} />
    );
    expect(screen.getByText("SEIZED x3")).toBeInTheDocument();

    rerender(<NFTImageBalanceBadge state="unseized" height={300} />);
    expect(screen.getByText("UNSEIZED")).toBeInTheDocument();

    rerender(<NFTImageBalanceBadge state="loading" height={300} />);
    expect(screen.getByText("...")).toBeInTheDocument();

    rerender(<NFTImageBalanceBadge state="error" height={300} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders the compact seized style from the meme artwork controls", () => {
    render(
      <NFTImageBalanceBadge
        state="seized"
        balance={3}
        height={300}
        variant="compact"
      />
    );

    const badge = screen.getByLabelText("SEIZED x3");
    expect(badge).toHaveClass(
      "tw-border-primary-400/25",
      "tw-bg-primary-400/[0.035]",
      "tw-text-primary-300/90",
      "tw-h-7",
      "tw-tracking-[0.08em]",
      "tw-uppercase"
    );
    expect(screen.getByText("x3")).toHaveClass("tw-text-primary-300/90");
  });

  it("supports a smaller compact size for grid cards", () => {
    render(
      <NFTImageBalanceBadge
        state="unseized"
        height={300}
        size="sm"
        variant="compact"
      />
    );

    expect(screen.getByText("UNSEIZED")).toHaveClass(
      "tw-h-6",
      "tw-px-2",
      "tw-text-[0.625rem]",
      "tw-tracking-[0.06em]",
      "tw-bg-white/[0.025]"
    );
  });

  it("keeps default and inline positional classes separate", () => {
    const { rerender } = render(
      <NFTImageBalanceBadge state="seized" balance={3} height={650} />
    );

    expect(screen.getByText("SEIZED x3")).toHaveClass(
      "balance",
      "balanceBigger"
    );

    rerender(
      <NFTImageBalanceBadge state="seized" balance={3} height={650} inline />
    );

    expect(screen.getByText("SEIZED x3")).toHaveClass("balanceInline");
    expect(screen.getByText("SEIZED x3")).not.toHaveClass("balance");
  });
});
