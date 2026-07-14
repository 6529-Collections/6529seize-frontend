/** @jest-environment jsdom */
import React from "react";

import { publicEnv } from "@/config/env";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DropPartMarkdown from "@/components/drops/view/part/DropPartMarkdown";
import { DropImageGalleryProvider } from "@/components/drops/view/part/DropImageGalleryProvider";
import { buildDropImageGalleryItems } from "@/components/drops/view/part/dropImageGallery";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

const PARENTHESIZED_ORDERED_LIST_CLASS_NAME =
  "drop-markdown-ordered-list-paren";

class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

type MockNextImageProps = React.ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: React.forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...rest }, ref) => (
      <img ref={ref} alt={alt ?? ""} {...rest} />
    )
  ),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));

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

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaImage",
  () => {
    let mountId = 0;

    function MockDropListItemContentMediaImage({
      galleryItemId,
      src,
    }: {
      readonly galleryItemId?: string | undefined;
      readonly src: string;
    }) {
      const [currentMountId] = React.useState(() => String(++mountId));
      const { useDropImageGallery } = jest.requireActual(
        "@/components/drops/view/part/DropImageGalleryProvider"
      );
      const gallery = useDropImageGallery();

      return (
        <button
          type="button"
          aria-label={`Open image ${src}`}
          data-gallery-item-id={galleryItemId}
          onClick={() => {
            if (galleryItemId) {
              gallery?.openImage(galleryItemId);
            }
          }}
        >
          <img alt="Drop media" src={src} data-mount-id={currentMountId} />
        </button>
      );
    }

    return {
      __esModule: true,
      default: MockDropListItemContentMediaImage,
    };
  }
);

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

const mockTwitterPreviewCard = jest.fn(({ href, tweetId }: any) => (
  <div
    data-testid="twitter-post-preview"
    data-href={href}
    data-tweet-id={tweetId}
  />
));

const mockGithubLinkPreview = jest.fn(({ href }: any) => (
  <div data-testid="github-link-preview" data-href={href} />
));

jest.mock("@/components/waves/LinkPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockLinkPreviewCard(props),
}));

jest.mock("@/components/waves/github/GithubLinkPreview", () => {
  const actual = jest.requireActual(
    "@/components/waves/github/GithubLinkPreview"
  );

  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockGithubLinkPreview(props),
  };
});

jest.mock("@/components/waves/ArtBlocksTokenCard", () => ({
  __esModule: true,
  default: (props: any) => mockArtBlocksTokenCard(props),
}));

jest.mock("@/components/waves/FarcasterCard", () => ({
  __esModule: true,
  default: (props: any) => mockFarcasterCard(props),
}));

