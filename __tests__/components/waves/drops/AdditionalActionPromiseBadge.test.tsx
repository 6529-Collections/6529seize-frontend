import type { CSSProperties, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const BADGE_LABEL = t(DEFAULT_LOCALE, "drops.additionalActionBadge.label");
const TOOLTIP_COPY = t(DEFAULT_LOCALE, "drops.additionalActionBadge.tooltip");

jest.mock("react-tooltip", () => ({
  Tooltip: ({
    children,
    id,
    delayShow,
    place,
    style,
  }: {
    readonly children: ReactNode;
    readonly id: string;
    readonly delayShow?: number;
    readonly place?: string;
    readonly style?: CSSProperties;
  }) => (
    <span
      id={id}
      data-testid="shared-tooltip"
      data-delay-show={delayShow}
      data-placement={place}
      data-shared-styles={style === TOOLTIP_STYLES}
    >
      {children}
    </span>
  ),
}));

describe("AdditionalActionPromiseBadge", () => {
  it("shows the badge with explanatory tooltip copy", () => {
    const markup = renderToStaticMarkup(<AdditionalActionPromiseBadge />);
    const descriptionId = markup.match(/aria-describedby="([^"]+)"/)?.[1];
    const tooltipId = markup.match(/data-tooltip-id="([^"]+)"/)?.[1];

    expect(tooltipId).toBeTruthy();
    expect(markup).toContain(`id="${tooltipId}" data-testid="shared-tooltip"`);
    expect(markup).toContain('data-placement="top"');
    expect(markup).toContain('data-delay-show="200"');
    expect(markup).toContain(
      `data-shared-styles="true">${TOOLTIP_COPY}</span>`
    );
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
