import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("@/helpers/SeizeLinkParser", () => ({
  ensureStableSeizeLink: jest.fn((href: string) => href),
}));

jest.mock("@/helpers/Helpers", () => ({
  removeBaseEndpoint: jest.fn((link: string) => link),
}));

import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";

const writeText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText },
});

const { ensureStableSeizeLink } = require("@/helpers/SeizeLinkParser");
const { removeBaseEndpoint } = require("@/helpers/Helpers");

describe("ChatItemHrefButtons", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("copies link to clipboard", () => {
    render(<ChatItemHrefButtons href="https://a" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledWith("https://a");
  });

  it("renders external link when no relative href", () => {
    render(<ChatItemHrefButtons href="https://a" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://a");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("uses relative href when provided", () => {
    render(<ChatItemHrefButtons href="https://a" relativeHref="/local" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/local");
    expect(link).not.toHaveAttribute("target");
  });

  it("derives a relative href from a stable seize link", () => {
    (ensureStableSeizeLink as jest.Mock).mockReturnValueOnce(
      "https://base.com/waves?id=1"
    );
    (removeBaseEndpoint as jest.Mock).mockReturnValueOnce("/waves?id=1");

    render(<ChatItemHrefButtons href="https://incoming" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/waves?id=1");
    expect(link).not.toHaveAttribute("target");
    expect(ensureStableSeizeLink).toHaveBeenCalledWith("https://incoming");
    expect(removeBaseEndpoint).toHaveBeenCalledWith(
      "https://base.com/waves?id=1"
    );
  });

  it("does not bubble clicks to parent containers", () => {
    const parentClick = jest.fn();
    render(
      <div
        onClick={parentClick}
        onKeyDown={parentClick}
        role="button"
        tabIndex={0}>
        <ChatItemHrefButtons href="https://a" />
      </div>
    );

    fireEvent.click(screen.getByRole("button"));
    expect(parentClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("link"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
