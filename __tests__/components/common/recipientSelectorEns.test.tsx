import { useRecipientEnsMatch } from "@/components/common/recipientSelectorEns";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// The real useIdentity runs here; only the network layer is stubbed so a
// lookup that should be skipped would be visible as a call.
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const alice = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
const bob = "0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359";
const stranger = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

function member(handle: string, wallet: string): CommunityMemberMinimal {
  return {
    profile_id: handle,
    handle,
    normalised_handle: handle,
    primary_wallet: wallet,
    display: null,
    tdh: 0,
    level: 0,
    cic_rating: 0,
    wallet,
    pfp: null,
  };
}

function wrapper({ children }: { readonly children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  jest.clearAllMocks();
});

it("reports a skipped identity lookup as not loading", () => {
  const { result } = renderHook(
    () => useIdentity({ handleOrWallet: "", initialProfile: null }),
    { wrapper }
  );

  expect(result.current).toEqual({ profile: null, isLoading: false });
});

it("does not wait on a skipped lookup before saying the name resolves elsewhere", () => {
  const results = [member("alice", alice), member("bob", bob)];
  const { result } = renderHook(
    () =>
      useRecipientEnsMatch({
        ensLookupName: "alice.eth",
        verifiedEnsAddress: stranger,
        isEnsLookupPending: false,
        hasLookupError: false,
        data: results,
        results,
      }),
    { wrapper }
  );

  expect(result.current).toEqual({
    isVerifiedEnsMatch: false,
    ensNote: {
      kind: "resolvesElsewhere",
      name: "alice.eth",
      address: stranger,
    },
  });
  expect(commonApiFetch).not.toHaveBeenCalled();
});

it("matches the single result's own wallet without an identity lookup", () => {
  const results = [member("alice", alice)];
  const { result } = renderHook(
    () =>
      useRecipientEnsMatch({
        ensLookupName: "alice.eth",
        verifiedEnsAddress: alice,
        isEnsLookupPending: false,
        hasLookupError: false,
        data: results,
        results,
      }),
    { wrapper }
  );

  expect(result.current).toEqual({ isVerifiedEnsMatch: true, ensNote: null });
  expect(commonApiFetch).not.toHaveBeenCalled();
});
