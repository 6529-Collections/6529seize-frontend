import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ArtistActivityBadge } from "@/components/waves/drops/ArtistActivityBadge";

jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ hasTouchScreen: false })),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, ...props }: any) => (
    <div data-testid="tooltip" {...props}>
      {children}
    </div>
  ),
}));

describe("ArtistActivityBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when there are no submissions or wins", () => {
    const { container } = render(
      <ArtistActivityBadge submissionCount={0} winCount={0} onBadgeClick={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders palette state for submissions only and opens active tab", () => {
    const onBadgeClick = jest.fn();
    const { container } = render(
      <ArtistActivityBadge submissionCount={2} winCount={0} onBadgeClick={onBadgeClick} />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "View 2 art submissions");

    const paletteIcon = container.querySelector('svg[data-icon="palette"]');
    expect(paletteIcon).toBeInTheDocument();

    fireEvent.click(button);
    expect(onBadgeClick).toHaveBeenCalledWith("active");
  });

  it("renders trophy state for wins only and opens winners tab", () => {
    const onBadgeClick = jest.fn();
    const { container } = render(
      <ArtistActivityBadge submissionCount={0} winCount={3} onBadgeClick={onBadgeClick} />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "View 3 winning artworks");

    const trophyIcon = container.querySelector('svg[data-icon="trophy"]');
    expect(trophyIcon).toBeInTheDocument();

    fireEvent.click(button);
    expect(onBadgeClick).toHaveBeenCalledWith("winners");
  });

  it("renders trophy with blue dot for both states and opens active tab", () => {
    const onBadgeClick = jest.fn();
    const { container } = render(
      <ArtistActivityBadge submissionCount={1} winCount={1} onBadgeClick={onBadgeClick} />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      "View 1 art submission and 1 winning artwork"
    );

    const trophyIcon = container.querySelector('svg[data-icon="trophy"]');
    expect(trophyIcon).toBeInTheDocument();

    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();

    fireEvent.click(button);
    expect(onBadgeClick).toHaveBeenCalledWith("active");
  });

  it("does not render tooltip on mobile or touch devices", () => {
    const useIsMobileDevice = require("@/hooks/isMobileDevice").default;
    const useDeviceInfo = require("@/hooks/useDeviceInfo").default;
    useIsMobileDevice.mockReturnValue(true);
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });

    render(
      <ArtistActivityBadge submissionCount={1} winCount={0} onBadgeClick={jest.fn()} />
    );

    expect(screen.queryByTestId("tooltip")).not.toBeInTheDocument();
  });
});
