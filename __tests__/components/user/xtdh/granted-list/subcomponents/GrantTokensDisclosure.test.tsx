import { render, screen, fireEvent } from "@testing-library/react";
import { GrantTokensDisclosure } from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/subcomponents/GrantTokensDisclosure";
import { SupportedChain } from "@/components/nft-picker/NftPicker.types";

// Mock the hook
jest.mock("@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/hooks/useGrantTokensDisclosure", () => ({
  useGrantTokensDisclosure: jest.fn(() => ({
    isOpen: false,
    panelId: "panel-id",
    toggleOpen: jest.fn(),
    disclosureState: {
      showInitialLoading: false,
      showInitialError: false,
      tokenRanges: [],
      errorMessage: "",
      onRetry: jest.fn(),
      contractAddress: null,
      chain: null,
      grantId: "grant-id",
      onEndReached: jest.fn(),
      isFetchingNextPage: false,
    }
  })),
}));

import { useGrantTokensDisclosure } from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/hooks/useGrantTokensDisclosure";

describe("GrantTokensDisclosure", () => {
  it("renders simplified text correctly when closed", () => {
    render(
      <GrantTokensDisclosure
        chain="ethereum"
        contractAddress="0x123"
        grantId="grant-1"
        tokensCount={1168}
        tokensCountLabel="1,168"
      />
    );

    expect(screen.getByText("Show 1,168 tokens")).toBeInTheDocument();
  });

  it("renders simplified text correctly when open", () => {
    (useGrantTokensDisclosure as jest.Mock).mockReturnValue({
      isOpen: true,
      panelId: "panel-id",
      toggleOpen: jest.fn(),
      disclosureState: {
        showInitialLoading: false,
        showInitialError: false,
        tokenRanges: [],
        errorMessage: "",
        onRetry: jest.fn(),
        contractAddress: null,
        chain: null,
        grantId: "grant-id",
        onEndReached: jest.fn(),
        isFetchingNextPage: false,
      }
    });

    render(
      <GrantTokensDisclosure
        chain="ethereum"
        contractAddress="0x123"
        grantId="grant-1"
        tokensCount={1168}
        tokensCountLabel="1,168"
      />
    );

    expect(screen.getByText("Hide 1,168 tokens")).toBeInTheDocument();
  });

  it("renders singular text correctly", () => {
    (useGrantTokensDisclosure as jest.Mock).mockReturnValue({
      isOpen: false,
      panelId: "panel-id",
      toggleOpen: jest.fn(),
      disclosureState: {
        showInitialLoading: false,
        showInitialError: false,
        tokenRanges: [],
        errorMessage: "",
        onRetry: jest.fn(),
        contractAddress: null,
        chain: null,
        grantId: "grant-id",
        onEndReached: jest.fn(),
        isFetchingNextPage: false,
      }
    });

    render(
      <GrantTokensDisclosure
        chain="ethereum"
        contractAddress="0x123"
        grantId="grant-1"
        tokensCount={1}
        tokensCountLabel="1"
      />
    );

    expect(screen.getByText("Show 1 token")).toBeInTheDocument();
  });
});
