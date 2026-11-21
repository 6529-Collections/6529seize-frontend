import {
  ValidatorBadge,
  type ValidatorBadgeData,
} from "@/components/waves/drops/ValidatorBadge";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: { readonly children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("ValidatorBadge", () => {
  const defaultValidator: ValidatorBadgeData = {
    isValidator: true,
    lastQualifyingCycle: 100,
    qualifyingDays: 42,
    observedThroughCycle: 105,
  };

  it("renders circular badge with accessible name when validator is true", () => {
    const onBadgeClick = jest.fn();

    render(
      <ValidatorBadge validator={defaultValidator} onBadgeClick={onBadgeClick} />
    );

    const badge = screen.getByRole("button", {
      name: "View validator details.",
    });

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("tw-rounded-full", "tw-size-5");
  });

  it("renders nothing when isValidator is false", () => {
    const onBadgeClick = jest.fn();
    const nonValidator: ValidatorBadgeData = {
      isValidator: false,
    };

    const { container } = render(
      <ValidatorBadge validator={nonValidator} onBadgeClick={onBadgeClick} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole("button", { name: /validator/i })
    ).not.toBeInTheDocument();
  });

  it("calls onBadgeClick when clicked", () => {
    const onBadgeClick = jest.fn();

    render(
      <ValidatorBadge validator={defaultValidator} onBadgeClick={onBadgeClick} />
    );

    const badge = screen.getByRole("button", {
      name: "View validator details.",
    });

    fireEvent.click(badge);

    expect(onBadgeClick).toHaveBeenCalledTimes(1);
  });

  it("uses success color token for the icon", () => {
    render(
      <ValidatorBadge
        validator={defaultValidator}
        onBadgeClick={jest.fn()}
      />
    );

    const badge = screen.getByRole("button", {
      name: "View validator details.",
    });

    expect(badge).toHaveClass("tw-text-success");
  });

  it("renders compact size when specified", () => {
    render(
      <ValidatorBadge
        validator={defaultValidator}
        onBadgeClick={jest.fn()}
        size="compact"
      />
    );

    const badge = screen.getByRole("button", {
      name: "View validator details.",
    });

    expect(badge).toHaveClass("tw-size-[18px]");
  });

  it("has aria-hidden SVG icon", () => {
    render(
      <ValidatorBadge
        validator={defaultValidator}
        onBadgeClick={jest.fn()}
      />
    );

    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("does not render badge when validator data is null/undefined", () => {
    const nullValidator: ValidatorBadgeData = {
      isValidator: false,
      lastQualifyingCycle: null,
      qualifyingDays: null,
      observedThroughCycle: null,
    };

    const { container } = render(
      <ValidatorBadge validator={nullValidator} onBadgeClick={jest.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
