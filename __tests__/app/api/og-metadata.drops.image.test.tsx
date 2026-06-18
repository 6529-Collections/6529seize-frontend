jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.test",
  },
}));

import { renderDropOgImage } from "@/app/api/og-metadata/drops/[id]/image";
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

const collectStyles = (node: React.ReactNode): React.CSSProperties[] => {
  if (!React.isValidElement(node)) {
    return [];
  }

  if (typeof node.type === "function") {
    return collectStyles(node.type(node.props));
  }

  const props = node.props as {
    readonly children?: React.ReactNode;
    readonly style?: React.CSSProperties;
  };
  const current = props.style ? [props.style] : [];
  const children = React.Children.toArray(props.children).flatMap((child) =>
    collectStyles(child)
  );

  return [...current, ...children];
};

describe("renderDropOgImage", () => {
  it("renders author, wave name, text, media, and logo for chat drops", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      author: {
        id: "profile-1",
        handle: "test1234",
        cic: 0,
        level: 0,
        has_winning_submissions: true,
        media: [{ url: "https://d3lqz0a4bldqgf.cloudfront.net/avatar.gif" }],
      },
      wave: { id: "wave-1", name: "Memes-Chat" },
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "Hello world",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.png",
            mime_type: "image/png",
          },
        ],
      },
    });

    const srcs = collectImageSrcs(element);
    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);

    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Favatar.gif&w=64"
    );
    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.png&w=1108"
    );
    expect(srcs).toContain("https://6529.test/6529.svg");
    expect(styles).toContainEqual(
      expect.objectContaining({
        objectFit: "contain",
        objectPosition: "top center",
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        flexDirection: "column",
        fontSize: 42,
        top: 146,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      })
    );
    expect(styles).not.toContainEqual(
      expect.objectContaining({
        background:
          "linear-gradient(180deg, rgba(19,19,22,0) 0%, rgba(19,19,22,0.92) 100%)",
      })
    );
    expect(textNodes).toEqual(
      expect.arrayContaining(["test1234", "Memes-Chat", "Hello world"])
    );
    expect(textNodes).not.toContain("Drop #6411");
  });

  it("renders mention and wave markdown tokens without brackets", () => {
    const element = renderDropOgImage({
      id: "6412",
      origin: "http://localhost:3001",
      author: undefined,
      wave: undefined,
      drop: {
        id: "drop-1",
        serial_no: 6412,
        drop_type: "CHAT" as any,
        content: "Color refs for @[prxt0] and #[The Memes - Main Stage] inline",
      },
    });

    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);
    const renderedText = textNodes.join("");

    expect(renderedText).toContain("@prxt0");
    expect(renderedText).toContain("#The Memes - Main Stage");
    expect(renderedText).not.toContain("@[prxt0]");
    expect(renderedText).not.toContain("#[The Memes - Main Stage]");
    expect(styles).toContainEqual(
      expect.objectContaining({
        color: "#79B8FF",
      })
    );
  });

  it("renders trailing ellipsis on segmented content lines", () => {
    const element = renderDropOgImage({
      id: "6413",
      origin: "http://localhost:3001",
      author: undefined,
      wave: undefined,
      drop: {
        id: "drop-1",
        serial_no: 6413,
        drop_type: "CHAT" as any,
        content: [
          "one",
          "two",
          "three",
          "four",
          "five",
          "six",
          "seven",
          "@[eight]",
          "nine",
        ].join("\n"),
      },
    });

    const textNodes = collectTextNodes(element);

    expect(textNodes).toContain("@eight...");
    expect(textNodes).not.toContain("@eight");
    expect(textNodes).not.toContain("nine");
  });

  it("renders submission drops with winner, media type, visual image, and votes", () => {
    const element = renderDropOgImage({
      id: "5905",
      origin: "http://localhost:3001",
      author: {
        id: "profile-1",
        handle: "test1234",
        cic: 0,
        level: 0,
        has_winning_submissions: true,
        media: [{ url: "https://d3lqz0a4bldqgf.cloudfront.net/avatar.gif" }],
      },
      wave: { id: "wave-1", name: "The Memes - Main Stage" },
      drop: {
        id: "drop-1",
        serial_no: 5905,
        drop_type: "SUBMISSION" as any,
        submission_status: "WINNER" as any,
        submitted_at: Date.UTC(2026, 4, 28),
        won_at: Date.UTC(2026, 5, 3),
        title: "title",
        content: "desc",
        votes: {
          is_open: false,
          total_votes_given: 0,
          current_calculated_vote: 100,
          predicted_final_vote: 0,
          voters_count: 5,
          place: 1,
        },
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.gif",
            mime_type: null,
          },
          {
            url: "https://arweave.net/html-submission",
            mime_type: "text/html",
          },
        ],
      },
    });

    const srcs = collectImageSrcs(element);
    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);

    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.gif&w=1108"
    );
    expect(srcs).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Farweave.net%2Fhtml-submission&w=1108"
    );
    expect(textNodes).toEqual(
      expect.arrayContaining([
        "title",
        "100",
        "TDH",
        "5",
        "Voters",
        "Won",
        "Jun 3, 2026",
      ])
    );
    expect(textNodes).not.toContain("Submitted");
    expect(textNodes).not.toContain("May 28, 2026");
    expect(styles).toContainEqual(
      expect.objectContaining({
        background: "rgba(56, 189, 248, 0.08)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        color: "rgba(56, 189, 248, 0.7)",
        height: 40,
        width: 40,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        fontSize: 40,
        whiteSpace: "nowrap",
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        gap: 12,
        justifyContent: "center",
        top: 138,
        width: 1108,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        fontSize: 24,
        justifyContent: "space-between",
        top: 566,
        width: 1108,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        height: 344,
        top: 206,
        width: 1108,
      })
    );
  });

  it("renders submission drops without image media as media placeholders", () => {
    const element = renderDropOgImage({
      id: "5906",
      origin: "http://localhost:3001",
      wave: { id: "wave-1", name: "Memes-Chat" },
      drop: {
        id: "drop-1",
        serial_no: 5906,
        drop_type: "SUBMISSION" as any,
        submission_status: "ACTIVE" as any,
        title: "video submission",
        votes: {
          is_open: false,
          total_votes_given: 0,
          current_calculated_vote: 1,
          predicted_final_vote: 0,
          voters_count: 1,
          place: 1,
        },
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/submission.mp4",
            mime_type: "video/mp4",
          },
        ],
      },
    });

    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);

    expect(collectImageSrcs(element)).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fsubmission.mp4&w=1108"
    );
    expect(textNodes).toEqual(
      expect.arrayContaining(["video submission", "Video", "1", "TDH", "Voter"])
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        background: "rgba(167, 139, 250, 0.08)",
        border: "1px solid rgba(167, 139, 250, 0.2)",
        color: "rgba(167, 139, 250, 0.7)",
      })
    );
  });

  it("does not render media when chat text fills the preview", () => {
    const longText = Array.from(
      { length: 80 },
      (_, index) => `word${index}`
    ).join(" ");
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: longText,
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.png",
            mime_type: "image/png",
          },
        ],
      },
    });

    expect(collectImageSrcs(element)).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.png&w=1108"
    );
  });

  it("proxies public https media from non-6529 hosts", () => {
    const element = renderDropOgImage({
      id: "6518",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6518,
        drop_type: "CHAT" as any,
        content: "a vertical image",
        media: [
          {
            url: "https://wallpapers.com/images/high/vertical-pictures.webp",
            mime_type: "image/webp",
          },
        ],
      },
    });

    const styles = collectStyles(element);
    const contentStyle = styles.find(
      (style) => style.flexDirection === "column" && style.fontSize === 42
    );

    expect(collectImageSrcs(element)).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fwallpapers.com%2Fimages%2Fhigh%2Fvertical-pictures.webp&w=1108"
    );
    expect(contentStyle).toEqual(
      expect.objectContaining({
        alignItems: "flex-start",
        top: 146,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      })
    );
  });

  it("centers short text-only chat drops horizontally and vertically", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "a vertical image Seize",
        media: [],
      },
    });

    const styles = collectStyles(element);
    const contentStyle = styles.find(
      (style) => style.flexDirection === "column" && style.fontSize === 42
    );

    expect(contentStyle).toEqual(
      expect.objectContaining({
        alignItems: "center",
        top: expect.any(Number),
      })
    );
    expect(contentStyle?.top as number).toBeGreaterThan(146);
    expect(styles).toContainEqual(
      expect.objectContaining({
        whiteSpace: "nowrap",
        width: "auto",
      })
    );
  });

  it("hard-wraps long links and styles them as link text", () => {
    const longLink =
      "https://github.com/6529-Collections/6529seize-frontend/blob/main/app/api/og-metadata/drops/very-long-path-with-no-spaces";
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      author: {
        id: "profile-1",
        handle: "phoebeum",
      },
      wave: { id: "wave-1", name: "Memes-Chat" },
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: `test with link ${longLink} and then more text after it`,
      },
    });

    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);

    expect(textNodes).toContain("test with link");
    expect(textNodes).toContain("and then more text after it");
    expect(textNodes).not.toContain(longLink);
    const firstLinkLineIndex = textNodes.findIndex((text) =>
      text.startsWith("🔗 https://github.com/")
    );
    expect(firstLinkLineIndex).toBeGreaterThanOrEqual(0);
    expect(textNodes[firstLinkLineIndex + 1]).toEqual(
      expect.stringMatching(/\.\.\.$/)
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        color: "#79B8FF",
      })
    );
    const contentStyle = styles.find(
      (style) => style.flexDirection === "column" && style.fontSize === 42
    );
    expect(contentStyle?.top).toEqual(expect.any(Number));
    expect(contentStyle?.top as number).toBeGreaterThan(146);
  });

  it("keeps smaller media at its natural dimensions without fading it", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "Hello world",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/small.png",
            mime_type: "image/png",
            width: 420,
            height: 180,
          },
        ],
      },
    });

    const styles = collectStyles(element);

    expect(collectImageSrcs(element)).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fsmall.png&w=420"
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        height: 180,
        objectFit: "contain",
        width: 420,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      })
    );
    expect(styles).not.toContainEqual(
      expect.objectContaining({
        background:
          "linear-gradient(180deg, rgba(19,19,22,0) 0%, rgba(19,19,22,0.92) 100%)",
      })
    );
  });

  it("contains large single media when the full image still fits usefully", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "Hello world",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/large.png",
            mime_type: "image/png",
            width: 1000,
            height: 667,
          },
        ],
      },
    });

    const srcs = collectImageSrcs(element);
    const styles = collectStyles(element);

    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Flarge.png&w=551"
    );
    expect(srcs).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Flarge.png&w=1108"
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        objectFit: "contain",
        width: expect.any(Number),
      })
    );
    expect(styles).not.toContainEqual(
      expect.objectContaining({
        background:
          "linear-gradient(180deg, rgba(19,19,22,0) 0%, rgba(19,19,22,0.92) 100%)",
      })
    );
  });

  it("renders first four media assets in a gallery grid", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "multiple images",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/one.png",
            mime_type: "image/png",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/two.png",
            mime_type: "image/png",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/three.png",
            mime_type: "image/png",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/four.png",
            mime_type: "image/png",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/five.png",
            mime_type: "image/png",
          },
        ],
      },
    });

    const srcs = collectImageSrcs(element);
    const styles = collectStyles(element);

    expect(srcs).toEqual(
      expect.arrayContaining([
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fone.png&w=548",
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Ftwo.png&w=548",
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fthree.png&w=548",
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Ffour.png&w=548",
      ])
    );
    expect(srcs).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Ffive.png&w=548"
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        borderTopLeftRadius: 28,
        height: expect.any(Number),
        position: "absolute",
        width: 548,
      })
    );
    expect(styles).not.toContainEqual(
      expect.objectContaining({
        background:
          "linear-gradient(180deg, rgba(19,19,22,0) 0%, rgba(19,19,22,0.92) 100%)",
      })
    );
  });

  it("renders media-only chat drops", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: null,
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.png",
            mime_type: "image/png",
          },
        ],
      },
    });

    expect(collectImageSrcs(element)).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.png&w=1108"
    );
  });

  it("renders video media as a filename line without proxying the video", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "Video drop",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.mp4",
            mime_type: null,
          },
        ],
      },
    });

    expect(collectImageSrcs(element)).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.mp4&w=1108"
    );
    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);

    expect(textNodes).toEqual(
      expect.arrayContaining(["Video drop", "drop.mp4"])
    );
    expect(textNodes).not.toContain("Video");
    expect(styles).toContainEqual(
      expect.objectContaining({
        background: "rgba(167, 139, 250, 0.08)",
        border: "1px solid rgba(167, 139, 250, 0.25)",
        color: "rgba(167, 139, 250, 0.78)",
        height: 38,
        width: 38,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        color: "rgba(167, 139, 250, 0.9)",
        marginBottom: 6,
        marginTop: 18,
      })
    );
  });

  it("summarizes extra video attachment rows", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: null,
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/one.mp4",
            mime_type: "video/mp4",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/two.mp4",
            mime_type: "video/mp4",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/three.mp4",
            mime_type: "video/mp4",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/four.mp4",
            mime_type: "video/mp4",
          },
        ],
      },
    });

    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);

    expect(textNodes).toEqual(
      expect.arrayContaining(["one.mp4", "two.mp4", "three.mp4", "+1 videos"])
    );
    expect(textNodes).not.toContain("four.mp4");
    expect(styles).toContainEqual(
      expect.objectContaining({
        alignItems: "flex-start",
        flexDirection: "column",
        fontSize: 42,
      })
    );
    expect(styles).not.toContainEqual(
      expect.objectContaining({
        whiteSpace: "nowrap",
        width: "auto",
      })
    );
    expect(collectImageSrcs(element)).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fone.mp4&w=1108"
    );
  });

  it("renders image media visually and video media as attachment rows", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "mixed media",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/one.png",
            mime_type: "image/png",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/one.mp4",
            mime_type: "video/mp4",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/two.png",
            mime_type: "image/png",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/two.mp4",
            mime_type: "video/mp4",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/three.mp4",
            mime_type: "video/mp4",
          },
        ],
      },
    });

    const srcs = collectImageSrcs(element);
    const textNodes = collectTextNodes(element);

    expect(srcs).toEqual(
      expect.arrayContaining([
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fone.png&w=548",
        "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Ftwo.png&w=548",
      ])
    );
    expect(srcs).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fone.mp4&w=548"
    );
    expect(textNodes).toEqual(
      expect.arrayContaining(["mixed media", "one.mp4", "two.mp4", "+1 videos"])
    );
    expect(textNodes).not.toContain("three.mp4");
  });

  it("ignores html media instead of counting it as image gallery media", () => {
    const element = renderDropOgImage({
      id: "5905",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 5905,
        drop_type: "SUBMISSION" as any,
        content: "desc",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.gif",
            mime_type: null,
          },
          {
            url: "https://arweave.net/html-submission",
            mime_type: "text/html",
          },
        ],
      },
    });

    expect(collectImageSrcs(element)).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.gif&w=1108"
    );
    expect(collectImageSrcs(element)).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Farweave.net%2Fhtml-submission&w=548"
    );
  });

  it("renders drop files as attachment rows without proxying them", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "file drop",
        files: [
          {
            attachment_id: "attachment-1",
            file_name: "terms.pdf",
            mime_type: "application/pdf" as any,
            kind: "FILE" as any,
            status: "COMPLETED" as any,
            url: "https://d3lqz0a4bldqgf.cloudfront.net/terms.pdf",
          },
        ],
      },
    });

    const styles = collectStyles(element);
    const textNodes = collectTextNodes(element);

    expect(textNodes).toEqual(
      expect.arrayContaining(["file drop", "terms.pdf"])
    );
    expect(collectImageSrcs(element)).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fterms.pdf&w=1108"
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        background: "rgba(129, 140, 248, 0.08)",
        border: "1px solid rgba(129, 140, 248, 0.25)",
        color: "#818CF8",
        height: 38,
        width: 38,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        color: "#818CF8",
        marginBottom: 6,
        marginTop: 18,
      })
    );
  });

  it("renders mixed video and file attachments before image media", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: "mixed attachments",
        files: [
          {
            attachment_id: "attachment-1",
            file_name: "brief.pdf",
            mime_type: "application/pdf" as any,
            kind: "FILE" as any,
            status: "COMPLETED" as any,
          },
        ],
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.mp4",
            mime_type: "video/mp4",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.png",
            mime_type: "image/png",
          },
        ],
      },
    });

    const textNodes = collectTextNodes(element);

    expect(textNodes).toEqual(
      expect.arrayContaining(["mixed attachments", "drop.mp4", "brief.pdf"])
    );
    expect(collectImageSrcs(element)).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.png&w=1108"
    );
    expect(collectImageSrcs(element)).not.toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fd3lqz0a4bldqgf.cloudfront.net%2Fdrop.mp4&w=1108"
    );
  });

  it("places image media below video attachments when there is no text", () => {
    const element = renderDropOgImage({
      id: "6411",
      origin: "http://localhost:3001",
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT" as any,
        content: null,
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.mp4",
            mime_type: "video/mp4",
          },
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drop.png",
            mime_type: "image/png",
            width: 500,
            height: 500,
          },
        ],
      },
    });

    const styles = collectStyles(element);

    expect(collectTextNodes(element)).toContain("drop.mp4");
    expect(styles).toContainEqual(
      expect.objectContaining({
        flexDirection: "column",
        fontSize: 42,
        top: 146,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        position: "absolute",
        top: 220,
      })
    );
    expect(styles).toContainEqual(
      expect.objectContaining({
        height: expect.any(Number),
        objectFit: "contain",
        width: expect.any(Number),
      })
    );
  });
});
