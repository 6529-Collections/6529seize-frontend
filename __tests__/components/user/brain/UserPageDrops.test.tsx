import { render } from "@testing-library/react";
import UserPageDrops from "@/components/user/brain/UserPageDrops";

jest.mock("@/components/drops/view/Drops", () => ({
  __esModule: true,
  default: () => <div data-testid="drops" />,
}));
jest.mock("@/components/user/brain/UserPageBrainSidebar", () => ({
  __esModule: true,
  default: () => <div data-testid="brain-sidebar" />,
}));

describe("UserPageDrops", () => {
  it("renders Drops when profile has handle", () => {
    const { getByTestId } = render(
      <UserPageDrops profile={{ handle: "test" } as any} />
    );
    expect(getByTestId("drops")).toBeInTheDocument();
    expect(getByTestId("brain-sidebar")).toBeInTheDocument();
  });

  it("hides Drops when no profile handle", () => {
    const { queryByTestId } = render(<UserPageDrops profile={null} />);
    expect(queryByTestId("drops")).toBeNull();
    expect(queryByTestId("brain-sidebar")).toBeNull();
  });
});
