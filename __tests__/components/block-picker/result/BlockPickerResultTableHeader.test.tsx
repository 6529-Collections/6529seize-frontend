import { render, screen } from "@testing-library/react";
import BlockPickerResultTableHeader from "@/components/block-picker/result/BlockPickerResultTableHeader";

describe("BlockPickerResultTableHeader", () => {
  it("renders three column headers", () => {
    render(
      <table>
        <BlockPickerResultTableHeader />
      </table>
    );
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveTextContent("Block includes");
    expect(headers[1]).toHaveTextContent("Count");
    expect(headers[2]).toHaveTextContent("Blocks");
    expect(headers[3]).toHaveTextContent("");
  });
});
