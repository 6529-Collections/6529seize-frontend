import { render, screen } from "@testing-library/react";
import { MuseumSourceContribution } from "@/components/museum/MuseumSourceContribution";
import type { MuseumPublicationIdentity } from "@/lib/museum/publication";

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

describe("MuseumSourceContribution", () => {
  it("links a verified page to its exact source and the maintained contribution path", () => {
    render(
      <MuseumSourceContribution identity={identity} sourceState="fresh" />
    );

    expect(screen.getByText(/source commit aaaaaaaaaaaa/u)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Inspect exact source" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/tree/${COMMIT}`
    );
    expect(
      screen.getByRole("link", { name: "Guide at this commit" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${COMMIT}/CONTRIBUTING.md`
    );
    expect(
      screen.getByRole("link", { name: "How to contribute" })
    ).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/6529networkmuseum/blob/main/CONTRIBUTING.md"
    );
  });

  it("keeps the exact stale commit visible", () => {
    render(
      <MuseumSourceContribution identity={identity} sourceState="stale" />
    );

    expect(
      screen.getByText(/last verified public Museum source/u)
    ).toHaveTextContent("aaaaaaaaaaaa");
  });

  it("does not make an immutable claim without a verified publication", () => {
    render(
      <MuseumSourceContribution identity={null} sourceState="unavailable" />
    );

    expect(screen.queryByText(/commit/u)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Inspect exact source" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Guide at this commit" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "How to contribute" })
    ).toBeInTheDocument();
  });
});
