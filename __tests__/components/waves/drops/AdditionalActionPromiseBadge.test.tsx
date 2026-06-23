import type { ReactElement, ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";

jest.mock("@/components/utils/tooltip/CustomTooltip", () => ({
  __esModule: true,
  default: ({
    children,
    content,
    delayShow,
    placement,
  }: {
    readonly children: ReactElement;
    readonly content: ReactNode;
    readonly delayShow?: number;
    readonly placement?: string;
  }) => (
    <span
      data-testid="custom-tooltip"
      data-content={typeof content === "string" ? content : undefined}
      data-delay-show={delayShow}
      data-placement={placement}
    >
      {children}
    </span>
  ),
}));

describe("AdditionalActionPromiseBadge", () => {
  it("shows the badge with explanatory tooltip copy", () => {
    render(<AdditionalActionPromiseBadge />);

    const tooltip = screen.getByTestId("custom-tooltip");
    const badge = screen.getByText("Additional Action");

    expect(tooltip).toHaveAttribute(
      "data-content",
      "The creator marked this submission as promising an extra action beyond the artwork, such as an event, donation, physical item, airdrop, or future deliverable."
    );
    expect(tooltip).toHaveAttribute("data-placement", "top");
    expect(tooltip).toHaveAttribute("data-delay-show", "200");
    expect(badge).toHaveAttribute("tabindex", "0");
    expect(badge).toHaveClass("tw-cursor-help");
  });

  it("can disable keyboard focus when rendered inside another focus target", () => {
    render(<AdditionalActionPromiseBadge focusable={false} />);

    expect(screen.getByText("Additional Action")).not.toHaveAttribute(
      "tabindex"
    );
  });
});
