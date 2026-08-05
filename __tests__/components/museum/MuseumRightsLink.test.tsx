import { render, screen } from "@testing-library/react";
import { MuseumRightsLink } from "@/components/museum/MuseumRightsLink";

describe("MuseumRightsLink", () => {
  it("uses onsite navigation for a complete Museum rights-entry path", () => {
    render(
      <MuseumRightsLink
        label="Licensed CC BY-NC 4.0."
        href="/museum/network/rights/cc-by-nc-4.0"
        className="credit"
      />
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/museum/network/rights/cc-by-nc-4.0"
    );
    expect(screen.getByRole("link")).not.toHaveAttribute("target");
  });

  it("renders malformed Museum rights paths as unlinked text", () => {
    render(
      <MuseumRightsLink
        label="Unresolved rights"
        href="/museum/network/rights/"
        className="credit"
      />
    );

    expect(screen.getByText("Unresolved rights")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("retains license semantics for an external term", () => {
    render(
      <MuseumRightsLink
        label="Official term"
        href="https://creativecommons.org/licenses/by/4.0/"
        className="credit"
      />
    );

    expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link")).toHaveAttribute(
      "rel",
      "license noopener noreferrer"
    );
  });
});
