import { render, screen } from "@testing-library/react";
import { MuseumNetworkProposition } from "@/components/museum/MuseumNetworkProposition";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumPublicDocument,
  MuseumPublicWork,
} from "@/lib/museum/publication";
import {
  MUSEUM_REPOSITORY_URL,
  MUSEUM_SAFE_ETHERSCAN_URL,
} from "@/lib/museum/types";

jest.mock("@/components/museum/MuseumPublicMediaFigure", () => ({
  MuseumPublicMediaFigure: ({
    title,
    byline,
    qualifier,
    alignTitleToTop,
  }: {
    readonly title: string;
    readonly byline?: string;
    readonly qualifier?: string;
    readonly alignTitleToTop?: boolean;
  }) => (
    <figure
      data-testid="museum-about-artwork"
      data-align-title-to-top={alignTitleToTop ? "true" : "false"}
    >
      <div
        role="img"
        aria-label={byline === undefined ? title : `${title} by ${byline}`}
      />
      {qualifier === undefined ? null : <figcaption>{qualifier}</figcaption>}
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
    // The program's selection count lives in the publication, not this copy.
    expect(
      screen.getByText(/Its selected photographs have not yet been minted/u)
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

    const figure = screen.getByTestId("museum-about-artwork");
    expect(figure).toHaveTextContent("The Museum");
    expect(figure).toHaveAttribute("data-align-title-to-top", "true");
    expect(
      screen.getByRole("heading", { name: "Works held and studied" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Collection care" })
    ).toBeInTheDocument();

    const collectionLinks = screen
      .getAllByRole("link")
      .filter(
        (link) => link.getAttribute("href") === "/museum/network/collection"
      );
    expect(collectionLinks.map((link) => link.textContent)).toEqual([
      "Explore the Collection",
      "Explore the Collection",
    ]);
  });

  it("separates Collection care with the same top divider as its siblings", () => {
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
      />
    );

    const care = screen
      .getByRole("heading", { name: "Collection care" })
      .closest("section");
    const scholarship = screen
      .getByRole("heading", { name: "Scholarship and interpretation" })
      .closest("section");
    const dividerClasses = [
      "tw-border-x-0",
      "tw-border-b-0",
      "tw-border-t",
      "tw-pt-10",
    ];
    expect(scholarship).toHaveClass(...dividerClasses);
    expect(care).toHaveClass(...dividerClasses);
    expect(care).not.toHaveClass("tw-border-y");
  });

  it("explains custody and links each institutional destination once", () => {
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
      />
    );

    expect(
      screen.getByRole("heading", { name: "Custody" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/more than one of its signers approves/u)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Status: planned. Contract design is in progress; deployment and activation remain pending."
      )
    ).toBeInTheDocument();

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    for (const href of [
      MUSEUM_SAFE_ETHERSCAN_URL,
      MUSEUM_REPOSITORY_URL,
      "https://example.test/mission",
    ]) {
      expect(hrefs.filter((candidate) => candidate === href)).toHaveLength(1);
    }
    expect(
      screen.getByRole("link", { name: "View the Museum Safe on Etherscan" })
    ).toHaveAttribute("href", MUSEUM_SAFE_ETHERSCAN_URL);
    expect(
      screen.getByRole("link", { name: "View the public record on GitHub" })
    ).toHaveAttribute("href", MUSEUM_REPOSITORY_URL);
  });
});
