import { render, screen } from "@testing-library/react";
import { MuseumRelatedEntities } from "@/components/museum/MuseumRelatedEntities";

describe("MuseumRelatedEntities relation context", () => {
  it("renders human status and date for Casey, Keys and Gates, and Magnum relations", () => {
    const { container } = render(
      <MuseumRelatedEntities
        entities={[
          {
            kind: "curated_acquisition",
            id: "6529NM-CA-2026-001",
            label: "The System in Seven States",
            href: "/museum/network/acquisitions/the-system-in-seven-states",
            relation: "Acquired through",
            status: "accessioned_into_permanent_collection",
            statusAsOf: "2026-01-01",
          },
          {
            kind: "curated_acquisition",
            id: "6529NM-CA-2026-002",
            label: "Keys and Gates",
            href: "/museum/network/acquisitions/keys-and-gates",
            relation: "Included in",
            status: "selected_through_acquisition_program_acquisition_pending",
            statusAsOf: "2026-02-01",
          },
          {
            kind: "curated_acquisition",
            id: "6529NM-CA-2026-003",
            label: "Magnum Photos 75",
            href: "/museum/network/acquisitions/magnum-photos-75",
            relation: "Included in",
            status: "accessioned_into_permanent_collection",
            statusAsOf: "2026-03-01",
          },
        ]}
        headingId="related-acquisitions"
        title="Acquisitions connected to this artist"
      />
    );

    expect(screen.getByText("Acquired through")).toBeInTheDocument();
    expect(screen.getAllByText("Included in")).toHaveLength(2);
    expect(
      screen.getAllByText("Accessioned into the permanent Collection")
    ).toHaveLength(2);
    expect(
      screen.getByText("Selected through an acquisition program; unminted")
    ).toBeInTheDocument();
    expect(screen.getByText("Jan 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Feb 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Mar 1, 2026")).toBeInTheDocument();
    expect(
      screen.queryByText(/selected_(?:by|through)/u)
    ).not.toBeInTheDocument();
    const list = container.querySelector("ul");
    expect(list).toHaveClass("tw-grid", "tw-gap-y-10");
    expect(list).not.toHaveClass("tw-border-y", "tw-divide-y");
    for (const item of screen.getAllByRole("listitem")) {
      expect(item).toHaveClass("tw-border-b", "tw-pb-5");
    }
  });
});
