/** @jest-environment jsdom */
import React from "react";

jest.mock("next/dynamic", () => {
  let mode: "skeleton" | "eager" = "eager";
  const calls: any[] = [];
  const mock = jest.fn((loader: any, options: any) => {
    calls.push([loader, options]);
    const Comp = (props: any) => {
      if (mode === "skeleton") {
        const L = options?.loading as React.ComponentType | undefined;
        return L ? <L /> : null;
      }
      // Eager mode: immediately render the underlying component.
      // We know the loader resolves to react-tweet's Tweet, so just render that mock directly.
      const { Tweet } = require("react-tweet");
      const T = Tweet as React.ComponentType<any>;
      return <T {...props} />;
    };
    (Comp as any).__loader = loader;
    (Comp as any).__options = options;
    return Comp;
  });
  const setMode = (m: "skeleton" | "eager") => {
    mode = m;
  };
  return {
    __esModule: true,
    default: mock,
    __calls: calls,
    __setMode: setMode,
  };
});

// Use this in assertions: dynamicSpy.mock.calls[0] => [loader, options]
const {
  default: dynamicSpy,
  __calls: dynamicCalls,
  __setMode: setDynamicMode,
} = require("next/dynamic") as {
  default: jest.Mock;
  __calls: any[];
  __setMode: (m: "skeleton" | "eager") => void;
};

import { publicEnv } from "@/config/env";
import {
  fetchYoutubePreview,
  type YoutubeOEmbedResponse,
} from "@/services/api/youtube";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DropPartMarkdown from "@/components/drops/view/part/DropPartMarkdown";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

const setQueryDataMock = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: setQueryDataMock,
  }),
}));

const FALLBACK_BASE_ENDPOINT = "https://6529.io";
const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;
const originalArtBlocksFlags = {
  VITE_FEATURE_AB_CARD: publicEnv.VITE_FEATURE_AB_CARD,
  NEXT_PUBLIC_VITE_FEATURE_AB_CARD: publicEnv.NEXT_PUBLIC_VITE_FEATURE_AB_CARD,
  NEXT_PUBLIC_FEATURE_AB_CARD: publicEnv.NEXT_PUBLIC_FEATURE_AB_CARD,
  FEATURE_AB_CARD: publicEnv.FEATURE_AB_CARD,
};

jest.mock("@/hooks/isMobileScreen", () => () => false);
jest.mock("@/contexts/EmojiContext", () => {
  const emojiContext = {
    emojiMap: [],
    loading: false,
    categories: [],
    categoryIcons: {},
    findNativeEmoji: jest.fn(),
    findCustomEmoji: jest.fn(),
  };

  return {
    useEmoji: () => emojiContext,
  };
});

const tweetMock = jest.fn(({ id, components, onError }: any) => {
  if (id === "1111111111") {
    throw new Error("boom");
  }

  if (id === "2222222222") {
    const error = new Error("not found");
    onError?.(error);
    const NotFound = components?.TweetNotFound;
    return NotFound ? <NotFound error={error} /> : null;
  }

  return <div>tweet:{id}</div>;
});

jest.mock("react-tweet", () => ({
  Tweet: (props: any) => tweetMock(props),
}));
jest.mock("@/services/api/youtube", () => ({
  fetchYoutubePreview: jest.fn(),
}));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaImage",
  () => {
    let mountId = 0;

    function MockDropListItemContentMediaImage({
      src,
    }: {
      readonly src: string;
    }) {
      const [currentMountId] = React.useState(() => String(++mountId));

      return <img alt="Drop media" src={src} data-mount-id={currentMountId} />;
    }

    return {
      __esModule: true,
      default: MockDropListItemContentMediaImage,
    };
  }
);

const mockFetchYoutubePreview = fetchYoutubePreview as jest.MockedFunction<
  typeof fetchYoutubePreview
>;

const mockLinkPreviewCard = jest.fn(({ renderFallback, href }: any) => (
  <div data-testid="link-preview" data-href={href}>
    {renderFallback()}
  </div>
));

