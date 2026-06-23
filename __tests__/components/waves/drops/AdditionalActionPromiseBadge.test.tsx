import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const BADGE_LABEL = t(DEFAULT_LOCALE, "drops.additionalActionBadge.label");
const TOOLTIP_COPY = t(DEFAULT_LOCALE, "drops.additionalActionBadge.tooltip");

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
    const descriptionId = markup.match(/aria-describedby="([^"]+)"/)?.[1];

    expect(markup).toContain('data-testid="custom-tooltip"');
    expect(markup).toContain(`data-content="${TOOLTIP_COPY}"`);
    expect(markup).toContain('data-placement="top"');
    expect(markup).toContain('data-delay-show="200"');
    expect(markup).toContain("<button");
    expect(markup).toContain('type="button"');
    expect(markup).toContain("tw-cursor-help");
    expect(markup).toContain(BADGE_LABEL);
    expect(descriptionId).toBeTruthy();
    expect(markup).toContain(
      `<span id="${descriptionId}" class="tw-sr-only">${TOOLTIP_COPY}</span>`
    );
  });

  it("can disable keyboard focus when rendered inside another focus target", () => {
    const markup = renderToStaticMarkup(
      <AdditionalActionPromiseBadge focusable={false} />
    );
    const descriptionId = markup.match(/aria-describedby="([^"]+)"/)?.[1];

    expect(markup).toContain(`<span aria-describedby="${descriptionId}"`);
    expect(descriptionId).toBeTruthy();
    expect(markup).toContain(
      `<span id="${descriptionId}" class="tw-sr-only">${TOOLTIP_COPY}</span>`
    );
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("tabindex=");
  });
});
