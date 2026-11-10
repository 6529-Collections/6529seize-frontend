import RecipientSelector from "@/components/common/RecipientSelector";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

const alice = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
const aliceChecksummed = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const other = "0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359";

const aliceResult = {
  profile_id: "alice",
  handle: "alice",
  wallet: alice,
  primary_wallet: alice,
  display: "alice.eth",
  level: 3,
  tdh: 10,
} as CommunityMemberMinimal;

const mockEnsAddress = jest.fn();

jest.mock("wagmi", () => ({
  useEnsAddress: (parameters: { name?: string; chainId: number }) =>
    mockEnsAddress(parameters),
}));
jest.mock("@/hooks/useDebouncedValue", () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/server.helpers", () => ({ getUserProfile: jest.fn() }));
jest.mock("@/components/nft-transfer/TransferModalPfp", () => () => null);

function Harness({
  onProfile,
  onWallet,
}: {
  readonly onProfile: jest.Mock;
  readonly onWallet: jest.Mock;
}) {
  const [profile, setProfile] = useState<CommunityMemberMinimal | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  return (
    <RecipientSelector
      open
      selectedProfile={profile}
      selectedWallet={wallet}
      onProfileSelect={(next) => {
        onProfile(next);
        setProfile(next);
      }}
      onWalletSelect={(next) => {
        onWallet(next);
        setWallet(next);
      }}
    />
  );
}

async function search(value: string) {
  const onProfile = jest.fn();
  const onWallet = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <Harness onProfile={onProfile} onWallet={onWallet} />
    </QueryClientProvider>
  );
  await act(async () => {
    fireEvent.change(screen.getByRole("textbox", { name: "Recipient" }), {
      target: { value },
    });
  });
  await screen.findAllByText(/alice/);
  return { onProfile, onWallet };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(commonApiFetch).mockResolvedValue([aliceResult]);
  jest.mocked(useIdentity).mockImplementation(({ handleOrWallet }) => ({
    profile: handleOrWallet
      ? ({
          id: "alice",
          wallets: [
            { wallet: other, display: "alice.eth", tdh: 0 },
            { wallet: alice, display: "alice-vault", tdh: 0 },
          ],
        } as unknown as ApiIdentity)
      : null,
    isLoading: false,
  }));
});

it("auto-selects an ENS result only when the name resolves to its wallet", async () => {
  mockEnsAddress.mockReturnValue({
    data: aliceChecksummed,
    isLoading: false,
    isError: false,
  });
  const { onProfile, onWallet } = await search("Alice.eth");

  expect(mockEnsAddress).toHaveBeenCalledWith({
    name: "alice.eth",
    chainId: 1,
  });
  expect(onProfile).toHaveBeenCalledWith(aliceResult);
  // The resolved wallet is chosen, not the wallet whose label matches.
  expect(onWallet).toHaveBeenLastCalledWith(alice);
  expect(onWallet).not.toHaveBeenCalledWith(other);
});

it.each([
  ["resolves elsewhere", { data: other, isLoading: false, isError: false }],
  ["does not resolve", { data: null, isLoading: false, isError: false }],
  ["lookup fails", { data: undefined, isLoading: false, isError: true }],
])(
  "does not auto-select when the name %s, and shows full addresses",
  async (_label, ensState) => {
    mockEnsAddress.mockReturnValue(ensState);
    const { onProfile, onWallet } = await search("alice.eth");

    expect(onProfile).not.toHaveBeenCalled();
    expect(onWallet).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "alice.eth does not resolve on Ethereum to a result below."
    );
    expect(screen.getByText(aliceChecksummed)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /alice/ }));
    expect(onProfile).toHaveBeenCalledWith(aliceResult);
  }
);

it("waits for the lookup before selecting anything", async () => {
  mockEnsAddress.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
  });
  const { onProfile } = await search("alice.eth");

  expect(onProfile).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("keeps exact address search auto-selection unchanged", async () => {
  mockEnsAddress.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  });
  const { onProfile, onWallet } = await search(alice);

  expect(mockEnsAddress).toHaveBeenLastCalledWith({
    name: undefined,
    chainId: 1,
  });
  expect(onProfile).toHaveBeenCalledWith(aliceResult);
  expect(onWallet).toHaveBeenLastCalledWith(alice);
});

it("keeps handle search as an explicit pick", async () => {
  mockEnsAddress.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  });
  const { onProfile } = await search("alice");

  expect(onProfile).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByText(aliceChecksummed)).not.toBeInTheDocument();
});
