import { fireEvent, render, screen } from "@testing-library/react";
import { GrantItemContent } from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/subcomponents/GrantItemContent";
import type { GrantItemContentProps } from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/types";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";

const props: GrantItemContentProps = {
  contract: {
    address: "0xe5b281fa9117e8dA3d0502c2C4bB2831e391b471",
    name: "Errormendments",
    imageUrl: "https://res.cloudinary.com/alchemyapi/collection.png",
  },
  status: ApiXTdhGrantStatus.Granted,
  details: {
    tokenTypeLabel: "ERC721",
    totalSupplyLabel: "20",
    floorPriceLabel: "0",
    tokensCountLabel: "20",
    tdhRateLabel: "5",
    totalGrantedLabel: "20",
    validFromLabel: "Oct 9",
  },
};

describe("Grant collection thumbnail", () => {
  it("replaces failed artwork with the existing NFT tile and recovers a new source", () => {
    const { rerender } = render(<GrantItemContent {...props} />);
    fireEvent.error(screen.getByRole("img", { name: "Errormendments" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("NFT")).toBeVisible();
    expect(screen.getByText("Errormendments")).toBeVisible();
    rerender(<GrantItemContent {...props} contract={{ ...props.contract }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    rerender(
      <GrantItemContent
        {...props}
        contract={{
          ...props.contract,
          imageUrl: "https://res.cloudinary.com/alchemyapi/replacement.png",
        }}
      />
    );
    expect(screen.getByRole("img", { name: "Errormendments" })).toBeVisible();
    expect(screen.queryByText("NFT")).not.toBeInTheDocument();
  });

  it("keeps the collection name with the decorative missing-artwork tile", () => {
    render(
      <GrantItemContent
        {...props}
        contract={{ ...props.contract, imageUrl: null }}
      />
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("NFT")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Errormendments")).toBeVisible();
  });
});
