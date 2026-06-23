jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.test",
  },
}));

import {
  renderBrandedCollectionOgImage,
  renderBrandedNftOgImage,
} from "@/app/api/og-metadata/_lib/brandedCards";
import React from "react";

const collectImageSrcs = (node: React.ReactNode): string[] => {
  if (!React.isValidElement(node)) {
    return [];
  }

  if (typeof node.type === "function") {
    return collectImageSrcs(node.type(node.props));
  }

  const props = node.props as {
    readonly src?: string | undefined;
    readonly children?: React.ReactNode;
  };
  const current = typeof props.src === "string" ? [props.src] : [];
  const children = React.Children.toArray(props.children).flatMap((child) =>
    collectImageSrcs(child)
  );

  return [...current, ...children];
};

const collectTextNodes = (node: React.ReactNode): string[] => {
  if (typeof node === "string" || typeof node === "number") {
    return [`${node}`];
  }

  if (!React.isValidElement(node)) {
    return [];
  }

  if (typeof node.type === "function") {
    return collectTextNodes(node.type(node.props));
  }

  const props = node.props as {
    readonly children?: React.ReactNode;
  };

  return React.Children.toArray(props.children).flatMap((child) =>
    collectTextNodes(child)
  );
};

type ElementRecord = {
  readonly childCount: number;
  readonly props: {
    readonly children?: React.ReactNode;
    readonly style?: Record<string, unknown>;
  };
};

const collectElementRecords = (node: React.ReactNode): ElementRecord[] => {
  if (!React.isValidElement(node)) {
    return [];
  }

  if (typeof node.type === "function") {
    return collectElementRecords(node.type(node.props));
  }

  const props = node.props as ElementRecord["props"];
  const current = {
    childCount: React.Children.count(props.children),
    props,
  };
  const children = React.Children.toArray(props.children).flatMap((child) =>
    collectElementRecords(child)
  );

  return [current, ...children];
};

const getStyleNumber = (
  style: Record<string, unknown>,
  key: string
): number => {
  const value = style[key];
  if (typeof value !== "number") {
    throw new Error(`Expected numeric style ${key}.`);
  }
  return value;
};

