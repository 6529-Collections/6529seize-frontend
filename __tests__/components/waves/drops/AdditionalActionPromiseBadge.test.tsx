import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
    const markup = renderToStaticMarkup(<AdditionalActionPromiseBadge />);

    expect(markup).toContain('data-testid="custom-tooltip"');
    expect(markup).toContain(
      'data-content="The creator marked this submission as promising an extra action beyond the artwork, such as an event, donation, physical item, airdrop, or future deliverable."'
    );
    expect(markup).toContain('data-placement="top"');
    expect(markup).toContain('data-delay-show="200"');
    expect(markup).toContain("<button");
    expect(markup).toContain('type="button"');
    expect(markup).toContain("tw-cursor-help");
    expect(markup).toContain("Additional Action");
  });

  it("can disable keyboard focus when rendered inside another focus target", () => {
    const markup = renderToStaticMarkup(
      <AdditionalActionPromiseBadge focusable={false} />
    );

    expect(markup).toContain('<span class="');
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("tabindex=");
  });
});
