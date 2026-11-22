import ManifoldMintingSubscriptionNote from "@/components/manifold-minting/ManifoldMintingSubscriptionNote";
import { useAuth } from "@/components/auth/Auth";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

const CONTRACT = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const AIRDROP_ADDRESS = "0x975c8b41b9b89c0a62a332e14819c185ae51b911";
const PROFILE_KEY = `${AIRDROP_ADDRESS}-0x8b8e2571ebc7ed75dd89509881f725b76e01e1c9`;

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  getStructuredApiErrorStatus: (error: unknown) =>
    (error as { status?: number } | null)?.status,
}));

const useAuthMock = useAuth as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

function finalSubscription(
  overrides: Partial<NFTFinalSubscription> = {}
): NFTFinalSubscription {
  return {
    consolidation_key: PROFILE_KEY,
    contract: CONTRACT,
    token_id: 575,
    subscribed_count: 1,
    airdrop_address: AIRDROP_ADDRESS,
    balance: 0,
    phase: "Phase 1",
    redeemed_count: 0,
    ...overrides,
  };
}

function renderNote(memePhaseId: string | undefined, tokenId = 575) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ManifoldMintingSubscriptionNote
        contract={CONTRACT}
        tokenId={tokenId}
        memePhaseId={memePhaseId}
      />
    </QueryClientProvider>
  );
}

describe("ManifoldMintingSubscriptionNote", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      connectedProfile: { consolidation_key: PROFILE_KEY, wallets: [] },
      activeProfileProxy: null,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("explains that the current phase is covered by a pending subscription airdrop", async () => {
    commonApiFetchMock.mockResolvedValue(finalSubscription());

    renderNote("1");

    expect(
      await screen.findByText(
        "Phase 1: your subscription covers 1 card. It will be airdropped to 0x975c...b911, so you do not need to mint it here."
      )
    ).toBeInTheDocument();
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: `subscriptions/consolidation/final/${PROFILE_KEY}/${CONTRACT}/575`,
      })
    );
  });

  it("uses plural copy for several subscribed cards", async () => {
    commonApiFetchMock.mockResolvedValue(
      finalSubscription({ subscribed_count: 3, phase: "Phase 2" })
    );

    renderNote("2");

    expect(
      await screen.findByText(
        "Phase 2: your subscription covers 3 cards. They will be airdropped to 0x975c...b911, so you do not need to mint them here."
      )
    ).toBeInTheDocument();
  });

  it("says the card has been airdropped once the subscription is redeemed", async () => {
    commonApiFetchMock.mockResolvedValue(
      finalSubscription({ redeemed_count: 1 })
    );

    renderNote("1");

    expect(
      await screen.findByText(
        "Phase 1: your subscription card has been airdropped to 0x975c...b911."
      )
    ).toBeInTheDocument();
  });

  it("matches the public phase", async () => {
    commonApiFetchMock.mockResolvedValue(
      finalSubscription({ phase: "Public" })
    );

    renderNote("public");

    expect(await screen.findByText(/^Public phase:/)).toBeInTheDocument();
  });

  it("stays hidden when the subscription belongs to another phase", async () => {
    commonApiFetchMock.mockResolvedValue(
      finalSubscription({ phase: "Phase 0" })
    );

    const { container } = renderNote("1");

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden when the subscription has no phase yet", async () => {
    commonApiFetchMock.mockResolvedValue(finalSubscription({ phase: null }));

    const { container } = renderNote("1");

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden when the profile has no final subscription", async () => {
    commonApiFetchMock.mockRejectedValue({ status: 404 });

    const { container } = renderNote("1");

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("does not query for a proxy session or an unknown phase", () => {
    useAuthMock.mockReturnValue({
      connectedProfile: { consolidation_key: PROFILE_KEY, wallets: [] },
      activeProfileProxy: { id: "proxy" },
    });
    const proxy = renderNote("1");
    expect(proxy.container).toBeEmptyDOMElement();
    proxy.unmount();

    useAuthMock.mockReturnValue({
      connectedProfile: { consolidation_key: PROFILE_KEY, wallets: [] },
      activeProfileProxy: null,
    });
    const unknownPhase = renderNote("unscheduled");
    expect(unknownPhase.container).toBeEmptyDOMElement();

    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });
});
