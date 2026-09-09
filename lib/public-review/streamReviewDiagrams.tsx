import type { ReactNode } from "react";

import {
  StreamReviewDiagram,
  type StreamReviewDiagramKind,
} from "@/components/public-review/StreamReviewDiagram";
import { getPublicReviewHeadingId } from "./editorialSections";
import type { PublicReviewSource } from "./publicReviewTypes";
import { STREAM_REVIEW_ENTRY_GUIDE_VERSION } from "./streamReviewEntryGuides";

type DiagramPlacement = {
  readonly kind: StreamReviewDiagramKind;
  readonly heading: string;
  readonly block: "table" | "paragraph";
};

const PLACEMENTS: Readonly<Record<string, DiagramPlacement>> = {
  overview: {
    kind: "formats",
    heading: "What kinds of art can it support?",
    block: "table",
  },
  "for-artists": {
    kind: "artist",
    heading: "Know what your approval covers",
    block: "paragraph",
  },
  "roles-and-trust": {
    kind: "roles",
    heading: "Who controls what",
    block: "table",
  },
  "review-the-code": {
    kind: "code",
    heading: "Start with the actual connections",
    block: "table",
  },
  "revenue-splits-and-royalties": {
    kind: "payment",
    heading: "Two payment paths must not be confused",
    block: "paragraph",
  },
  "freezing-preservation-and-artwork-finality": {
    kind: "finality",
    heading: "Four different promises",
    block: "paragraph",
  },
};

// These replacements belong only to the current reading view. Never rewrite the
// immutable editorial files, their checksums, or versioned route content.
export function getStreamReviewDiagramPresentation({
  pageId,
  markdown,
  version,
  routeVersion,
  source,
}: {
  readonly pageId: string;
  readonly markdown: string;
  readonly version: string;
  readonly routeVersion?: string | undefined;
  readonly source: PublicReviewSource;
}): {
  readonly markdown: string;
  readonly sectionIntros?: Readonly<Record<string, ReactNode>>;
} {
  const placement = PLACEMENTS[pageId];
  if (routeVersion !== undefined || !placement) return { markdown };
  if (
    version !== STREAM_REVIEW_ENTRY_GUIDE_VERSION ||
    source.repository !== "6529-Collections/6529Stream" ||
    source.commit !== "92ea123380917032f01aae09691141a2a72df935"
  ) {
    throw new Error(
      "Stream diagrams must be reviewed for this source snapshot."
    );
  }

  const heading = `## ${placement.heading}\n\n`;
  const headingOffset = markdown.indexOf(heading);
  if (
    headingOffset < 0 ||
    markdown.includes(heading, headingOffset + heading.length)
  ) {
    throw new Error(
      `Stream diagram section is missing or ambiguous: ${pageId}`
    );
  }
  const start = headingOffset + heading.length;
  const nextHeading = markdown.indexOf("\n## ", start);
  const end = nextHeading < 0 ? markdown.length : nextHeading;
  const section = markdown.slice(start, end);
  const blocks = section.split("\n\n");
  const block =
    placement.block === "table"
      ? blocks.find(
          (candidate) =>
            candidate.startsWith("|") &&
            candidate.split("\n").every((line) => line.startsWith("|"))
        )
      : blocks[0];
  if (!block || block.startsWith("## ")) {
    throw new Error(`Stream diagram replacement is missing: ${pageId}`);
  }
  const remainingSection = section
    .replace(block, "")
    .replace(/^\n+/, "")
    .replace(/\n{3,}/g, "\n\n");
  return {
    markdown: markdown.slice(0, start) + remainingSection + markdown.slice(end),
    sectionIntros: {
      [getPublicReviewHeadingId(placement.heading)]: (
        <StreamReviewDiagram
          kind={placement.kind}
          detailsMarkdown={placement.block === "table" ? block : undefined}
        />
      ),
    },
  };
}
