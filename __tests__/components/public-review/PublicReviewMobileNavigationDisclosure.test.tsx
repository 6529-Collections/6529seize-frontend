import { act, render, screen } from "@testing-library/react";

import { PublicReviewMobileNavigationDisclosure } from "@/components/public-review/PublicReviewMobileNavigationDisclosure";

describe("PublicReviewMobileNavigationDisclosure", () => {
  let onChange: ((event: MediaQueryListEvent) => void) | undefined;

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn(() => ({
        matches: false,
        media: "(max-width: 1023px)",
        onchange: null,
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void
        ) => {
          onChange = listener;
        },
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it("closes when the viewport enters the mobile layout", () => {
    render(
      <PublicReviewMobileNavigationDisclosure resetKey="overview">
        <summary>Review navigation</summary>
        <div>Navigation links</div>
      </PublicReviewMobileNavigationDisclosure>
    );

    const disclosure = screen.getByText("Review navigation").closest("details");
    expect(disclosure).not.toBeNull();
    if (!disclosure) {
      return;
    }

    disclosure.open = true;
    act(() => {
      onChange?.({ matches: true } as MediaQueryListEvent);
    });

    expect(disclosure.open).toBe(false);
  });

  it("closes after navigating to another review page", () => {
    const { rerender } = render(
      <PublicReviewMobileNavigationDisclosure resetKey="overview">
        <summary>Review navigation</summary>
      </PublicReviewMobileNavigationDisclosure>
    );
    const disclosure = screen.getByText("Review navigation").closest("details");
    expect(disclosure).not.toBeNull();
    if (!disclosure) {
      return;
    }

    disclosure.open = true;
    rerender(
      <PublicReviewMobileNavigationDisclosure resetKey="community-review">
        <summary>Review navigation</summary>
      </PublicReviewMobileNavigationDisclosure>
    );

    expect(disclosure.open).toBe(false);
  });
});
