import { render, screen } from "@testing-library/react";
import UserPageXtdhReceived from "@/components/xtdh/user/received";

describe("UserPageXtdhReceived", () => {
  it("renders helper text and info icon", () => {
    render(<UserPageXtdhReceived profileId="simo" />);

    expect(
      screen.getByText(
        /This shows NFTs held by this identity that have received xTDH grants from others\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        /When others grant xTDH to NFT collections, any holder of those NFTs receives xTDH generation capacity/i,
      ),
    ).toBeInTheDocument();
  });
});
