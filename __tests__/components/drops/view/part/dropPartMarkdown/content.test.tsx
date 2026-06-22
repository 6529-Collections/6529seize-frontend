import { render, screen } from "@testing-library/react";

import { createMarkdownContentRenderers } from "@/components/drops/view/part/dropPartMarkdown/content";

jest.mock(
  "@/components/drops/view/item/content/DropListItemContentPart",
  () => ({
    __esModule: true,
    default: ({ part }: any) => (
      <span data-testid="content-part">{part.match}</span>
    ),
  })
);

const renderMarkdownContent = (content: string) => {
  const { renderParagraph } = createMarkdownContentRenderers({
    textSizeClass: "tw-text-sm",
    mentionedUsers: [
      {
        handle: "alice",
        handle_in_content: "alice",
      } as any,
    ],
    mentionedGroups: [],
    mentionedWaves: [],
    referencedNfts: [],
    emojiMap: [
      {
        emojis: [
          {
            id: "wave",
            skins: [{ src: "/emoji/wave.png" }],
          },
        ],
      },
    ],
    findNativeEmoji: () => null,
    isSmartLink: () => false,
  });

  return <>{renderParagraph({ children: content } as any)}</>;
};

describe("dropPartMarkdown content renderers", () => {
  it("keeps rendered markdown children mounted across identical rerenders", () => {
    const { container, rerender } = render(
      renderMarkdownContent("hello @[alice] :wave:")
    );
    const paragraph = container.querySelector("p");
    const mention = screen.getByTestId("content-part");
    const emoji = screen.getByAltText("wave");

    rerender(renderMarkdownContent("hello @[alice] :wave:"));

    expect(container.querySelector("p")).toBe(paragraph);
    expect(screen.getByTestId("content-part")).toBe(mention);
    expect(screen.getByAltText("wave")).toBe(emoji);
  });
});
