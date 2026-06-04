jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.test",
  },
}));

import { renderWaveOgImage } from "@/app/api/og-metadata/waves/[id]/image";
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

describe("renderWaveOgImage", () => {
  it("renders wave media, creator, stats, and logo", () => {
    const element = renderWaveOgImage({
      id: "wave-1",
      origin: "http://localhost:3001",
      author: {
        id: "profile-1",
        handle: "punk6529",
        cic: 47,
        level: 100,
        media: [{ url: "https://cdn.test/avatar.webp" }],
      },
      wave: {
        id: "wave-1",
        name: "Memes-Chat",
        description: "Memes chat is the main chat for the Memes Maxis",
        subscribers_count: 6,
        drops_count: 566,
        media: [{ url: "https://cdn.test/wave.webp" }],
      },
    });

    const srcs = collectImageSrcs(element);
    const textNodes = collectTextNodes(element);

    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fcdn.test%2Fwave.webp&w=342"
    );
    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fcdn.test%2Favatar.webp&w=56"
    );
    expect(srcs).toContain("https://6529.test/6529.svg");
    expect(textNodes).toEqual(
      expect.arrayContaining([
        "Memes-Chat",
        "Memes chat is the main chat for",
        "the Memes Maxis",
        "by",
        "punk6529",
        "566",
        "Drops",
        "6",
        "Joined",
      ])
    );
  });

  it("renders a winning activity badge for the author when present", () => {
    const element = renderWaveOgImage({
      id: "wave-1",
      author: {
        id: "profile-1",
        handle: "artist",
        has_active_submissions: true,
        has_winning_submissions: true,
      },
      wave: {
        id: "wave-1",
        name: "Winning Wave",
      },
    });

    expect(collectTextNodes(element)).toContain("artist");
  });

  it("does not render a wave media placeholder when wave media is missing", () => {
    const element = renderWaveOgImage({
      id: "wave-1",
      wave: {
        id: "wave-1",
        name: "No Media Wave",
      },
    });

    const textNodes = collectTextNodes(element);

    expect(textNodes).toContain("No Media Wave");
    expect(textNodes).not.toContain("N");
  });

  it("keeps common wave titles on one line when they fit", () => {
    const element = renderWaveOgImage({
      id: "wave-1",
      wave: {
        id: "wave-1",
        name: "The Memes - Main Stage",
      },
    });

    expect(collectTextNodes(element)).toContain("The Memes - Main Stage");
  });
});
