jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "http://localhost:3002" },
}));
jest.mock("@/config/publicReviews", () => ({
  isPublicReviewEnabled: () => true,
}));
jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: ({ title }: { title: string }) => ({ title }),
}));
jest.mock("@/components/public-review/PublicReviewShell", () => ({
  PublicReviewShell: (props: {
    editorialMarkdown: string;
    sectionIntros?: Readonly<Record<string, React.ReactNode>>;
    introNotice?: React.ReactNode;
    outroNotice?: React.ReactNode;
    feedbackSlot: React.ReactNode;
    displayedVersion: string;
    source: { commit: string };
    showEditorialContent: boolean;
  }) => (
    <main
      data-version={props.displayedVersion}
      data-source={props.source.commit}
    >
      {props.introNotice}
      {Object.values(props.sectionIntros ?? {})}
      {props.showEditorialContent && (
        <div data-testid="editorial">{props.editorialMarkdown}</div>
      )}
      {props.outroNotice}
      {props.feedbackSlot}
    </main>
  ),
}));
jest.mock("@/components/public-review/PublicReviewMarkdown", () => ({
  PublicReviewMarkdown: ({ markdown }: { markdown: string }) => (
    <div data-testid="artist-details">{markdown}</div>
  ),
}));
jest.mock("@/components/public-review/PublicReviewEditorialFeedback", () => ({
  PublicReviewEditorialFeedback: ({
    config,
    page,
    sections,
    commentSections,
  }: {
    config: { pages: { value: string; sectionValues?: string[] }[] };
    page: { pageId: string };
    sections: readonly { id: string; title: string }[];
    commentSections?: readonly { id: string; title: string; href?: string }[];
  }) => (
    <>
      <div data-testid="feedback-sections">
        {config.pages
          .find((p) => p.value === page.pageId)
          ?.sectionValues?.join(",")}
      </div>
      <div data-testid="feedback-panel-sections">
        {sections
          .map((section) => `${section.id}: ${section.title}`)
          .join("\n")}
      </div>
      <div data-testid="comment-sections">
        {commentSections?.map((section) => (
          <a
            key={section.id}
            href={section.href}
            data-testid={`comment-section-${section.id}`}
          >
            {section.title}
          </a>
        ))}
      </div>
    </>
  ),
}));
jest.mock("@/components/public-review/StreamReviewBotAuthorshipNote", () => ({
  StreamReviewBotAuthorshipNote: () => <div>Authorship note</div>,
}));
jest.mock("@/components/public-review/StreamReviewDevelopmentStatus", () => ({
  StreamReviewDevelopmentStatus: () => <div>Launch readiness</div>,
  StreamReviewReviewerPrompts: () => <div>Reviewer prompts</div>,
}));
jest.mock("@/components/public-review/StreamArtworkConceptPreview", () => ({
  StreamArtworkConceptPreview: () => <div>Artwork concept preview</div>,
}));
jest.mock("@/components/public-review/StreamReviewRolesGuide", () => ({
  STREAM_REVIEW_ROLES_GUIDE_SECTIONS: [],
  StreamReviewRolesGuide: () => <div>Legacy roles guide</div>,
}));
jest.mock("@/lib/public-review/streamReviewFeedback.server", () => ({
  createStreamEditorialFeedbackPageContext: ({
    page,
  }: {
    page: { id: string };
  }) => ({ pageId: page.id }),
  createStreamReviewFeedbackConfig: async () => ({
    pages: STREAM_REVIEW_CURRENT_PAGES.map((page) => ({
      value: page.id,
      sectionValues: [],
    })),
  }),
  resolveStreamReviewFeedbackDestination: async () => ({}),
}));
jest.mock("@/lib/public-review/streamSolidityReference", () => ({
  getStreamSolidityReferenceReader: () => ({ loadManifest: mockLoadManifest }),
}));

import fs from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";
import {
  STREAM_REVIEW_CURRENT_PAGES,
  STREAM_REVIEW_ENTRY_PAGES,
} from "@/lib/public-review/streamReviewEntryGuides";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import {
  STREAM_REVIEW_LEGACY_ENTRY_FEEDBACK_VERSION,
  STREAM_REVIEW_LEGACY_ENTRY_SECTIONS,
} from "@/lib/public-review/streamReviewLegacyEntryFeedback";
import {
  renderStreamReviewRoutePage,
  generateStreamReviewRouteMetadata,
} from "@/lib/public-review/streamReviewPage";

const mockLoadManifest = jest.fn(async (version: string) => ({
  manifest: {
    reviewId: "6529-stream",
    reviewVersion: version,
    source: {
      ...getStreamReviewVersion(version)!.source,
      tree: "a".repeat(40),
    },
  },
}));
const readEditorial = (version: string, page: string) =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      "content/public-reviews/6529-stream/versions",
      version,
      "editorial",
      `${page}.md`
    ),
    "utf8"
  );

