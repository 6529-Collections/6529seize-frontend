import { fireEvent, render, screen } from "@testing-library/react";

import {
  SolidityGlobalDeclarationExplorer,
  type SolidityGlobalDeclarationListItem,
} from "@/components/public-review/SolidityGlobalDeclarationExplorer";

const ITEMS: readonly SolidityGlobalDeclarationListItem[] = [
  {
    definitionName: "StreamCore",
    href: "/reviews/6529-stream/reference/definitions/core/functions/mint",
    key: "mint",
    kind: "function",
    name: "mint",
    scope: "protocol",
    selectorOrTopic: "0x40c10f19",
    signature: "mint(address,uint256)",
    sourcePath: "src/StreamCore.sol",
    syntheticGetter: false,
    topLevel: false,
  },
  {
    definitionName: "StreamCore",
    href: "/reviews/6529-stream/reference/definitions/core/events/minted",
    key: "minted",
    kind: "event",
    name: "Minted",
    scope: "protocol",
    selectorOrTopic: `0x${"1".repeat(64)}`,
    signature: "Minted(address,uint256)",
    sourcePath: "src/StreamCore.sol",
    syntheticGetter: false,
    topLevel: false,
  },
  {
    href: "/reviews/6529-stream/reference/declarations/invalid-proof",
    key: "invalid-proof",
    kind: "error",
    name: "InvalidProof",
    scope: "protocol",
    selectorOrTopic: "0x09bde339",
    signature: "InvalidProof(bytes32)",
    sourcePath: "src/Proofs.sol",
    syntheticGetter: false,
    topLevel: true,
  },
];

describe("SolidityGlobalDeclarationExplorer", () => {
  it("searches selectors and filters declaration kind and location", () => {
    render(<SolidityGlobalDeclarationExplorer items={ITEMS} />);

    fireEvent.change(
      screen.getByLabelText("Search functions, events, and errors"),
      { target: { value: "09bde339" } }
    );
    expect(
      screen.getByRole("link", { name: /InvalidProof\(bytes32\)/ })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/reference/declarations/invalid-proof"
    );
    expect(
      screen.queryByRole("link", { name: /mint\(address,uint256\)/ })
    ).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Search functions, events, and errors"),
      { target: { value: "" } }
    );
    fireEvent.change(screen.getByLabelText("Declaration kind"), {
      target: { value: "event" },
    });
    expect(
      screen.getByRole("link", { name: /Minted\(address,uint256\)/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /InvalidProof\(bytes32\)/ })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Declaration kind"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Declaration location"), {
      target: { value: "file-scope" },
    });
    expect(
      screen.getByRole("link", { name: /InvalidProof\(bytes32\)/ })
    ).toBeInTheDocument();
    expect(screen.getByText("1 of 1 declarations")).toBeInTheDocument();
  });
});
