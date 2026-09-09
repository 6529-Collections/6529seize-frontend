import { render, screen } from "@testing-library/react";
import { MuseumNetworkProposition } from "@/components/museum/MuseumNetworkProposition";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumPublicDocument,
  MuseumPublicWork,
} from "@/lib/museum/publication";

jest.mock("@/components/museum/MuseumPublicMediaFigure", () => ({
  MuseumPublicMediaFigure: ({
    title,
    byline,
  }: {
    readonly title: string;
    readonly byline?: string;
  }) => (
    <figure data-testid="museum-about-artwork">
      <div
        role="img"
        aria-label={byline === undefined ? title : `${title} by ${byline}`}
      />
    </figure>
  ),
}));

function document(
  kind: "open_museum_statement" | "onchain_transition",
  sourcePath: string
): MuseumPublicDocument {
  return {
    id: kind,
    kind,
    title: kind,
    markdown: "",
    sha256: null,
    sourcePath,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  };
}

describe("MuseumNetworkProposition", () => {
  it("keeps public labels readable without demoting section conclusions", () => {
    render(
      <MuseumNetworkProposition
        commit={"a".repeat(40)}
        missionSourceUrl="https://github.com/6529-Collections/6529networkmuseum/blob/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/policies/founding-principles.md"
        openMuseum={document(
          "open_museum_statement",
          "docs/open-museum-statement.md"
        )}
        transition={document(
          "onchain_transition",
          "docs/onchain-transition.md"
        )}
      />
    );

    for (const key of [
      "museum.network.proposition.eyebrow",
      "museum.network.proposition.working.eyebrow",
      "museum.network.proposition.sources.title",
    ] as const) {
      expect(screen.getByText(t(DEFAULT_LOCALE, key))).toHaveClass(
        "tw-text-sm"
      );
    }

    for (const key of [
      "museum.network.proposition.today.governance.body",
      "museum.network.proposition.next.decisions.body",
    ] as const) {
      expect(screen.getByText(t(DEFAULT_LOCALE, key))).toHaveClass(
        "tw-text-base",
        "tw-leading-7"
      );
    }

    const principle = screen.getByText(
      t(DEFAULT_LOCALE, "museum.network.proposition.principle")
    );
    expect(principle).toHaveClass(
      "tw-text-lg",
      "tw-leading-8",
      "tw-text-iron-300",
      "sm:tw-text-lg",
      "sm:tw-leading-8"
    );
    expect(
      screen.getByRole("heading", { name: "Collection and acquisition" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Scholarship and interpretation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "A museum open to the public" })
    ).toBeInTheDocument();
  });

  it("places representative work before the institutional record", () => {
    const work = {
      kind: "work",
      id: "6529NM-W-0001",
      slug: "work-1",
      title: "Work One",
      medium: "Digital work",
      artistId: "artist-1",
      projectId: null,
      status: "accessioned_into_permanent_collection",
      statusAsOf: "2026-08-12",
      collectionMembership: true,
      acquisitionIds: [],
      programIds: [],
      media: [
        {
          id: "media-1",
          artworkId: "6529NM-W-0001",
          kind: "still",
          role: "source",
          mediaType: "image/jpeg",
          width: 1200,
          height: 900,
          altText: "Work One",
          credit: {
            creditLine: "The Museum",
            licenseLabel: "CC0",
            licenseUrl: null,
            rightsExpressionId: null,
            sourcePath: "records/media.json",
          },
          sourcePath: "records/media.json",
          custody: "retained",
          url: "https://media.example.test/work-one.jpg",
          preservationStatus: "retained_verified",
          sha256: null,
          upstreamProvider: null,
        },
      ],
      documentIds: [],
      qualifiers: [],
      sourcePaths: ["records/work-one.json"],
    } as unknown as MuseumPublicWork;

    render(
      <MuseumNetworkProposition
        commit={"a".repeat(40)}
        missionSourceUrl="https://example.test/mission"
        openMuseum={document(
          "open_museum_statement",
          "docs/open-museum-statement.md"
        )}
        transition={document(
          "onchain_transition",
          "docs/onchain-transition.md"
        )}
        featuredWorks={[{ work, artistName: "Casey Reas" }]}
      />
    );

    expect(screen.getByTestId("museum-about-artwork")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Works held and studied" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Collection care" })
    ).toBeInTheDocument();
  });
});
