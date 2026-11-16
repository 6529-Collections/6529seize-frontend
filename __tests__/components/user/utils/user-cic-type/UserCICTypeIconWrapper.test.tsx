import { render, screen } from "@testing-library/react";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/user/utils/user-cic-type/UserCICTypeIcon", () => ({
  __esModule: true,
  default: ({ cic }: { cic: number }) => <div data-testid="icon">{cic}</div>,
}));

jest.mock(
  "@/components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltip",
  () => ({
    __esModule: true,
    default: ({ profile }: { profile: ApiIdentity }) => (
      <div data-testid="tooltip">{profile.cic}</div>
    ),
  })
);

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

describe("UserCICTypeIconWrapper", () => {
  it("renders icon with react-tooltip", () => {
    const profile = { cic: 0, id: "test-id" } as ApiIdentity;
    render(<UserCICTypeIconWrapper profile={profile} />);

    expect(
      screen.getByRole("button", { name: "Network ID Check details" })
    ).toHaveClass("tw-size-5");

    // Check that the icon is rendered
    expect(screen.getByTestId("icon")).toBeInTheDocument();

    // Check that the react-tooltip is rendered
    const tooltip = screen.getByTestId("react-tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute(
      "data-tooltip-id",
      "user-cic-type-tooltip-test-id"
    );

    // Check that the tooltip content is rendered
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });
  it("keeps an overridden score consistent in the icon and tooltip", () => {
    const profile = { cic: 10, id: "score-change" } as ApiIdentity;
    render(<UserCICTypeIconWrapper profile={profile} cic={-10} />);
    expect(screen.getByTestId("icon")).toHaveTextContent("-10");
    expect(screen.getByTestId("tooltip")).toHaveTextContent("-10");
    expect(screen.getByTestId("react-tooltip")).toHaveAttribute(
      "data-tooltip-id",
      "user-cic-type-tooltip-score-change-score--10"
    );
    expect(profile.cic).toBe(10);
  });
});
