import { render, screen } from "@testing-library/react";
import MuseumMethodologyPage from "@/app/museum/network/methodology/page";
import { getMuseumView } from "@/lib/museum/normalize";
import { buildMuseumMainBlobUrl } from "@/lib/museum/publication/security";
import type { MuseumTextDocument, MuseumView } from "@/lib/museum/types";

jest.mock("@/lib/museum/normalize", () => ({
  getMuseumView: jest.fn(),
}));
jest.mock("@/lib/museum/publication/security", () => ({
  buildMuseumMainBlobUrl: jest.fn(),
}));

const mockedGetMuseumView = jest.mocked(getMuseumView);
const mockedBuildMuseumMainBlobUrl = jest.mocked(buildMuseumMainBlobUrl);

function document(path: string, title: string): MuseumTextDocument {
  return {
    path,
    title,
    excerpt: "Repository excerpt that should not replace the edited abstract.",
    markdown: "INTERNAL SOURCE BODY MUST NOT RENDER",
  };
}

function view(
  policies: readonly MuseumTextDocument[],
  methodology: readonly MuseumTextDocument[]
): MuseumView {
  return {
    sourceState: "fresh",
    release: null,
    mission: null,
    policies,
    methodology,
    governance: [],
    approvedCollections: [],
    programs: [],
    accessions: [],
    objects: [],
  };
}

describe("Museum methodology page", () => {
  beforeEach(() => {
    mockedBuildMuseumMainBlobUrl.mockImplementation(
      (path) =>
        `https://github.com/6529-Collections/6529networkmuseum/blob/main/${path}`
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("presents visitor abstracts while keeping complete technical documents in the source archive", async () => {
    mockedGetMuseumView.mockResolvedValue(
      view(
        [
          document(
            "policies/founding-and-operating-principles.md",
            "Repository policy title"
          ),
        ],
        [
          document("docs/accession-standard.md", "Repository standard title"),
          document(
            "docs/public-museum-experience-standard.md",
            "Internal product specification"
          ),
        ]
      )
    );

    render(await MuseumMethodologyPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Methods and provenance" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Collection policy",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Technical archive",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Museum's mission, curatorial premise, public purpose, and responsibilities to the collection."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("INTERNAL SOURCE BODY MUST NOT RENDER")
    ).toBeNull();
    expect(
      screen.queryByText(
        "Repository excerpt that should not replace the edited abstract."
      )
    ).toBeNull();
    expect(
      screen.getByRole("link", {
        name: "Read the source document for Public experience specification",
      })
    ).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/6529networkmuseum/blob/main/docs/public-museum-experience-standard.md"
    );
  });

  it("shows an honest empty state when no curated source is available", async () => {
    mockedGetMuseumView.mockResolvedValue(view([], []));

    render(await MuseumMethodologyPage());

    expect(
      screen.getByText(
        "The current Museum release contains no published methods or policy sources."
      )
    ).toBeInTheDocument();
  });

  it("renders only the source sections present in the verified release", async () => {
    mockedGetMuseumView.mockResolvedValue(
      view(
        [
          document(
            "policies/founding-and-operating-principles.md",
            "Repository policy title"
          ),
        ],
        []
      )
    );

    render(await MuseumMethodologyPage());

    expect(
      screen.getByRole("heading", { level: 2, name: "Collection policy" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Founding and operating principles",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Accession and record standards",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Technical archive",
      })
    ).not.toBeInTheDocument();
  });

  it("omits an unsafe source URL while preserving valid cards", async () => {
    mockedGetMuseumView.mockResolvedValue(
      view(
        [
          document(
            "policies/founding-and-operating-principles.md",
            "Repository policy title"
          ),
          document("policies/donation-acceptance.md", "Donation policy"),
        ],
        []
      )
    );
    mockedBuildMuseumMainBlobUrl.mockImplementation((path) =>
      path === "policies/founding-and-operating-principles.md"
        ? null
        : `https://github.com/6529-Collections/6529networkmuseum/blob/main/${path}`
    );

    render(await MuseumMethodologyPage());

    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Founding and operating principles",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Donation acceptance" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Read the source document for Donation acceptance",
      })
    ).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/6529networkmuseum/blob/main/policies/donation-acceptance.md"
    );
  });
});
