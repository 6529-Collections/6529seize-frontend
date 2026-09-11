import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { MuseumSourceContribution } from "@/components/museum/MuseumSourceContribution";
import type {
  MuseumPageSourceCatalog,
  MuseumPublicationIdentity,
} from "@/lib/museum/publication";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockedPathname = jest.mocked(usePathname);

const COMMIT = "a".repeat(40);
const identity: MuseumPublicationIdentity = {
  repository: "6529-Collections/6529networkmuseum",
  requestedRef: "main",
  commit: COMMIT,
  manifestPath: "release-artifacts/latest/record-manifest.json",
  manifestSha256: `sha256:${"b".repeat(64)}`,
  manifestCommitment: `0x${"c".repeat(64)}`,
  inventoryCount: 212,
  assembledAt: "2026-08-03T08:00:00.000Z",
};

const pageSources: MuseumPageSourceCatalog = [
  {
    pathname: "/museum/network/collection/6529NM.2026.001.01",
    source: {
      primaryPath:
        "records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md",
      relatedSources: [
        {
          path: "records/accessions/6529NM.2026.001/objects/6529NM.2026.001.01.json",
          label: "machineRecord",
        },
      ],
    },
  },
];

describe("MuseumSourceContribution", () => {
  beforeEach(() => {
    mockedPathname.mockReturnValue(
      "/museum/network/collection/6529NM.2026.001.01"
    );
  });

  it("links a verified page to its exact source and the maintained contribution path", () => {
    render(
      <MuseumSourceContribution
        identity={identity}
        pageSources={pageSources}
        sourceState="fresh"
      />
    );

    expect(
      screen.getByText("Published from the Museum's public record.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read the source" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md`
    );
    expect(
      screen.getByRole("link", { name: "Propose an edit" })
    ).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/6529networkmuseum/edit/main/records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md"
    );
    expect(
      screen.getByRole("link", { name: "Contributor guide" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/CONTRIBUTING.md`
    );
    const relatedSources = screen.getByText("Related works and context");
    fireEvent.click(relatedSources);
    const structuredRecord = screen.getByRole("link", {
      name: "Structured record",
    });
    expect(structuredRecord).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/records/accessions/6529NM.2026.001/objects/6529NM.2026.001.01.json`
    );
    expect(relatedSources).toBeInTheDocument();
    expect(structuredRecord).not.toHaveAttribute("title");
    expect(structuredRecord).not.toHaveAttribute("aria-label");
  });

  it("keeps the exact stale source links while presenting status in museum language", () => {
    render(
      <MuseumSourceContribution
        identity={identity}
        pageSources={pageSources}
        sourceState="stale"
      />
    );

    expect(
      screen.getByText(/latest verified public record/iu)
    ).toHaveTextContent(
      "Latest verified public record; a source refresh is in progress."
    );
    expect(
      screen.getByRole("link", { name: "Read the source" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md`
    );
  });

  it("does not make an immutable claim without a verified publication", () => {
    render(
      <MuseumSourceContribution
        identity={null}
        pageSources={[]}
        sourceState="unavailable"
      />
    );

    expect(screen.queryByText(/commit/u)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Read the source" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Propose an edit" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Contributor guide" })
    ).not.toBeInTheDocument();
  });

  it.each(["invalid", "partial"] as const)(
    "fails closed for the %s legacy source state even when an identity exists",
    (sourceState) => {
      render(
        <MuseumSourceContribution
          identity={identity}
          pageSources={pageSources}
          sourceState={sourceState}
        />
      );

      expect(
        screen.getByText(/verified Museum source is temporarily unavailable/u)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Read the source" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Propose an edit" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Structured record" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Contributor guide" })
      ).not.toBeInTheDocument();
    }
  );

  it("fails closed when the current route has no admitted source mapping", () => {
    mockedPathname.mockReturnValue("/museum/network/not-a-public-route");

    render(
      <MuseumSourceContribution
        identity={identity}
        pageSources={pageSources}
        sourceState="fresh"
      />
    );

    expect(
      screen.getByText("Published from the Museum's public record.", {
        exact: true,
      })
    ).toBeInTheDocument();
    expect(screen.queryByText(/unassigned/u)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Read the source" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Propose an edit" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contributor guide" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/CONTRIBUTING.md`
    );
  });
});
