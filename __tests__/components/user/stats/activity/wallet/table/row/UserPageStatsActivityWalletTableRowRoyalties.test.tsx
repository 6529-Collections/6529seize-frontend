import UserPageStatsActivityWalletTableRowRoyalties from "@/components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowRoyalties";
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
      data-testid={`tooltip-${id}`}
      data-tooltip-background={style.background}
      data-tooltip-padding={style.padding}
    >
      {children}
    </div>
  ),
}));

describe("UserPageStatsActivityWalletTableRowRoyalties", () => {
  it("returns null when no royalties", () => {
    const { container } = render(
      <UserPageStatsActivityWalletTableRowRoyalties
        royalties={0}
        transactionValue={1}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows the smile icon and shared tooltip below the threshold", () => {
    render(
      <UserPageStatsActivityWalletTableRowRoyalties
        royalties={0.05}
        transactionValue={1}
      />
    );

    const tooltip = screen.getByTestId(/tooltip-.*royalties-information/);

    expect(screen.getByAltText("pepe-smile")).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Royalties:");
    expect(tooltip).toHaveAttribute("data-tooltip-background", "#37373E");
    expect(tooltip).toHaveAttribute("data-tooltip-padding", "4px 8px");
  });

  it("shows the xglasses icon above the threshold", () => {
    render(
      <UserPageStatsActivityWalletTableRowRoyalties
        royalties={0.1}
        transactionValue={1}
      />
    );

    expect(screen.getByAltText("pepe-xglasses")).toBeInTheDocument();
  });
});
