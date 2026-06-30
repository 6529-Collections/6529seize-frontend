import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import LinkPreviewCard from "@/components/waves/LinkPreviewCard";

const mockOpenGraphPreview = jest.fn(({ href, preview }: any) => (
  <div
    data-testid="open-graph"
    data-href={href}
    data-preview={preview ? "ready" : "loading"}
  />
));

const mockEnsPreviewCard = jest.fn(({ preview }: any) => (
  <div data-testid="ens-card" data-type={preview?.type ?? "none"} />
));

jest.mock("@/components/waves/OpenGraphPreview", () => {
  const actual = jest.requireActual(
    "../../../components/waves/OpenGraphPreview"
  );
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => mockOpenGraphPreview(props),
  };
});

jest.mock("@/components/waves/ens/EnsPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockEnsPreviewCard(props),
}));

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: () => <div data-testid="href-buttons" />,
}));

jest.mock("@/services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("LinkPreviewCard", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");
  const assertStableFrame = () => {
    const frame = screen.getByTestId("link-preview-card-stable-frame");
    expect(frame).toHaveClass(
      "tw-h-[10rem]",
      "tw-min-h-[10rem]",
      "tw-max-h-[10rem]",
      "md:tw-h-[11rem]",
      "md:tw-min-h-[11rem]",
      "md:tw-max-h-[11rem]"
    );
    return frame;
  };
  const assertFirstPartyFrame = () => {
    const frame = screen.getByTestId("link-preview-card-stable-frame");
    expect(frame).toHaveClass(
      "tw-h-[15rem]",
      "tw-min-h-[15rem]",
      "tw-max-h-[15rem]",
      "lg:tw-h-[11rem]",
      "lg:tw-min-h-[11rem]",
      "lg:tw-max-h-[11rem]"
    );
    return frame;
  };
  const assertCollectionFrame = () => {
    const frame = screen.getByTestId("link-preview-card-stable-frame");
    expect(frame).toHaveClass(
      "tw-h-[18rem]",
      "tw-min-h-[18rem]",
      "tw-max-h-[18rem]",
      "sm:tw-h-[15rem]",
      "sm:tw-min-h-[15rem]",
      "sm:tw-max-h-[15rem]"
    );
    return frame;
  };
  const assertVideoFrame = () => {
    const frame = screen.getByTestId("link-preview-card-stable-frame");
    expect(frame).toHaveClass(
      "tw-h-[18rem]",
      "tw-min-h-[18rem]",
      "tw-max-h-[18rem]",
      "sm:tw-h-[14rem]",
      "sm:tw-min-h-[14rem]",
      "sm:tw-max-h-[14rem]",
      "md:tw-h-[15rem]",
      "md:tw-min-h-[15rem]",
      "md:tw-max-h-[15rem]"
    );
    return frame;
  };
  const assertFarcasterFrame = () => {
    const frame = screen.getByTestId("link-preview-card-stable-frame");
    expect(frame).toHaveClass(
      "tw-h-[24rem]",
      "tw-min-h-[24rem]",
      "tw-max-h-[24rem]",
      "sm:tw-h-[13rem]",
      "sm:tw-min-h-[13rem]",
      "sm:tw-max-h-[13rem]"
    );
    return frame;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders OpenGraph preview when metadata is available", async () => {
    fetchLinkPreview.mockResolvedValue({
      title: "Example Title",
      description: "Example description",
      image: { secureUrl: "https://cdn.example.com/img.png" },
    });

    render(
      <LinkPreviewCard
        href="https://example.com/article"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    assertStableFrame();
    expect(mockOpenGraphPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://example.com/article",
        preview: undefined,
      })
    );

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          href: "https://example.com/article",
          preview: expect.objectContaining({ title: "Example Title" }),
        })
      )
    );

    expect(fetchLinkPreview).toHaveBeenCalledWith(
      "https://example.com/article"
    );
    expect(screen.queryByTestId("fallback")).toBeNull();
    assertStableFrame();
  });

  it("renders fallback when preview lacks useful content", async () => {
    fetchLinkPreview.mockResolvedValue({});

    render(
      <LinkPreviewCard
        href="https://example.com/article"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });
    assertStableFrame();
  });

  it("renders fallback when request fails", async () => {
    fetchLinkPreview.mockRejectedValue(new Error("network"));

    render(
      <LinkPreviewCard
        href="https://example.com/article"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });
    assertStableFrame();
  });

  it("hides link actions in fallback state when requested", async () => {
    fetchLinkPreview.mockRejectedValue(new Error("network"));

    render(
      <LinkPreviewCard
        hideActions
        href="https://example.com/article"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("href-buttons")).toBeNull();
  });

  it("uses the richer chat frame for generated first-party previews", async () => {
    fetchLinkPreview.mockResolvedValue({
      title: "punk6529bot",
      description: "Identity | 6529.io",
      image: {
        url: "https://6529.io/api/og-metadata/profiles/punk6529bot",
      },
      siteName: "6529.io",
    });

    render(
      <LinkPreviewCard
        href="https://6529.io/punk6529bot"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    assertFirstPartyFrame();

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          href: "https://6529.io/punk6529bot",
          preview: expect.objectContaining({ title: "punk6529bot" }),
        })
      )
    );

    assertFirstPartyFrame();
  });

  it("renders ENS previews when ENS data is returned", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "ens.name",
      name: "vitalik.eth",
    });

    render(
      <LinkPreviewCard
        href="vitalik.eth"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(mockEnsPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          preview: expect.objectContaining({ type: "ens.name" }),
        })
      );
    });

    expect(screen.queryByTestId("fallback")).toBeNull();
    assertStableFrame();
  });

  it("uses a fixed 6529 collection frame before and after preview resolution", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "6529.collection",
      title: "Pebbles #514",
      url: "https://6529.io/nextgen/token/514",
      facts: [{ label: "Rarity", value: "#86 / 1,000" }],
      traits: [
        { label: "Palette", value: "Electric Blue" },
        { label: "Mint Type", value: "Airdrop" },
        { label: "Color Density", value: "Sparse" },
      ],
    });

    render(
      <LinkPreviewCard
        href="https://6529.io/nextgen/token/514"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    assertCollectionFrame();

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          preview: expect.objectContaining({ type: "6529.collection" }),
        })
      )
    );

    assertCollectionFrame();
  });

  it.each([
    {
      href: "https://6529.io/the-memes/509",
      title: "The Collective Synapse",
    },
    {
      href: "https://6529.io/rememes/0x33fd426905f149f8376e227d0c9d3340aad17af1/181",
      title: "Rememe #181",
    },
  ])(
    "uses a fixed 6529 collection frame for $href before and after preview resolution",
    async ({ href, title }) => {
      fetchLinkPreview.mockResolvedValue({
        type: "6529.collection",
        title,
        url: href,
        image: { url: "https://cdn.6529.io/collection.png" },
      });

      render(
        <LinkPreviewCard
          href={href}
          renderFallback={() => <div data-testid="fallback">fallback</div>}
        />
      );

      assertCollectionFrame();

      await waitFor(() =>
        expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
          expect.objectContaining({
            preview: expect.objectContaining({ type: "6529.collection" }),
          })
        )
      );

      assertCollectionFrame();
    }
  );

  it("uses a fixed YouTube video frame before and after preview resolution", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "youtube.video",
      title: "A Good Video",
      videoId: "abc123XYZ_0",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc123XYZ_0",
      watchUrl: "https://www.youtube.com/watch?v=abc123XYZ_0",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
    });

    render(
      <LinkPreviewCard
        href="https://youtu.be/abc123XYZ_0"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    assertVideoFrame();

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          preview: expect.objectContaining({ type: "youtube.video" }),
        })
      )
    );

    assertVideoFrame();
  });

  it("uses a fixed Farcaster frame for direct Farcaster preview URLs", async () => {
    fetchLinkPreview.mockResolvedValue({
      title: "Farcaster Frame",
      description: "Frame description",
    });

    render(
      <LinkPreviewCard
        href="https://warpcast.com/~/compose"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    assertFarcasterFrame();

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          preview: expect.objectContaining({ title: "Farcaster Frame" }),
        })
      )
    );

    assertFarcasterFrame();
  });

  it("keeps the generic stable frame when an arbitrary app URL resolves to a Farcaster miniapp", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "farcaster.miniapp",
      embedKind: "miniapp",
      title: "Example Mini",
      appName: "Example Mini",
      description: "Launch the example app",
      siteName: "Example Mini",
      buttonTitle: "Launch",
      actionUrl: "https://mini.example/launch",
      imageUrl: "https://mini.example/preview.png",
    });

    render(
      <LinkPreviewCard
        href="https://mini.example/app"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    assertStableFrame();

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          href: "https://mini.example/app",
          preview: expect.objectContaining({ type: "farcaster.miniapp" }),
        })
      )
    );

    assertStableFrame();
  });

  it("does not enforce chat stable frame for home variant", async () => {
    fetchLinkPreview.mockResolvedValue({});

    render(
      <LinkPreviewCard
        href="https://example.com/article"
        variant="home"
        renderFallback={() => <div data-testid="fallback">fallback</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("link-preview-card-stable-frame")).toBeNull();
  });
});
