import { SolidityWarnings } from "@/components/public-review/SolidityWarnings";
import { render, screen } from "@testing-library/react";

describe("SolidityWarnings", () => {
  it("renders category, code, severity, and declaration identity", () => {
    render(
      <SolidityWarnings
        summary={{
          byCategory: { documentation: 1 },
          byCode: { MISSING_NATSPEC: 1 },
          totalCount: 1,
        }}
        warnings={[
          {
            category: "documentation",
            code: "MISSING_NATSPEC",
            declarationId: "src/Example.sol:Example#function:mint(address)",
            definitionId: "src/Example.sol:Example",
            severity: "advisory",
          },
        ]}
      />
    );

    expect(screen.getAllByText("documentation")).toHaveLength(2);
    expect(screen.getByText("MISSING_NATSPEC")).toBeInTheDocument();
    expect(screen.getByText("advisory")).toBeInTheDocument();
    expect(
      screen.getByText("src/Example.sol:Example#function:mint(address)")
    ).toBeInTheDocument();
  });
});
