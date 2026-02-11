import React from "react";
import { render } from "@testing-library/react";
import DropPartMarkdown from "@/components/drops/view/part/DropPartMarkdown";

const createLinkRenderer = jest.fn(() => ({
  renderAnchor: () => null,
  isSmartLink: () => false,
  renderImage: () => null,
}));

jest.mock("@/components/drops/view/part/dropPartMarkdown/linkHandlers", () => ({
  DEFAULT_MAX_EMBED_DEPTH: 4,
  createLinkRenderer: (...args: any[]) => createLinkRenderer(...args),
}));

jest.mock("@/hooks/isMobileScreen", () => () => false);
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    loading: false,
    categories: [],
    categoryIcons: {},
    findNativeEmoji: jest.fn(),
    findCustomEmoji: jest.fn(),
  }),
}));
jest.mock("@/components/tweets/TweetPreviewModeContext", () => ({
  useTweetPreviewMode: () => "auto",
}));

describe("DropPartMarkdown marketplaceImageOnly", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes marketplaceImageOnly to createLinkRenderer", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="[nft](https://opensea.io/item/ethereum/0x1234567890abcdef1234567890abcdef12345678/1)"
        onQuoteClick={jest.fn()}
        marketplaceImageOnly={true}
      />
    );

    expect(createLinkRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        marketplaceImageOnly: true,
      })
    );
  });
});