describe("branded OG card renderers", () => {
  it("renders NFT card art through the OG image proxy", () => {
    const element = renderBrandedNftOgImage({
      artist: "6529er",
      badge: "The Memes",
      collection: "The Memes",
      contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
      id: "6529",
      imageUrl: "https://cdn.test/meme.png",
      origin: "http://localhost:3001",
      subtitle: "Card 6529 from The Memes collection",
      title: "Seize the Memes of Production",
    });

    expect(collectImageSrcs(element)).toEqual(
      expect.arrayContaining([
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fcdn.test%2Fmeme.png&w=538",
        "https://6529.test/6529.svg",
      ])
    );
    expect(collectTextNodes(element)).toEqual(
      expect.arrayContaining([
        "The Memes",
        "Seize the Memes",
        "of Production",
        "Card 6529 from The Memes",
        "collection",
        "#6,529",
        "by",
        "6529er",
        "0x33FD...7aF1",
      ])
    );
  });

  it("renders collection card local images directly from the public base URL", () => {
    const element = renderBrandedCollectionOgImage({
      badge: "6529 Collections",
      imageUrl: "/memes-preview.png",
      slug: "the-memes",
      subtitle: "The Memes by 6529",
      title: "The Memes",
    });

    expect(collectImageSrcs(element)).toEqual(
      expect.arrayContaining([
        "https://6529.test/memes-preview.png",
        "https://6529.test/6529.svg",
      ])
    );
    expect(collectTextNodes(element)).toEqual(
      expect.arrayContaining([
        "6529 Collections",
        "The Memes",
        "The Memes by 6529",
        "the-memes",
      ])
    );
  });

  it("proxies protocol-relative public HTTPS card art URLs", () => {
    const element = renderBrandedNftOgImage({
      contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
      id: "6529",
      imageUrl: "//cdn.test/meme.png",
      origin: "http://localhost:3001",
      title: "Protocol-relative art",
    });

    expect(collectImageSrcs(element)).toEqual(
      expect.arrayContaining([
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fcdn.test%2Fmeme.png&w=538",
      ])
    );
  });

  it("renders the placeholder for non-HTTPS external card art URLs", () => {
    const element = renderBrandedNftOgImage({
      collection: "The Memes",
      contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
      id: "6529",
      imageUrl: "http://cdn.test/meme.png",
      origin: "http://localhost:3001",
      title: "HTTP art",
    });

    expect(collectImageSrcs(element)).not.toEqual(
      expect.arrayContaining([
        "http://localhost:3001/api/og-metadata/image?url=http%3A%2F%2Fcdn.test%2Fmeme.png&w=538",
      ])
    );
    expect(collectTextNodes(element)).toEqual(
      expect.arrayContaining(["6529", "The Memes"])
    );
  });

  it("renders the placeholder for disallowed external card art hosts", () => {
    const element = renderBrandedNftOgImage({
      collection: "The Memes",
      contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
      id: "6529",
      imageUrl: "//localhost/secret.png",
      origin: "http://localhost:3001",
      title: "Localhost art",
    });

    expect(collectImageSrcs(element)).not.toEqual(
      expect.arrayContaining([
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Flocalhost%2Fsecret.png&w=538",
      ])
    );
    expect(collectTextNodes(element)).toEqual(
      expect.arrayContaining(["6529", "The Memes"])
    );
  });

  it("renders the placeholder for local paths that resolve off origin", () => {
    const element = renderBrandedCollectionOgImage({
      imageUrl: "/\\evil.test/meme.png",
      slug: "the-memes",
      title: "The Memes",
    });

    expect(collectImageSrcs(element)).not.toContain(
      "https://evil.test/meme.png"
    );
    expect(collectTextNodes(element)).toEqual(
      expect.arrayContaining(["6529", "The Memes"])
    );
  });

  it("does not treat bare relative card art URLs as local assets", () => {
    const element = renderBrandedCollectionOgImage({
      imageUrl: "memes-preview.png",
      slug: "the-memes",
      title: "The Memes",
    });

    expect(collectImageSrcs(element)).not.toContain(
      "https://6529.test/memes-preview.png"
    );
  });

  it("keeps non-decimal NFT ids unformatted", () => {
    const element = renderBrandedNftOgImage({
      contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
      id: " 5 ",
      title: "Spaced id",
    });

    expect(collectTextNodes(element)).toEqual(expect.arrayContaining(["# 5 "]));
  });

  it("uses displayId for the visible NFT id label", () => {
    const element = renderBrandedNftOgImage({
      collection: "Pebbles",
      contract: "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
      displayId: "42",
      id: "10000000042",
      title: "Pebbles #42",
    });
    const textNodes = collectTextNodes(element);

    expect(textNodes).toContain("#42");
    expect(textNodes).not.toContain("#10,000,000,042");
  });

  it("positions NFT metadata below long subtitles", () => {
    const element = renderBrandedNftOgImage({
      artist: "A Very Long Artist Name",
      badge: "Long Text",
      collection: "The Memes",
      contract: "0xabc",
      id: "999",
      imageUrl: "/memes-preview.png",
      subtitle:
        "This subtitle is also intentionally long so QA can verify the generated image still returns successfully with wrapped text",
      title:
        "This is a very long NFT title that should wrap cleanly inside the branded social card without escaping its content column or causing the image route to fail",
    });
    const records = collectElementRecords(element);
    const subtitleRecord = records.find(({ props }) => {
      const style = props.style;
      return (
        style?.color === "#D5D5DC" &&
        style.fontSize === 34 &&
        style.lineHeight === 1.18
      );
    });
    const metadataRecord = records.find(({ props }) => {
      const style = props.style;
      return (
        style?.color === "#9A9AA5" && style.fontSize === 30 && style.gap === 16
      );
    });

    expect(subtitleRecord).toBeDefined();
    expect(metadataRecord).toBeDefined();
    if (!subtitleRecord?.props.style || !metadataRecord?.props.style) {
      throw new Error("Expected subtitle and metadata records.");
    }

    const subtitleTop = getStyleNumber(subtitleRecord.props.style, "top");
    const subtitleFontSize = getStyleNumber(
      subtitleRecord.props.style,
      "fontSize"
    );
    const subtitleLineHeight = getStyleNumber(
      subtitleRecord.props.style,
      "lineHeight"
    );
    const subtitleBottom =
      subtitleTop +
      subtitleRecord.childCount * subtitleFontSize * subtitleLineHeight;
    const metadataTop = getStyleNumber(metadataRecord.props.style, "top");

    expect(metadataTop).toBeGreaterThanOrEqual(subtitleBottom + 18);
  });
});
