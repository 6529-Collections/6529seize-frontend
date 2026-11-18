import { AuthContext } from "@/components/auth/Auth";
import ReactQueryWrapper, {
  QueryKey,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useRepRatingSave } from "@/components/user/rep/modify-rep/useRepRatingSave";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiPost } from "@/services/api/common-api";
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { useContext, type ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));

it.each([false, true])(
  "refreshes shared data once after a batch, including partial failure (%s)",
  async (failSecond) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const owner = {
      id: "owner",
      handle: "owner",
      query: "owner",
      wallets: [],
    } as unknown as ApiIdentity;
    const reads = { allowance: 0, contributors: 0, overview: 0 };
    const tracked = [
      {
        name: "allowance" as const,
        key: [
          QueryKey.PROFILE_REP_RATINGS,
          { handleOrWallet: "alice", rater: "owner" },
        ],
      },
      {
        name: "contributors" as const,
        key: [
          QueryKey.PROFILE_REP_CATEGORY_CONTRIBUTORS,
          { identity: "owner", direction: "given", category: "Artist" },
        ],
      },
      {
        name: "overview" as const,
        key: [
          QueryKey.REP_OVERVIEW,
          { handleOrWallet: "owner", direction: "outgoing" },
        ],
      },
    ].map(({ name, key }) => {
      client.setQueryData(key, {});
      const observer = new QueryObserver(client, {
        queryKey: key,
        staleTime: Infinity,
        queryFn: async () => {
          reads[name] += 1;
          return {};
        },
      });
      return observer.subscribe(() => {});
    });
    const receivedKeys = ["alice", "bob"].map((identity) => [
      QueryKey.PROFILE_RATING_LIST,
      { identity, matter: "REP", direction: "received" },
    ]);
    receivedKeys.forEach((key) => client.setQueryData(key, {}));
    function Wrapper({ children }: { readonly children: ReactNode }) {
      const auth = useContext(AuthContext);
      return (
        <QueryClientProvider client={client}>
          <AuthContext
            value={{
              ...auth,
              connectedProfile: owner,
              activeProfileProxy: null,
              requestAuth: async () => ({ success: true }),
              setToast: jest.fn(),
            }}
          >
            <ReactQueryWrapper>{children}</ReactQueryWrapper>
          </AuthContext>
        </QueryClientProvider>
      );
    }
    const hook = renderHook(useRepRatingSave, { wrapper: Wrapper });
    const writes: string[] = [];
    jest.mocked(commonApiPost).mockImplementation(async ({ endpoint }) => {
      writes.push(endpoint);
      if (failSecond && endpoint.includes("/bob/"))
        throw new Error("Unavailable");
      return undefined;
    });
    try {
      await act(async () => {
        expect(
          await hook.result.current.save(
            ["alice", "bob"].map((handle) => ({
              profile: { ...owner, id: handle, query: handle, handle },
              category: "Artist",
              amount: 10,
            }))
          )
        ).toBe(!failSecond);
      });
      expect(writes).toEqual([
        "profiles/alice/rep/rating",
        "profiles/bob/rep/rating",
      ]);
      expect(reads).toEqual({ allowance: 1, contributors: 1, overview: 1 });
      expect(client.getQueryState(receivedKeys[0]!)?.isInvalidated).toBe(true);
      expect(client.getQueryState(receivedKeys[1]!)?.isInvalidated).toBe(
        !failSecond
      );
      expect(hook.result.current.isSaving).toBe(false);
    } finally {
      hook.unmount();
      tracked.forEach((unsubscribe) => unsubscribe());
      client.clear();
    }
  }
);