async function show(page: string, version?: string) {
  return render(
    await renderStreamReviewRoutePage({
      params: Promise.resolve({
        review: "6529-stream",
        page,
        ...(version ? { version } : {}),
      }),
    })
  );
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("Stream versioned page rendering", () => {
  it.each(STREAM_REVIEW_CURRENT_PAGES)(
    "renders current $id against the new candidate",
    async (page) => {
      await show(page.id);
      expect(screen.getByRole("main")).toHaveAttribute(
        "data-version",
        "2026-09-09.1"
      );
      expect(screen.getByRole("main")).toHaveAttribute(
        "data-source",
        "92ea123380917032f01aae09691141a2a72df935"
      );
      expect(
        screen.getByTestId("editorial").textContent!.length
      ).toBeGreaterThan(100);
      if (
        !STREAM_REVIEW_ENTRY_PAGES.some((entry) => entry.id === page.id) &&
        ![
          "roles-and-trust",
          "revenue-splits-and-royalties",
          "freezing-preservation-and-artwork-finality",
        ].includes(page.id)
      ) {
        expect(screen.getByTestId("editorial").textContent).toBe(
          readEditorial(STREAM_REVIEW_VERSION, page.id)
        );
      }
      expect(screen.queryByText("Legacy roles guide")).not.toBeInTheDocument();
    }
  );

  it.each(getStreamReviewVersion("2026-08-01.1")!.pages)(
    "preserves August $id content and source",
    async (page) => {
      await show(page.id, "2026-08-01.1");
      expect(screen.getByTestId("editorial").textContent).toBe(
        readEditorial("2026-08-01.1", page.id)
      );
      expect(screen.getByRole("main")).toHaveAttribute(
        "data-source",
        "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
      );
      expect(
        screen.queryByText("Artwork concept preview")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("artist-details")).not.toBeInTheDocument();
      expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    }
  );

  it("keeps the artist details closed and includes their feedback targets", async () => {
    await show("for-artists");
    const details = screen.getByText("Full artist details").closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByTestId("artist-details").textContent).toBe(
      readEditorial(STREAM_REVIEW_VERSION, "for-artists")
    );
    for (const section of extractPublicReviewSections(
      readEditorial(STREAM_REVIEW_VERSION, "for-artists")
    )) {
      expect(screen.getByTestId("feedback-sections")).toHaveTextContent(
        section.id
      );
      expect(screen.getByTestId("feedback-panel-sections")).toHaveTextContent(
        `${section.id}: ${section.title}`
      );
    }
  });

  it("keeps the concept preview optional on the current overview", async () => {
    await show("overview");
    expect(
      screen.getByText("Explore an example artwork").closest("details")
    ).not.toHaveAttribute("open");
    expect(screen.getByText("Artwork concept preview")).toBeInTheDocument();
  });

  it("links retained overview comments to the saved headings without adding composer choices", async () => {
    await show("overview");
    for (const section of extractPublicReviewSections(
      readEditorial(STREAM_REVIEW_VERSION, "overview")
    )) {
      if (section.id === "choose-your-path") {
        expect(screen.getByTestId("feedback-panel-sections")).toHaveTextContent(
          `${section.id}: ${section.title}`
        );
        continue;
      }
      expect(screen.getByRole("link", { name: section.title })).toHaveAttribute(
        "href",
        `/reviews/6529-stream/versions/${STREAM_REVIEW_VERSION}#${section.id}`
      );
      expect(
        screen.getByTestId("feedback-panel-sections")
      ).not.toHaveTextContent(`${section.id}: ${section.title}`);
    }
  });

  it("keeps launch evidence on the development page", async () => {
    await show("security-testing-and-known-limitations");
    expect(screen.getByText("Launch readiness")).toBeInTheDocument();
    expect(screen.getByTestId("editorial")).toHaveTextContent(
      "18,997 runtime bytes"
    );
  });

  it.each(["overview", "for-artists"])(
    "preserves every legacy comment label and a valid topic target on the saved %s page",
    async (pageId) => {
      const version = STREAM_REVIEW_LEGACY_ENTRY_FEEDBACK_VERSION;
      await show(pageId, version);
      const editorialIds = new Set(
        extractPublicReviewSections(readEditorial(version, pageId)).map(
          (section) => section.id
        )
      );
      const basePath = `/reviews/6529-stream/versions/${version}${pageId === "overview" ? "" : `/${pageId}`}`;
      for (const id of STREAM_REVIEW_LEGACY_ENTRY_SECTIONS[pageId] ?? []) {
        const label = screen.getByTestId(`comment-section-${id}`);
        expect(label.textContent).toBeTruthy();
        expect(label.textContent).not.toBe(id);
        expect(label.textContent).not.toMatch(/^publicReview\./);
        if (editorialIds.has(id)) {
          expect(label).not.toHaveAttribute("href");
        } else {
          const href = label.getAttribute("href");
          expect(href).toContain(`${basePath}#`);
          expect(editorialIds.has(href?.split("#")[1] ?? "")).toBe(true);
          expect(
            screen.getByTestId("feedback-panel-sections")
          ).not.toHaveTextContent(`${id}:`);
        }
      }
    }
  );

  it("rejects source drift before displaying a current entry guide", async () => {
    mockLoadManifest.mockResolvedValueOnce({
      manifest: {
        reviewId: "6529-stream",
        reviewVersion: STREAM_REVIEW_VERSION,
        source: {
          repository: "6529-Collections/6529Stream",
          commit: "f".repeat(40),
          tree: "a".repeat(40),
        },
      },
    });
    await expect(show("overview")).rejects.toThrow("must be reviewed");
  });

  it("rejects unknown pages and never invents historical short-guide routes", async () => {
    await expect(show("missing")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(show("for-collectors", "2026-08-01.1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });

  it("uses the current guide title and canonical route in metadata", async () => {
    const metadata = await generateStreamReviewRouteMetadata({
      params: Promise.resolve({
        review: "6529-stream",
        page: "for-collectors",
      }),
    });
    expect(metadata.title).toContain("Stream for collectors");
    expect(metadata.alternates?.canonical).toBe(
      "http://localhost:3002/reviews/6529-stream/for-collectors"
    );
  });
});
