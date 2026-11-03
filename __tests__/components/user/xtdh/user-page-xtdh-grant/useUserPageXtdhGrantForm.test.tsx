import type { ContextType, ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useUserPageXtdhGrantForm } from "@/components/user/xtdh/user-page-xtdh-grant/hooks/useUserPageXtdhGrantForm";
import type { ApiXTdhCreateGrant } from "@/generated/models/ApiXTdhCreateGrant";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiPost: jest.fn(),
}));

jest.mock("@/hooks/useIdentityTdhStats", () => ({
  useIdentityTdhStats: () => ({
    data: { unusedRate: 1000 },
    isLoading: false,
    isError: false,
  }),
}));

const mockedCommonApiPost = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

const CONTRACT_ADDRESS = "0x0c58ef43ff3032005e472cb5709f8908acb00205";

// Far enough in the future that validateGrantForm's "must be in the future"
// check passes, with non-zero milliseconds so a seconds/ms mix-up is visible.
const VALID_UNTIL = new Date("2099-01-01T12:34:56.789Z");

const setToast = jest.fn();
const requestAuth = jest.fn();
const invalidateIdentityTdhStats = jest.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const authContext = {
    requestAuth,
    setToast,
    connectedProfile: { handle: "punk6529" },
  } as unknown as ContextType<typeof AuthContext>;
  const reactQueryContext = {
    invalidateIdentityTdhStats,
  } as unknown as ContextType<typeof ReactQueryWrapperContext>;

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContext}>
          <ReactQueryWrapperContext.Provider value={reactQueryContext}>
            {children}
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

async function submitGrant(validUntil: Date | null): Promise<ApiXTdhCreateGrant> {
  const { result } = renderHook(() => useUserPageXtdhGrantForm(), {
    wrapper: createWrapper(),
  });

  act(() => {
    result.current.setContract({
      address: CONTRACT_ADDRESS,
      name: "Test collection",
      imageUrl: null,
    });
    result.current.setSelection({
      contractAddress: CONTRACT_ADDRESS,
      allSelected: false,
      outputMode: "number",
      tokenIds: [1, 2],
    });
    result.current.setAmount(5);
    result.current.setValidUntil(validUntil);
  });

  await act(async () => {
    await result.current.handleSubmit();
  });

  expect(mockedCommonApiPost).toHaveBeenCalledTimes(1);
  const request = mockedCommonApiPost.mock.calls[0]?.[0];
  expect(request?.endpoint).toBe("xtdh/grants");
  return request?.body as ApiXTdhCreateGrant;
}

describe("useUserPageXtdhGrantForm create payload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requestAuth.mockResolvedValue({ success: true });
    mockedCommonApiPost.mockResolvedValue({} as never);
  });

  it("sends valid_to in epoch milliseconds, matching the API contract", async () => {
    const payload = await submitGrant(VALID_UNTIL);

    expect(payload.valid_to).toBe(VALID_UNTIL.getTime());
    // Guard against the regression where the value was sent in seconds.
    expect(payload.valid_to).not.toBe(Math.floor(VALID_UNTIL.getTime() / 1000));
  });

  it("sends a valid_to the API's millisecond future-date check accepts", async () => {
    const payload = await submitGrant(VALID_UNTIL);

    // The API requires valid_to to be greater than the current time in
    // milliseconds; a seconds value is about a thousand times too small.
    expect(payload.valid_to).toBeGreaterThan(Date.now());
  });

  it("sends valid_to null when the grant has no end date", async () => {
    const payload = await submitGrant(null);

    expect(payload.valid_to).toBeNull();
  });

  it("keeps the rest of the create payload unchanged", async () => {
    const payload = await submitGrant(VALID_UNTIL);

    expect(payload).toEqual({
      target_chain: "ETHEREUM_MAINNET",
      target_contract: CONTRACT_ADDRESS,
      target_tokens: ["1", "2"],
      valid_to: VALID_UNTIL.getTime(),
      rate: 5,
      is_irrevocable: false,
    });
  });
});
