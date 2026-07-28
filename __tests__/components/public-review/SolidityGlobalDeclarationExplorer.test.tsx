import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";

import { SolidityGlobalDeclarationExplorer } from "@/components/public-review/SolidityGlobalDeclarationExplorer";
import type { SolidityGlobalDeclarationListItem } from "@/lib/public-review/solidityDeclarationSearchTypes";
import { fetchSolidityDeclarations } from "@/services/api/public-review/declarations";

type FetchSolidityDeclarationsInput = Parameters<
  typeof fetchSolidityDeclarations
>[0];

jest.mock("@/services/api/public-review/declarations", () => ({
  fetchSolidityDeclarations: jest.fn(),
  getSolidityDeclarationsQueryKey: (input: object) => [
    "PUBLIC_REVIEW_DECLARATIONS",
    input,
  ],
}));

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

const mockFetchSolidityDeclarations =
  fetchSolidityDeclarations as jest.MockedFunction<
    typeof fetchSolidityDeclarations
  >;

function TestQueryProvider({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderExplorer() {
  return render(
    <SolidityGlobalDeclarationExplorer
      linkMode="active"
      reviewId="6529-stream"
      scopes={["protocol"]}
      sourceCommit="513bd7e079eafe109df6ae1ae21bfbca6fec6786"
      version="2026-07-26.1"
    />,
    { wrapper: TestQueryProvider }
  );
}

describe("SolidityGlobalDeclarationExplorer", () => {
  beforeEach(() => {
    mockFetchSolidityDeclarations.mockImplementation(
      async (input: FetchSolidityDeclarationsInput) => {
        const normalizedQuery = input.query.toLowerCase();
        const matching = ITEMS.filter(
          (item) =>
            (!normalizedQuery ||
              [
                item.name,
                item.signature,
                item.selectorOrTopic,
                item.sourcePath,
                item.definitionName ?? "",
              ].some((value) =>
                value.toLowerCase().includes(normalizedQuery)
              )) &&
            (!input.kind || item.kind === input.kind) &&
            (!input.scope || item.scope === input.scope) &&
            (!input.location ||
              (input.location === "file-scope"
                ? item.topLevel
                : !item.topLevel))
        );
        const items = matching.slice(input.offset, input.offset + input.limit);
        return {
          items,
          nextOffset:
            input.offset + items.length < matching.length
              ? input.offset + items.length
              : null,
          reviewId: input.reviewId,
          sourceCommit: input.sourceCommit,
          total: matching.length,
          version: input.version,
        };
      }
    );
  });

  it("searches the full server index and filters kind and location", async () => {
    renderExplorer();

    expect(
      await screen.findByRole("link", {
        name: /mint\(address,uint256\)/,
      })
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByLabelText("Search functions, events, and errors"),
      { target: { value: "09bde339" } }
    );
    expect(await screen.findByText("1 of 1 declarations")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /InvalidProof\(bytes32\)/ })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/reference/declarations/invalid-proof"
    );

    fireEvent.change(
      screen.getByLabelText("Search functions, events, and errors"),
      { target: { value: "" } }
    );
    fireEvent.change(screen.getByLabelText("Declaration kind"), {
      target: { value: "event" },
    });
    expect(
      await screen.findByRole("link", { name: /Minted\(address,uint256\)/ })
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
      await screen.findByRole("link", { name: /InvalidProof\(bytes32\)/ })
    ).toBeInTheDocument();
    expect(screen.getByText("1 of 1 declarations")).toBeInTheDocument();
  });

  it("shows a recoverable error when the declaration endpoint fails", async () => {
    mockFetchSolidityDeclarations.mockRejectedValueOnce(
      new Error("network unavailable")
    );
    renderExplorer();

    expect(
      await screen.findByText(
        "The declaration index could not be loaded. Try again."
      )
    ).toBeInTheDocument();
    mockFetchSolidityDeclarations.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(mockFetchSolidityDeclarations).toHaveBeenCalledTimes(1)
    );
  });
});
