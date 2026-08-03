import { render, screen } from "@testing-library/react";
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

    expect(screen.getByText(/source commit aaaaaaaaaaaa/u)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View primary source" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md`
    );
    expect(
      screen.getByRole("link", { name: "Suggest an improvement" })
    ).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/6529networkmuseum/edit/main/records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md"
    );
    expect(
      screen.getByRole("link", { name: "Contribution guide" })
    ).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/6529networkmuseum/blob/main/CONTRIBUTING.md"
    );
    expect(
      screen.getByRole("link", {
        name: /Machine record: exact source.*objects\/6529NM\.2026\.001\.01\.json/u,
      })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/records/accessions/6529NM.2026.001/objects/6529NM.2026.001.01.json`
    );
    expect(screen.getByText("Related sources")).toBeInTheDocument();
    expect(screen.getByText("Machine record")).toHaveAttribute(
      "title",
      "records/accessions/6529NM.2026.001/objects/6529NM.2026.001.01.json"
    );
  });

  it("keeps the exact stale commit visible", () => {
    render(
      <MuseumSourceContribution
        identity={identity}
        pageSources={pageSources}
        sourceState="stale"
      />
    );

    expect(
      screen.getByText(/last verified public Museum source/u)
    ).toHaveTextContent("aaaaaaaaaaaa");
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
      screen.queryByRole("link", { name: "View primary source" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Suggest an improvement" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contribution guide" })
    ).toBeInTheDocument();
  });

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
      screen.getByText(/no exact page-source mapping/u)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View primary source" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Suggest an improvement" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contribution guide" })
    ).toBeInTheDocument();
  });
});
