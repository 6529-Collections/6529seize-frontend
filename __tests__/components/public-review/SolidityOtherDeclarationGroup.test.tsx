import { SolidityOtherDeclarationGroup } from "@/components/public-review/SolidityOtherDeclarationGroup";
import { render, screen } from "@testing-library/react";

const RANGE = {
  byteLength: 42,
  byteStart: 10,
  githubUrl:
    "https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/src/Example.sol#L2-L4",
  lineEnd: 4,
  lineStart: 2,
  snippetSha256: `sha256:${"b".repeat(64)}`,
  sourceSha256: `sha256:${"a".repeat(64)}`,
} as const;

describe("SolidityOtherDeclarationGroup", () => {
  it("renders member types and state-variable properties", () => {
    render(
      <SolidityOtherDeclarationGroup
        label="Local declarations"
        declarations={[
          {
            name: "AuctionState",
            natspec: "State retained for the current auction.",
            range: RANGE,
            members: [
              { index: 0, name: "bidder", type: "address" },
              { index: 1, name: "amount", type: "uint256" },
            ],
          },
          {
            name: "MAX_BPS",
            natspec: "",
            range: { ...RANGE, byteStart: 70 },
            constant: true,
            type: "uint256",
            visibility: "internal",
          },
        ]}
      />
    );

    expect(screen.getByText("AuctionState")).toBeInTheDocument();
    expect(screen.getByText("bidder")).toBeInTheDocument();
    expect(screen.getByText("address")).toBeInTheDocument();
    expect(screen.getByText("Type: uint256")).toBeInTheDocument();
    expect(screen.getByText("Visibility: internal")).toBeInTheDocument();
    expect(screen.getByText("Constant")).toBeInTheDocument();
    expect(
      screen.getByText("No NatSpec was present at this source declaration.")
    ).toBeInTheDocument();
  });
});
