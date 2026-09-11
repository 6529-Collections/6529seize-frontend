import ProfileCollectedReturnLink from "@/components/user/collected/ProfileCollectedReturnLink";
import { render, screen } from "@testing-library/react";

const mockUseCapacitor = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => mockUseCapacitor(),
}));

describe("ProfileCollectedReturnLink", () => {
  const returnTo =
    "/Shelby/collected?collection=memelab#collected-card-memelab-65";

  beforeEach(() => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false });
  });

  it("renders the mobile-web return action", () => {
    render(<ProfileCollectedReturnLink locale="en-US" returnTo={returnTo} />);

    expect(
      screen.getByRole("link", { name: "Back to Shelby's collected" })
    ).toHaveAttribute("href", returnTo);
  });

  it("defers native-app return navigation to the app header", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true });

    render(<ProfileCollectedReturnLink locale="en-US" returnTo={returnTo} />);

    expect(
      screen.queryByRole("link", { name: "Back to Shelby's collected" })
    ).not.toBeInTheDocument();
  });
});
