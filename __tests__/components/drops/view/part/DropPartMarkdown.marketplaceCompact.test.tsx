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
