import { render, screen } from "@testing-library/react";
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
      style={style}
    >
      {children}
    </span>
  ),
}));

describe("AdditionalActionPromiseBadge", () => {
  it("keeps its tooltip outside the card's clipping and stacking context", () => {
    const { container } = render(
      <div style={{ overflow: "hidden", transform: "translateY(0)" }}>
        <AdditionalActionPromiseBadge />
      </div>
    );
    const badge = screen.getByRole("button", { name: BADGE_LABEL });
    const tooltip = screen.getByTestId("shared-tooltip");

    expect(badge).toHaveAttribute("type", "button");
    expect(badge).toHaveClass("tw-cursor-help");
    expect(badge).toHaveAccessibleDescription(TOOLTIP_COPY);
    expect(badge).toHaveAttribute("data-tooltip-id", tooltip.id);
    expect(tooltip.parentElement).toBe(document.body);
    expect(container).not.toContainElement(tooltip);
    expect(tooltip).toHaveTextContent(TOOLTIP_COPY);
    expect(tooltip).toHaveAttribute("data-placement", "top");
    expect(tooltip).toHaveAttribute("data-delay-show", "200");
    expect(tooltip).toHaveAttribute("data-shared-styles", "true");
  });

  it("can layer the tooltip above a modal without changing its appearance", () => {
    render(<AdditionalActionPromiseBadge tooltipZIndex={1000002} />);

    const { style } = screen.getByTestId("shared-tooltip");
    expect(style.zIndex).toBe("1000002");
    expect(style.padding).toBe(TOOLTIP_STYLES.padding);
    expect(style.fontSize).toBe(TOOLTIP_STYLES.fontSize);
    expect(style.pointerEvents).toBe(TOOLTIP_STYLES.pointerEvents);
  });

  it("keeps the accessible description in server-rendered markup", () => {
    const markup = renderToStaticMarkup(<AdditionalActionPromiseBadge />);
    const descriptionId = markup.match(/aria-describedby="([^"]+)"/)?.[1];

    expect(descriptionId).toBeTruthy();
    expect(markup).toContain(BADGE_LABEL);
    expect(markup).toContain(
      `<span id="${descriptionId}" class="tw-sr-only">${TOOLTIP_COPY}</span>`
    );
    expect(markup).not.toContain('data-testid="shared-tooltip"');
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
