import UserPageStatsActivityWalletTableRowGas from "@/components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowGas";
import { render, screen } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";

jest.mock("react-tooltip", () => ({
  Tooltip: ({
    children,
    id,
    style,
  }: {
    children: ReactNode;
    id: string;
    style: CSSProperties;
  }) => (
    <div
      data-testid="react-tooltip"
      data-tooltip-id={id}
      data-tooltip-background={style.background}
      data-tooltip-padding={style.padding}
    >
      {children}
    </div>
  ),
}));

describe("UserPageStatsActivityWalletTableRowGas", () => {
  it("shows gas information with the shared tooltip style", () => {
    render(
      <UserPageStatsActivityWalletTableRowGas
        gas={1.23456}
        gasGwei={123}
        gasPriceGwei={45.67}
      />
    );

    const trigger = screen.getByRole("button", { name: "Gas Information" });
    const tooltip = screen.getByTestId("react-tooltip");

    expect(trigger).toHaveAttribute(
      "data-tooltip-id",
      tooltip.getAttribute("data-tooltip-id")
    );
    expect(tooltip).toHaveAttribute("data-tooltip-background", "#37373E");
    expect(tooltip).toHaveAttribute("data-tooltip-padding", "4px 8px");
    expect(tooltip).toHaveTextContent("Gas");
    expect(tooltip).toHaveTextContent("1.23456");
    expect(tooltip).toHaveTextContent("123");
    expect(tooltip).toHaveTextContent("45.67");
  });
});
