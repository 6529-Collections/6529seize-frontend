import { SolidityFileScopeDeclarations } from "@/components/public-review/SolidityFileScopeDeclarations";
import { render, screen } from "@testing-library/react";

const RANGE = {
  byteLength: 32,
  byteStart: 40,
  githubUrl:
    "https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/src/Example.sol#L3-L5",
  lineEnd: 5,
  lineStart: 3,
  snippetSha256: `sha256:${"b".repeat(64)}`,
  sourceSha256: `sha256:${"a".repeat(64)}`,
} as const;

describe("SolidityFileScopeDeclarations", () => {
  it("renders first-class members, signatures, and initializer evidence", () => {
    render(
      <SolidityFileScopeDeclarations
        declarations={[
          {
            id: "src/Example.sol#top-level:struct:Bid",
            key: "c3RydWN0",
            kind: "struct",
            nodeType: "StructDefinition",
            name: "Bid",
            canonicalName: "Bid",
            visibility: null,
            members: [
              { index: 0, name: "bidder", type: "address" },
              { index: 1, name: "amount", type: "uint256" },
            ],
            natspec: "One auction bid.",
            range: RANGE,
          },
          {
            id: "src/Example.sol#top-level:variable:MAX_BPS",
            key: "dmFyaWFibGU",
            kind: "variable",
            nodeType: "VariableDeclaration",
            name: "MAX_BPS",
            type: "uint256",
            typeString: "uint256",
            visibility: "internal",
            constant: true,
            immutable: false,
            storageLocation: null,
            valueRange: RANGE,
            valueSource: "10_000",
            natspec: "",
            range: { ...RANGE, byteStart: 90 },
          },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Bid" })
    ).toBeInTheDocument();
    expect(screen.getByText("bidder")).toBeInTheDocument();
    expect(screen.getByText("One auction bid.")).toBeInTheDocument();
    expect(screen.getByText("MAX_BPS")).toBeInTheDocument();
    expect(screen.getByText("10_000")).toBeInTheDocument();
    expect(
      screen.getByText("src/Example.sol#top-level:struct:Bid")
    ).toBeInTheDocument();
  });
});
