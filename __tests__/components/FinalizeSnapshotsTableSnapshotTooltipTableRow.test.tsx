import { render, screen } from "@testing-library/react";
import FinalizeSnapshotsTableSnapshotTooltipTableRow from "@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltipTableRow";

describe("FinalizeSnapshotsTableSnapshotTooltipTableRow", () => {
  it("displays provided name and value", () => {
    render(
      <FinalizeSnapshotsTableSnapshotTooltipTableRow
        name="Address"
        value="0xabc"
      />
    );
    expect(screen.getByText("Address:")).toBeInTheDocument();
    expect(screen.getByText("0xabc")).toBeInTheDocument();
  });

  it("handles long values gracefully", () => {
    const long = "x".repeat(50);
    render(
      <FinalizeSnapshotsTableSnapshotTooltipTableRow name="Long" value={long} />
    );

    const value = screen.getByText(long);
    const label = screen.getByText("Long:");
    const row = value.parentElement;

    expect(value).toBeInTheDocument();
    expect(row).toHaveClass("tw-flex");
    expect(row).not.toHaveClass("tw-inline-flex");
    expect(label).toHaveClass(
      "tw-w-48",
      "tw-flex-none",
      "tw-whitespace-nowrap"
    );
    expect(value).toHaveClass(
      "tw-min-w-0",
      "tw-flex-1",
      "tw-break-words",
      "tw-[overflow-wrap:anywhere]"
    );
  });
});
