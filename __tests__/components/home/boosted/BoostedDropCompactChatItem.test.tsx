import BoostedDropCompactChatItem from "@/components/home/boosted/BoostedDropCompactChatItem";
import { render, screen } from "@testing-library/react";

const createDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "drop-1",
    serial_no: 42,
    title: null,
    boosts: 7,
    author: {
      handle: "alice",
    },
    parts: [
      {
        content: "Plain text content",
        media: [],
      },
    ],
    ...overrides,
  }) as any;

describe("BoostedDropCompactChatItem", () => {
  it("renders compact boost metadata and a hover preview lane", () => {
    render(
      <BoostedDropCompactChatItem drop={createDrop()} onClick={jest.fn()} />
    );

    expect(
      screen.getByRole("button", { name: "Open boosted drop from alice" })
    ).toBeInTheDocument();
    expect(screen.getByText("Boosted drop")).toBeInTheDocument();
    expect(screen.getByText("by alice")).toBeInTheDocument();
    expect(screen.getByText("7 boosts")).toBeInTheDocument();
    expect(screen.getAllByText("Plain text content")).toHaveLength(2);

    const row = screen.getByTestId("boosted-drop-compact-chat-item");
    expect(
      row.querySelector('[data-boosted-drop-compact-summary="true"]')
    ).toHaveClass(
      "desktop-hover:group-hover:tw-opacity-0",
      "group-focus-visible:tw-opacity-0"
    );
    expect(
      row.querySelector('[data-boosted-drop-compact-preview="true"]')
    ).toHaveClass(
      "desktop-hover:group-hover:tw-opacity-100",
      "group-focus-visible:tw-opacity-100"
    );
    expect(
      row.querySelector('[data-boosted-drop-compact-preview-track="true"]')
    ).toHaveClass(
      "desktop-hover:group-hover:tw-animate-boosted-preview-marquee",
      "group-focus-visible:tw-animate-boosted-preview-marquee",
      "motion-reduce:tw-animate-none"
    );
  });

  it("uses a plain-text preview from markdown content", () => {
    render(
      <BoostedDropCompactChatItem
        drop={createDrop({
          title: "Daily note",
          parts: [
            {
              content: "**Read** [this](https://example.com/article)",
              media: [],
            },
          ],
        })}
        onClick={jest.fn()}
      />
    );

    expect(
      screen.getAllByText("Daily note: Read this (https://example.com/article)")
    ).toHaveLength(2);
  });

  it("keeps media-only drops as a compact row without preview text", () => {
    render(
      <BoostedDropCompactChatItem
        drop={createDrop({
          parts: [
            {
              content: null,
              media: [
                { mime_type: "image/png", url: "https://example.com/a.png" },
              ],
            },
          ],
        })}
        onClick={jest.fn()}
      />
    );

    expect(screen.getByText("Boosted drop")).toBeInTheDocument();
    expect(screen.queryByText("Plain text content")).not.toBeInTheDocument();
    expect(
      screen
        .getByTestId("boosted-drop-compact-chat-item")
        .querySelector('[data-boosted-drop-compact-preview="true"]')
    ).not.toBeInTheDocument();
  });
});