const mockArtBlocksTokenCard = jest.fn((props: any) => (
  <div
    data-testid="artblocks-card"
    data-href={props.href}
    data-token={props.id?.tokenId}
  />
));

const mockFarcasterCard = jest.fn(({ href }: any) => (
  <div data-testid="farcaster-card" data-href={href} />
));

jest.mock("@/components/waves/LinkPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockLinkPreviewCard(props),
}));

jest.mock("@/src/components/waves/ArtBlocksTokenCard", () => ({
  __esModule: true,
  default: (props: any) => mockArtBlocksTokenCard(props),
}));

jest.mock("@/components/waves/FarcasterCard", () => ({
  __esModule: true,
  default: (props: any) => mockFarcasterCard(props),
}));

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: ({
    href,
    relativeHref,
  }: {
    href: string;
    relativeHref?: string | undefined;
  }) => (
    <div
      data-testid="chat-item-buttons"
      data-href={href}
      data-relative-href={relativeHref}
    />
  ),
}));

beforeEach(() => {
  mockLinkPreviewCard.mockClear();
  mockArtBlocksTokenCard.mockClear();
  mockFarcasterCard.mockClear();
});

afterEach(() => {
  tweetMock.mockClear();
});

describe("DropPartMarkdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    publicEnv.BASE_ENDPOINT = originalBaseEndpoint ?? FALLBACK_BASE_ENDPOINT;
    publicEnv.VITE_FEATURE_AB_CARD =
      originalArtBlocksFlags.VITE_FEATURE_AB_CARD;
    publicEnv.NEXT_PUBLIC_VITE_FEATURE_AB_CARD =
      originalArtBlocksFlags.NEXT_PUBLIC_VITE_FEATURE_AB_CARD;
    publicEnv.NEXT_PUBLIC_FEATURE_AB_CARD =
      originalArtBlocksFlags.NEXT_PUBLIC_FEATURE_AB_CARD;
    publicEnv.FEATURE_AB_CARD = originalArtBlocksFlags.FEATURE_AB_CARD;
  });

  it("renders gif embeds", () => {
    const content = "Check this ![gif](https://media.tenor.com/test.gif)";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://media.tenor.com/test.gif"
    );
  });

  it("renders one markdown image as a standalone image", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="![Seize](/one.png)"
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getAllByRole("img", { name: "Drop media" })).toHaveLength(1);
    expect(container.querySelector(".tw-grid.tw-grid-cols-1")).toBeNull();
    expect(
      container.querySelector(".tw-relative.tw-mt-2.tw-w-full")
    ).not.toBeNull();
  });

  it("renders a markdown image with a safe base64 data URI", () => {
    const dataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`hello\n\n![Seize](${dataUri})`}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Drop media" })).toHaveAttribute(
      "src",
      dataUri
    );
  });

  it("does not render markdown images with non-image data URIs", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="![Seize](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)"
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByRole("img", { name: "Drop media" })).toBeNull();
  });

  it("does not render markdown images with unsafe invalid sources", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="![Seize](javascript:alert(1)) ![Seize](//example.com/image.png)"
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByRole("img", { name: "Drop media" })).toBeNull();
  });

  it("preserves whitespace between a markdown image and following text", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"![Seize](/one.png)\ncaption"}
        onQuoteClick={jest.fn()}
      />
    );

    const paragraphs = Array.from(container.querySelectorAll("p"));

    expect(screen.getAllByRole("img", { name: "Drop media" })).toHaveLength(1);
    expect(container.querySelector(".tw-grid.tw-grid-cols-1")).toBeNull();
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]?.textContent?.startsWith("\ncaption")).toBe(true);
  });

  it("does not render image-to-smart-link whitespace as a text paragraph", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"![Seize](/one.png)\nhttps://google.com"}
        onQuoteClick={jest.fn()}
      />
    );

    const paragraphs = Array.from(container.querySelectorAll("p.word-break"));

    expect(screen.getAllByRole("img", { name: "Drop media" })).toHaveLength(1);
    expect(screen.getAllByTestId("link-preview")).toHaveLength(1);
    expect(
      paragraphs.some((paragraph) => paragraph.textContent?.trim() === "")
    ).toBe(false);
  });

  it("does not render trailing image whitespace as an empty paragraph", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"![Seize](/one.png)\n"}
        onQuoteClick={jest.fn()}
      />
    );

    const paragraphs = Array.from(container.querySelectorAll("p.word-break"));

    expect(screen.getAllByRole("img", { name: "Drop media" })).toHaveLength(1);
    expect(
      paragraphs.some((paragraph) => paragraph.textContent?.trim() === "")
    ).toBe(false);
  });

  it("groups consecutive markdown images in one responsive grid", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="![Seize](/one.png)![Seize](/two.png)"
        onQuoteClick={jest.fn()}
      />
    );

    const group = container.querySelector(".tw-grid.tw-grid-cols-1");

    expect(group).not.toBeNull();
    expect(group).toHaveClass(
      "tw-mt-2",
      "tw-gap-2",
      "sm:tw-grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),16rem))]"
    );
    expect(group?.querySelectorAll("img")).toHaveLength(2);
    expect(group?.querySelector(".tw-mt-2")).toBeNull();
  });

  it("keeps grouped markdown images mounted across parent rerenders", () => {
    const content = "![Seize](/one.png)![Seize](/two.png)";
    const mentionedUsers = [];
    const mentionedWaves = [];
    const referencedNfts = [];
    const onQuoteClick = jest.fn();
    const { rerender } = render(
      <DropPartMarkdown
        mentionedUsers={mentionedUsers}
        mentionedWaves={mentionedWaves}
        referencedNfts={referencedNfts}
        partContent={content}
        onQuoteClick={onQuoteClick}
      />
    );

    const originalMountIds = screen
      .getAllByRole("img", { name: "Drop media" })
      .map((image) => image.getAttribute("data-mount-id"));
    expect(originalMountIds).toHaveLength(2);

    rerender(
      <DropPartMarkdown
        mentionedUsers={mentionedUsers}
        mentionedWaves={mentionedWaves}
        referencedNfts={referencedNfts}
        partContent={content}
        onQuoteClick={onQuoteClick}
      />
    );

    expect(
      screen
        .getAllByRole("img", { name: "Drop media" })
        .map((image) => image.getAttribute("data-mount-id"))
    ).toEqual(originalMountIds);
  });

  it("only remounts the grouped markdown image whose URL changes", () => {
    const mentionedUsers = [];
    const mentionedWaves = [];
    const referencedNfts = [];
    const onQuoteClick = jest.fn();
    const { rerender } = render(
      <DropPartMarkdown
        mentionedUsers={mentionedUsers}
        mentionedWaves={mentionedWaves}
        referencedNfts={referencedNfts}
        partContent="![Seize](/one.png)![Seize](/two.png)"
        onQuoteClick={onQuoteClick}
      />
    );

    const originalMountIds = screen
      .getAllByRole("img", { name: "Drop media" })
      .map((image) => image.getAttribute("data-mount-id"));
    expect(originalMountIds).toHaveLength(2);
    const [firstOriginalMountId, secondOriginalMountId] = originalMountIds;
    if (!firstOriginalMountId || !secondOriginalMountId) {
      throw new Error("Expected initial markdown images to have mount IDs");
    }

    rerender(
      <DropPartMarkdown
        mentionedUsers={mentionedUsers}
        mentionedWaves={mentionedWaves}
        referencedNfts={referencedNfts}
        partContent="![Seize](/one.png)![Seize](/three.png)"
        onQuoteClick={onQuoteClick}
      />
    );

    const updatedImages = screen.getAllByRole("img", { name: "Drop media" });
    expect(updatedImages.map((image) => image.getAttribute("src"))).toEqual([
      "/one.png",
      "/three.png",
    ]);
    const [firstUpdatedImage, secondUpdatedImage] = updatedImages;
    if (!firstUpdatedImage || !secondUpdatedImage) {
      throw new Error("Expected updated markdown images to render");
    }

    expect(firstUpdatedImage).toHaveAttribute(
      "data-mount-id",
      firstOriginalMountId
    );
    expect(secondUpdatedImage.getAttribute("data-mount-id")).not.toBe(
      secondOriginalMountId
    );
  });

  it("keeps whitespace-only markdown between images in the same image group", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"![Seize](/one.png)\n   ![Seize](/two.png)"}
        onQuoteClick={jest.fn()}
      />
    );

    const group = container.querySelector(".tw-grid.tw-grid-cols-1");

    expect(group).not.toBeNull();
    expect(group?.querySelectorAll("img")).toHaveLength(2);
  });

  it("groups consecutive bare image URLs in one responsive grid", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={
          "https://cdn.example.com/one.jpg\nhttps://cdn.example.com/two.gif?cache=1"
        }
        onQuoteClick={jest.fn()}
      />
    );

    const group = container.querySelector(".tw-grid.tw-grid-cols-1");

    expect(group).not.toBeNull();
    expect(group?.querySelectorAll("img")).toHaveLength(2);
    expect(group?.querySelector(".tw-mt-2")).toBeNull();
  });

  it("keeps named image URL markdown links as links", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="[open image](https://cdn.example.com/one.jpg)"
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByRole("img", { name: "Drop media" })).toBeNull();
    expect(screen.getByRole("link", { name: "open image" })).toHaveAttribute(
      "href",
      "https://cdn.example.com/one.jpg"
    );
  });

  it("does not group markdown images when visible text is between them", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="![Seize](/one.png) text ![Seize](/two.png)"
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getAllByRole("img", { name: "Drop media" })).toHaveLength(2);
    expect(screen.getByText("text")).toBeInTheDocument();
    expect(container.querySelector(".tw-grid.tw-grid-cols-1")).toBeNull();
  });

  it("handles external links", () => {
    const content = "[link](https://google.com)";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    expect(mockLinkPreviewCard).toHaveBeenCalledTimes(1);
    const previewCall = mockLinkPreviewCard.mock.calls[0][0];
    expect(previewCall.href).toBe("https://google.com");

    const a = screen.getByRole("link", { name: "link" });
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("renders @all as a blue group mention only when ALL is in mentioned groups", () => {
    const { rerender } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedGroups={[ApiDropGroupMention.All]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"hello @all"}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText("@all")).toHaveClass("tw-text-primary-400");
    expect(screen.getByText("@all")).toHaveClass("tw-align-middle");

    rerender(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedGroups={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"hello @all"}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText("hello @all")).not.toHaveClass(
      "tw-text-primary-400"
    );
  });

  it("renders bold markdown on the browser baseline without aligning plain text spans", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="our votes my **Residual Barrier** piece"
        onQuoteClick={jest.fn()}
      />
    );

    const strong = container.querySelector("strong");
    if (!strong) {
      throw new Error("Expected bold markdown to render a strong element");
    }
    expect(strong).toHaveTextContent("Residual Barrier");

    const plainTextSpans = Array.from(
      container.querySelectorAll("p > span")
    ).filter((span) =>
      ["our votes my ", " piece"].includes(span.textContent ?? "")
    );
    expect(plainTextSpans).toHaveLength(2);
    plainTextSpans.forEach((span) => {
      expect(span).not.toHaveClass("emoji-text-node");
      expect(span).not.toHaveClass("tw-align-middle");
    });
  });

  it("renders a standalone check mark emoji with the large emoji style", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="✅"
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText("✅")).toHaveClass("emoji-text-node");
  });

  it("does not apply the large emoji style when emoji content includes text", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="✅ done"
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText("✅ done")).not.toHaveClass("emoji-text-node");
    expect(screen.getByText("✅ done")).not.toHaveClass("tw-align-middle");
  });

  it("renders Art Blocks token card when feature enabled", async () => {
    publicEnv.VITE_FEATURE_AB_CARD = "true";
    const content = "[token](https://www.artblocks.io/token/662000)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(mockArtBlocksTokenCard).toHaveBeenCalledTimes(1)
    );
    const call = mockArtBlocksTokenCard.mock.calls[0][0];
    expect(call.href).toBe("https://www.artblocks.io/token/662000");
    expect(call.id).toEqual({ tokenId: "662000" });
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
  });

  it("renders Farcaster card for Warpcast links", () => {
    const content = "[cast](https://warpcast.com/alice/0x123)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockFarcasterCard).toHaveBeenCalledTimes(1);
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    const call = mockFarcasterCard.mock.calls[0][0];
    expect(call.href).toBe("https://warpcast.com/alice/0x123");
  });

  it("falls back to regular link when Art Blocks URL is not supported", () => {
    const content = "[token](https://www.artblocks.io/project/662000)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockArtBlocksTokenCard).not.toHaveBeenCalled();
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    const link = screen.getByRole("link", { name: "token" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.artblocks.io/project/662000"
    );
  });

  it("falls back to regular link when Art Blocks card disabled", () => {
    publicEnv.VITE_FEATURE_AB_CARD = "false";
    const content = "[token](https://www.artblocks.io/token/662000)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockArtBlocksTokenCard).not.toHaveBeenCalled();
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    const link = screen.getByRole("link", { name: "token" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.artblocks.io/token/662000"
    );
  });

  it("renders a fallback link when tweet data is unavailable", async () => {
    const content = "[tweet](https://twitter.com/someuser/status/2222222222)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    const fallbackLink = await screen.findByRole("link", {
      name: /tweet unavailable/i,
    });

    expect(fallbackLink).toHaveAttribute(
      "href",
      "https://twitter.com/someuser/status/2222222222"
    );
    expect(fallbackLink).toHaveAttribute("target", "_blank");
    expect(fallbackLink).toHaveTextContent(/Tweet unavailable/i);
    expect(fallbackLink).toHaveTextContent(/Open on X/i);
    const tweetWrapper = fallbackLink.parentElement;
    if (!tweetWrapper) {
      throw new Error("Expected tweet fallback wrapper");
    }
    expect(tweetWrapper).toHaveClass("tw-w-full", "lg:tw-max-w-[480px]");
  });

  it("renders a fallback link when the tweet embed throws", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const content = "[tweet](https://twitter.com/foo/status/1111111111)";

      render(
        <DropPartMarkdown
          mentionedUsers={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          partContent={content}
          onQuoteClick={jest.fn()}
        />
      );

      const fallbackLink = await screen.findByRole("link", {
        name: /tweet unavailable/i,
      });

      expect(fallbackLink).toHaveAttribute(
        "href",
        "https://twitter.com/foo/status/1111111111"
      );
      const tweetWrapper = fallbackLink.parentElement;
      if (!tweetWrapper) {
        throw new Error("Expected tweet fallback wrapper");
      }
      expect(tweetWrapper).toHaveClass("tw-w-full", "lg:tw-max-w-[480px]");
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("renders YouTube previews with thumbnail and iframe interaction", async () => {
    let resolvePreview:
      | ((value: YoutubeOEmbedResponse | null) => void)
      | undefined;
    const previewPromise = new Promise<YoutubeOEmbedResponse | null>(
      (resolve) => {
        resolvePreview = resolve;
      }
    );
    const preview: YoutubeOEmbedResponse = {
      title: "Sample Video",
      author_name: "Sample Creator",
      thumbnail_url: "https://img.youtube.com/vi/sample/hqdefault.jpg",
      html: '<iframe title="Sample Video" src="https://www.youtube.com/embed/sample"></iframe>',
    };
    mockFetchYoutubePreview.mockReturnValue(previewPromise);

    const content = "Watch this https://youtu.be/sample";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    const stableFrame = screen.getByTestId("youtube-preview-stable-frame");
    const mediaFrame = screen.getByTestId("youtube-preview-media-frame");
    expect(stableFrame).toBeInTheDocument();
    expect(stableFrame.className).not.toContain("tw-h-[13rem]");
    expect(stableFrame.className).not.toContain("md:tw-h-[15rem]");
    expect(mediaFrame.className).toContain("tw-aspect-video");

    resolvePreview?.(preview);

    const previewButton = await screen.findByRole("button", {
      name: /sample video/i,
    });
    const thumbnailImage = await screen.findByRole("img", {
      name: /sample video/i,
    });
    expect(thumbnailImage.getAttribute("src")).toContain(
      encodeURIComponent(preview.thumbnail_url)
    );

    await userEvent.click(previewButton);

    expect(await screen.findByTitle("Sample Video")).toBeInTheDocument();
    expect(mockFetchYoutubePreview).toHaveBeenCalled();
    expect(mockFetchYoutubePreview.mock.calls[0]?.[0]).toBe(
      "https://www.youtube.com/watch?v=sample"
    );

    const title = screen.getByText("Sample Video");
    const author = screen.getByText("Sample Creator");
    expect(title.className).toContain("tw-line-clamp-2");
    expect(author.className).toContain("tw-line-clamp-1");
  });

  it("normalizes YouTube URLs before fetching preview data", async () => {
    const preview: YoutubeOEmbedResponse = {
      title: "Normalized Video",
      author_name: "Channel",
      thumbnail_url: "https://img.youtube.com/vi/abc123XYZ/hqdefault.jpg",
      html: '<iframe title="Normalized Video" src="https://www.youtube.com/embed/abc123XYZ"></iframe>',
    };
    mockFetchYoutubePreview.mockResolvedValue(preview);

    const url =
      "https://music.youtube.com/watch?v=abc123XYZ&t=42&list=PL123456";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`Watch ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => expect(mockFetchYoutubePreview).toHaveBeenCalled());
    expect(mockFetchYoutubePreview.mock.calls[0]?.[0]).toBe(
      "https://www.youtube.com/watch?v=abc123XYZ&list=PL123456"
    );

    const previewButton = await screen.findByRole("button", {
      name: /normalized video/i,
    });
    await userEvent.click(previewButton);
    expect(await screen.findByTitle("Normalized Video")).toBeInTheDocument();
  });

  it("supports additional YouTube path variants", async () => {
    const preview: YoutubeOEmbedResponse = {
      title: "Live Video",
      author_name: "Channel",
      thumbnail_url: "https://img.youtube.com/vi/liveid123/hqdefault.jpg",
      html: '<iframe title="Live Video" src="https://www.youtube.com/embed/liveid123"></iframe>',
    };
    mockFetchYoutubePreview.mockResolvedValue(preview);

    const url = "https://www.youtube.com/live/liveid123?si=token";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`Watch ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => expect(mockFetchYoutubePreview).toHaveBeenCalled());
    expect(mockFetchYoutubePreview.mock.calls[0]?.[0]).toBe(
      "https://www.youtube.com/watch?v=liveid123"
    );
  });

  it("falls back with original URL for nocookie embeds when fetching fails", async () => {
    mockFetchYoutubePreview.mockRejectedValue(new Error("blocked"));

    const url =
      "https://www.youtube-nocookie.com/embed/abcdef12345?rel=0&start=30";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`Check ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    const stableFrame = screen.getByTestId("youtube-preview-stable-frame");
    const mediaFrame = screen.getByTestId("youtube-preview-media-frame");
    expect(stableFrame.className).not.toContain("tw-h-[13rem]");
    expect(stableFrame.className).not.toContain("md:tw-h-[15rem]");
    expect(mediaFrame.className).toContain("tw-aspect-video");

    const fallbackLink = await screen.findByTestId(
      "youtube-preview-fallback-link"
    );
    expect(fallbackLink).toHaveAttribute("href", url);
    expect(fallbackLink).toHaveTextContent(/failed to load youtube preview/i);
  });

  it("falls back to a link when YouTube preview rejects", async () => {
    mockFetchYoutubePreview.mockRejectedValue(new Error("network"));

    const url = "https://youtu.be/failure";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`Check ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    const stableFrame = screen.getByTestId("youtube-preview-stable-frame");
    const mediaFrame = screen.getByTestId("youtube-preview-media-frame");
    expect(stableFrame.className).not.toContain("tw-h-[13rem]");
    expect(stableFrame.className).not.toContain("md:tw-h-[15rem]");
    expect(mediaFrame.className).toContain("tw-aspect-video");

    const fallbackLink = await screen.findByTestId(
      "youtube-preview-fallback-link"
    );
    expect(fallbackLink).toHaveAttribute("href", url);
    expect(fallbackLink).toHaveTextContent(/failed to load youtube preview/i);
  });

  it("falls back to a link when YouTube preview returns null", async () => {
    mockFetchYoutubePreview.mockResolvedValue(null);

    const url = "https://youtu.be/unknown";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`Check ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    const stableFrame = screen.getByTestId("youtube-preview-stable-frame");
    const mediaFrame = screen.getByTestId("youtube-preview-media-frame");
    expect(stableFrame.className).not.toContain("tw-h-[13rem]");
    expect(stableFrame.className).not.toContain("md:tw-h-[15rem]");
    expect(mediaFrame.className).toContain("tw-aspect-video");

    const fallbackLink = await screen.findByTestId(
      "youtube-preview-fallback-link"
    );
    expect(fallbackLink).toHaveAttribute("href", url);
    expect(fallbackLink).toHaveTextContent(/youtube preview unavailable/i);
  });

  it("lazy loads tweet embeds with a loading skeleton", async () => {
    setDynamicMode("skeleton");
    try {
      const content =
        "Check this [tweet](https://twitter.com/user/status/1234567890)";

      render(
        <DropPartMarkdown
          mentionedUsers={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          partContent={content}
          onQuoteClick={jest.fn()}
        />
      );

      expect(
        screen.queryByTestId("tweet-embed-loading") ??
          screen.queryByText("Tweet unavailable")
      ).not.toBeNull();

      expect(dynamicCalls.length).toBeGreaterThanOrEqual(1);
      const [loader, options] = dynamicCalls[0];
      expect(options?.ssr).toBe(false);

      const loadedTweetComponent = await loader();
      expect(loadedTweetComponent).toBeDefined();
    } finally {
      setDynamicMode("eager");
    }
  });

  it("renders plain links when link previews are hidden for the drop", () => {
    const content = "[link](https://google.com)";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
        currentDropId="drop1"
        hideLinkPreviews={true}
      />
    );
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    const a = screen.getByRole("link", { name: "link" });
    expect(a).toHaveAttribute("href", "https://google.com");
  });

  it("renders separate paragraphs for blank-line content with tight spacing", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"First\n\nSecond"}
        onQuoteClick={jest.fn()}
      />
    );

    const paragraphs = document.querySelectorAll("p.word-break");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent("First");
    expect(paragraphs[1]).toHaveTextContent("Second");
    expect(paragraphs[0]?.className).toContain("tw-mb-1.5");
    expect(paragraphs[0]?.className).not.toContain("tw-mb-3");
  });

  it("preserves one visible blank line when content has triple newlines", () => {
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"First\n\n\nSecond"}
        onQuoteClick={jest.fn()}
      />
    );

    const paragraphs = document.querySelectorAll("p.word-break");
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toHaveTextContent("First");
    expect(paragraphs[1]?.textContent).toBe("\u00a0");
    expect(paragraphs[1]?.className).toContain("tw-h-2");
    expect(paragraphs[1]?.className).toContain("tw-leading-none");
    expect(paragraphs[2]).toHaveTextContent("Second");
  });

  it("does not render an inline restore action when previews are hidden", () => {
    const content = "[first](https://google.com) [second](https://example.com)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
        currentDropId="drop1"
        hideLinkPreviews={true}
        linkPreviewToggleControl={{
          canToggle: true,
          isHidden: true,
          isLoading: false,
          label: "Show link previews",
          onToggle: jest.fn(),
        }}
      />
    );

    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Show link previews" })
    ).toBeNull();
  });
});