jest.mock("@/components/waves/TwitterPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockTwitterPreviewCard(props),
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
  mockTwitterPreviewCard.mockClear();
  mockGithubLinkPreview.mockClear();
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
    const mentionedUsers: never[] = [];
    const mentionedWaves: never[] = [];
    const referencedNfts: never[] = [];
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
    const mentionedUsers: never[] = [];
    const mentionedWaves: never[] = [];
    const referencedNfts: never[] = [];
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

  it("routes GitHub blob image URLs through GitHub preview instead of direct image rendering", () => {
    const href =
      "https://github.com/david-6529/self-custody-education/blob/main/output/craig-self-custody-comic/pages/page-01.png";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={href}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockGithubLinkPreview).toHaveBeenCalledWith(
      expect.objectContaining({ href })
    );
    expect(screen.getByTestId("github-link-preview")).toHaveAttribute(
      "data-href",
      href
    );
    expect(screen.queryByRole("img", { name: "Drop media" })).toBeNull();
  });

  it("opens duplicate body markdown image URLs at the clicked item", () => {
    const duplicateSrc = "https://cdn.example.com/same.jpg";
    const partContent = `![first](${duplicateSrc})\n![second](${duplicateSrc})`;
    const galleryItems = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    render(
      <DropImageGalleryProvider items={galleryItems}>
        <DropPartMarkdown
          mentionedUsers={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          partContent={partContent}
          onQuoteClick={jest.fn()}
        />
      </DropImageGalleryProvider>
    );

    const openButtons = screen.getAllByRole("button", {
      name: `Open image ${duplicateSrc}`,
    });

    fireEvent.click(openButtons[1]!);

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      duplicateSrc
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "2 / 2"
    );
  });

  it("opens angle-bracket image URLs from the full body gallery", () => {
    const angleBracketSrc = "https://cdn.example.com/angle.jpg";
    const markdownSrc = "https://cdn.example.com/second.jpg";
    const partContent = `<${angleBracketSrc}>\n![second](${markdownSrc})`;
    const galleryItems = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    render(
      <DropImageGalleryProvider items={galleryItems}>
        <DropPartMarkdown
          mentionedUsers={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          partContent={partContent}
          onQuoteClick={jest.fn()}
        />
      </DropImageGalleryProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: `Open image ${angleBracketSrc}`,
      })
    );

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      angleBracketSrc
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "1 / 2"
    );
  });

  it("keeps direct image markdown links as links", () => {
    const linkSrc = "https://cdn.example.com/linked.jpg";
    const markdownSrc = "https://cdn.example.com/second.jpg";
    const partContent = `[${linkSrc}](${linkSrc})\n![second](${markdownSrc})`;
    const galleryItems = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    render(
      <DropImageGalleryProvider items={galleryItems}>
        <DropPartMarkdown
          mentionedUsers={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          partContent={partContent}
          onQuoteClick={jest.fn()}
        />
      </DropImageGalleryProvider>
    );

    expect(screen.getByRole("link", { name: linkSrc })).toHaveAttribute(
      "href",
      linkSrc
    );
    expect(
      screen.queryByRole("button", { name: `Open image ${linkSrc}` })
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Open image ${markdownSrc}`,
      })
    );

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      markdownSrc
    );
    expect(screen.queryByTestId("image-gallery-counter")).toBeNull();
  });

  it("opens reference-style markdown images from the full body gallery", () => {
    const referenceSrc = "https://cdn.example.com/reference.jpg";
    const markdownSrc = "https://cdn.example.com/second.jpg";
    const partContent = [
      `![reference][img]`,
      `![second](${markdownSrc})`,
      "",
      `[img]: ${referenceSrc}`,
    ].join("\n");
    const galleryItems = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    render(
      <DropImageGalleryProvider items={galleryItems}>
        <DropPartMarkdown
          mentionedUsers={[]}
          mentionedWaves={[]}
          referencedNfts={[]}
          partContent={partContent}
          onQuoteClick={jest.fn()}
        />
      </DropImageGalleryProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: `Open image ${referenceSrc}`,
      })
    );

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      referenceSrc
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "1 / 2"
    );
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
    const content = "https://google.com";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    expect(mockLinkPreviewCard).toHaveBeenCalled();
    const previewCall = mockLinkPreviewCard.mock.calls.find(
      ([props]) => props.href === "https://google.com"
    )?.[0];
    if (!previewCall) {
      throw new Error("Expected link preview card props");
    }
    expect(previewCall.href).toBe("https://google.com");

    const a = screen.getByRole("link", { name: "https://google.com" });
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
    const content = "https://www.artblocks.io/token/662000";

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
      expect(
        mockArtBlocksTokenCard.mock.calls.some(
          ([props]) => props.href === "https://www.artblocks.io/token/662000"
        )
      ).toBe(true)
    );
    const call = mockArtBlocksTokenCard.mock.calls.find(
      ([props]) => props.href === "https://www.artblocks.io/token/662000"
    )?.[0];
    if (!call) {
      throw new Error("Expected Art Blocks card props");
    }
    expect(call.href).toBe("https://www.artblocks.io/token/662000");
    expect(call.id).toEqual({ tokenId: "662000" });
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
  });

  it("renders Farcaster card for Warpcast links", () => {
    const content = "https://warpcast.com/alice/0x123";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockFarcasterCard).toHaveBeenCalled();
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    const call = mockFarcasterCard.mock.calls.find(
      ([props]) => props.href === "https://warpcast.com/alice/0x123"
    )?.[0];
    if (!call) {
      throw new Error("Expected Farcaster card props");
    }
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

  it("renders Twitter/X links with the local Twitter preview card", () => {
    const content = "https://twitter.com/someuser/status/2222222222";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockTwitterPreviewCard).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://twitter.com/someuser/status/2222222222",
        tweetId: "2222222222",
      })
    );
    expect(screen.getByTestId("twitter-post-preview")).toHaveAttribute(
      "data-tweet-id",
      "2222222222"
    );
    const tweetWrapper = screen.getByTestId(
      "twitter-post-preview"
    ).parentElement;
    if (!tweetWrapper) {
      throw new Error("Expected Twitter preview card wrapper");
    }
    expect(tweetWrapper).toHaveClass("tw-w-full", "lg:tw-max-w-[480px]");
  });

  it("falls back to regular link when the local Twitter preview card throws", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const originalImplementation =
      mockTwitterPreviewCard.getMockImplementation();
    mockTwitterPreviewCard.mockImplementation(() => {
      throw new Error("boom");
    });

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

      const fallbackLink = await screen.findByRole("link", { name: "tweet" });

      expect(fallbackLink).toHaveAttribute(
        "href",
        "https://twitter.com/foo/status/1111111111"
      );
    } finally {
      mockTwitterPreviewCard.mockImplementation(originalImplementation);
      consoleErrorSpy.mockRestore();
    }
  });

  it("routes supported YouTube links through shared link previews", () => {
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

    expect(mockLinkPreviewCard).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://youtu.be/sample",
      })
    );
    const preview = screen.getByTestId("link-preview");
    expect(preview).toHaveAttribute("data-href", "https://youtu.be/sample");
    expect(
      screen.getByRole("link", { name: "https://youtu.be/sample" })
    ).toHaveAttribute("href", "https://youtu.be/sample");
  });

  it("supports YouTube subdomains and preserves the original preview href", () => {
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

    expect(mockLinkPreviewCard).toHaveBeenCalledWith(
      expect.objectContaining({
        href: url,
      })
    );
  });

  it("supports additional YouTube path variants", () => {
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

    expect(mockLinkPreviewCard).toHaveBeenCalledWith(
      expect.objectContaining({
        href: url,
      })
    );
  });

  it("routes nocookie embeds through shared link previews", () => {
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

    expect(mockLinkPreviewCard).toHaveBeenCalledWith(
      expect.objectContaining({
        href: url,
      })
    );
  });

  it("keeps unsupported YouTube URLs as regular links", () => {
    const url = "https://www.youtube.com/channel/UC123456789";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`Check ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: url })).toHaveAttribute(
      "href",
      url
    );
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

  it("keeps markdown links with anchor text inline without rendering previews", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="field test: [deep sea](https://neal.fun/deep-sea/)"
        onQuoteClick={jest.fn()}
        hideLinkPreviews={false}
      />
    );

    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    expect(mockArtBlocksTokenCard).not.toHaveBeenCalled();
    expect(mockFarcasterCard).not.toHaveBeenCalled();
    expect(mockTwitterPreviewCard).not.toHaveBeenCalled();
    expect(mockGithubLinkPreview).not.toHaveBeenCalled();

    const paragraphs = Array.from(container.querySelectorAll("p.word-break"));
    const link = screen.getByRole("link", { name: "deep sea" });

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent("field test: deep sea");
    expect(link).toHaveAttribute("href", "https://neal.fun/deep-sea/");
    expect(link.closest("p")).toBe(paragraphs[0]);
  });

  it("keeps markdown links whose label is the href inline without rendering previews", () => {
    const href = "https://google.com";

    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`field test: [${href}](${href})`}
        onQuoteClick={jest.fn()}
        hideLinkPreviews={false}
      />
    );

    expect(mockLinkPreviewCard).not.toHaveBeenCalled();

    const paragraphs = Array.from(container.querySelectorAll("p.word-break"));
    const link = screen.getByRole("link", { name: href });

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent(`field test: ${href}`);
    expect(link).toHaveAttribute("href", href);
    expect(link.closest("p")).toBe(paragraphs[0]);
  });

  it("keeps bare URL previews split out as block cards", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="field test: https://neal.fun/deep-sea/"
        onQuoteClick={jest.fn()}
        hideLinkPreviews={false}
      />
    );

    expect(mockLinkPreviewCard).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://neal.fun/deep-sea/",
      })
    );

    const paragraphs = Array.from(container.querySelectorAll("p.word-break"));
    const preview = screen.getByTestId("link-preview");

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent("field test:");
    expect(preview).toHaveAttribute("data-href", "https://neal.fun/deep-sea/");
    expect(preview.closest("p")).toBeNull();
  });

  it("renders specialized markdown links with anchor text as plain links", () => {
    const href = "https://warpcast.com/alice/0x123";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`[cast](${href})`}
        onQuoteClick={jest.fn()}
        hideLinkPreviews={false}
      />
    );

    expect(mockFarcasterCard).not.toHaveBeenCalled();
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "cast" })).toHaveAttribute(
      "href",
      href
    );
  });

  it("keeps bare URL previews when a part also has a markdown anchor link", () => {
    const previewUrl = "https://neal.fun/deep-sea/";

    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={`${previewUrl} see [deep sea](${previewUrl})`}
        onQuoteClick={jest.fn()}
        hideLinkPreviews={false}
      />
    );

    expect(mockLinkPreviewCard).toHaveBeenCalledWith(
      expect.objectContaining({
        href: previewUrl,
      })
    );

    const paragraphs = Array.from(container.querySelectorAll("p.word-break"));
    const previews = screen.getAllByTestId("link-preview");
    const anchor = screen.getByRole("link", { name: "deep sea" });

    expect(previews).toHaveLength(1);
    expect(previews[0]?.closest("p")).toBeNull();
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent("see deep sea");
    expect(anchor).toHaveAttribute("href", previewUrl);
    expect(anchor.closest("p")).toBe(paragraphs[0]);
  });

  it("preserves a parenthesized ordered-list marker", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="1) What"
        onQuoteClick={jest.fn()}
      />
    );

    const list = container.querySelector("ol");
    expect(list).toHaveClass(PARENTHESIZED_ORDERED_LIST_CLASS_NAME);
    expect(screen.getByRole("listitem")).toHaveTextContent("What");
  });

  it("keeps period-delimited ordered lists on the default marker style", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent="1. What"
        onQuoteClick={jest.fn()}
      />
    );

    expect(container.querySelector("ol")).not.toHaveClass(
      PARENTHESIZED_ORDERED_LIST_CLASS_NAME
    );
  });

  it("preserves non-one numbering only on parenthesized ordered lists", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"3) Three\n4) Four\n\n1. One"}
        onQuoteClick={jest.fn()}
      />
    );

    const lists = container.querySelectorAll("ol");
    expect(lists).toHaveLength(2);
    expect(lists[0]).toHaveClass(PARENTHESIZED_ORDERED_LIST_CLASS_NAME);
    expect(lists[0]).toHaveAttribute("start", "3");
    expect(lists[1]).not.toHaveClass(PARENTHESIZED_ORDERED_LIST_CLASS_NAME);
  });

  it("preserves parenthesized markers on nested ordered lists", () => {
    const { container } = render(
      <DropPartMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        partContent={"1) Parent\n   1) Child\n   2) Nested"}
        onQuoteClick={jest.fn()}
      />
    );

    const lists = container.querySelectorAll("ol");
    expect(lists).toHaveLength(2);
    expect(lists[0]).toHaveClass(PARENTHESIZED_ORDERED_LIST_CLASS_NAME);
    expect(lists[1]).toHaveClass(PARENTHESIZED_ORDERED_LIST_CLASS_NAME);
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
