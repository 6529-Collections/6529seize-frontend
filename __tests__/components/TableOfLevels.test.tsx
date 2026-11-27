import { render, screen, within } from "@testing-library/react";
import TableOfLevels from "@/components/levels/TableOfLevels";

describe("TableOfLevels", () => {
  // Mock toLocaleString to ensure consistent behavior across different locales
  beforeEach(() => {
    const originalToLocaleString = Number.prototype.toLocaleString;
    jest.spyOn(Number.prototype, "toLocaleString").mockImplementation(function (
      this: number,
      locales?: string | string[],
      options?: Intl.NumberFormatOptions
    ) {
      return originalToLocaleString.call(this, "en-US", options);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("renders a row for each level with the correct values", () => {
    render(<TableOfLevels />);
    const scrollRegion = screen.getByRole("region", {
      name: "Level and TDH + Rep thresholds",
    });
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(scrollRegion).toHaveAttribute("tabindex", "0");
    expect(within(table).getAllByRole("columnheader")[0]).toHaveClass(
      "tw-sticky",
      "tw-top-0"
    );
    // header row + one row per level, from 0 through 200
    expect(rows).toHaveLength(202);

    // check the first row, levels 100 and 101, and the last row
    const firstRowCells = within(rows[1]).getAllByRole("cell");
    expect(firstRowCells[0]).toHaveTextContent("0");
    expect(firstRowCells[1]).toHaveTextContent("0");

    const levelRow = (level: number) =>
      within(rows[level + 1]!)
        .getAllByRole("cell")
        .map((cell) => cell.textContent);
    expect(levelRow(100)).toEqual(["100", "25,000,000"]);
    expect(levelRow(101)).toEqual(["101", "26,000,000"]);
    expect(levelRow(200)).toEqual(["200", "1,262,623,144"]);
  });
});
