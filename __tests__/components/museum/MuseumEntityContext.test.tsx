import { render, screen } from "@testing-library/react";
import { MuseumEntityContext } from "@/components/museum/MuseumEntityContext";
import type { MuseumEntityContextModel } from "@/lib/museum/publication/ia";

const context: MuseumEntityContextModel = {
  kind: "work",
  id: "6529NM-W-0001",
  label: "Selected work",
  canonicalHref: "/museum/network/works/6529NM-W-0001",
  breadcrumbs: [],
  status: "selected_through_acquisition_program_acquisition_pending",
  statusAsOf: "2026-08-09T12:00:00Z",
  statusTone: "warning",
  primaryRelations: [],
  secondaryRelations: [],
  sourcePath: "records/entities/6529NM-W-0001.json",
  sourceCommit: "a".repeat(40),
};

describe("MuseumEntityContext", () => {
  it("humanizes status enums, localizes dates, and uses one source action", () => {
    render(
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: "Museum context",
          status: "Status",
          statusAsOf: "Status as of",
          source: "Institutional record",
        }}
      />
    );

    expect(
      screen.getByText("Selected through an acquisition program; unminted")
    ).toBeInTheDocument();
    expect(screen.getByText("Aug 9, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open source record" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/`)
    );
    expect(
      screen.queryByText(
        "selected_through_acquisition_program_acquisition_pending"
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Institutional record")).not.toBeInTheDocument();
  });
});
