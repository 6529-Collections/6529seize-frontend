import { fireEvent, render, screen } from "@testing-library/react";

import {
  SolidityDefinitionExplorer,
  type SolidityDefinitionListItem,
} from "@/components/public-review/SolidityDefinitionExplorer";

function makeItem(index: number): SolidityDefinitionListItem {
  return {
    classification: "release",
    errorCount: 0,
    eventCount: 0,
    functionCount: 1,
    href: `/reviews/reference/definitions/contract-${index}`,
    key: `contract-${index}`,
    kind: "contract",
    name: `Contract ${index}`,
    scope: "src",
    sourcePath: `src/Contract${index}.sol`,
    tracked: true,
    warningCount: 0,
  };
}

describe("SolidityDefinitionExplorer", () => {
  it("progressively reveals a large definition inventory", () => {
    render(
      <SolidityDefinitionExplorer
        items={Array.from({ length: 52 }, (_, index) => makeItem(index + 1))}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "50 of 52 definitions"
    );
    expect(screen.queryByRole("link", { name: "Open Contract 51" })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Show more definitions" })
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "52 of 52 definitions"
    );
    expect(
      screen.getByRole("link", { name: "Open Contract 51" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show more definitions" })
    ).toBeNull();
  });
});
