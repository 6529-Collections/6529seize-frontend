import { render, screen } from "@testing-library/react";
import UserCICTypeIconTooltipHeaders from "@/components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltipHeaders";

describe("UserCICTypeIconTooltipHeaders", () => {
  it("displays tooltip header text", () => {
    render(<UserCICTypeIconTooltipHeaders />);
    expect(screen.getByText("Network ID Check")).toBeInTheDocument();
    expect(
      screen.getByText(/Does the community believe this profile/i)
    ).toBeInTheDocument();
  });
});
