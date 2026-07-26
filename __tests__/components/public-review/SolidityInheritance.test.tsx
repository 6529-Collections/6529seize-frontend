import { SolidityInheritance } from "@/components/public-review/SolidityInheritance";
import type {
  SolidityDefinitionShard,
  SolidityReferenceManifest,
} from "@/lib/public-review/solidityReferenceTypes";
import { render, screen } from "@testing-library/react";

describe("SolidityInheritance", () => {
  it("preserves the compiler's exact linearized definition order", () => {
    const shard = {
      definition: {
        inheritance: [
          { definitionId: "src/Base.sol:Base", name: "Base" },
        ],
        linearizedDefinitionIds: [
          "src/Child.sol:Child",
          "src/Base.sol:Base",
        ],
      },
    } as unknown as SolidityDefinitionShard;
    const manifest = {
      definitionIndex: [
        { id: "src/Child.sol:Child", key: "child", name: "Child" },
        { id: "src/Base.sol:Base", key: "base", name: "Base" },
      ],
    } as unknown as SolidityReferenceManifest;

    render(
      <SolidityInheritance
        hrefContext={{ reviewSlug: "6529-stream" }}
        manifest={manifest}
        shard={shard}
      />
    );

    const orderedItems = screen
      .getByText("Compiler linearization order")
      .closest("details")
      ?.querySelectorAll("ol > li");
    expect(orderedItems).toHaveLength(2);
    expect(orderedItems?.[0]).toHaveTextContent("Child");
    expect(orderedItems?.[1]).toHaveTextContent("Base");
    for (const link of screen.getAllByRole("link", { name: "Base" })) {
      expect(link).toHaveAttribute(
        "href",
        "/reviews/6529-stream/reference/definitions/base"
      );
    }
  });
});
