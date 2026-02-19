import { render, screen, fireEvent } from "@testing-library/react";
import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";

const writeText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText },
});

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

  it("renders and triggers preview toggle action from context", () => {
    const onToggle = jest.fn();
    render(
      <LinkPreviewProvider
        previewToggle={{
          canToggle: true,
          isHidden: false,
          isLoading: false,
          label: "Hide link previews",
          onToggle,
        }}
      >
        <ChatItemHrefButtons href="https://a" />
      </LinkPreviewProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide link previews" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
