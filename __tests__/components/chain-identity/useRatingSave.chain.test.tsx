import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useChainRatingWriter } from "@/components/chain-identity/useChainRatingWriter";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useRatingSave } from "@/components/user/rep/modify-rep/useRatingSave";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/components/chain-identity/useChainRatingWriter", () => ({
  useChainRatingWriter: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(async () => ({})),
}));

const requestAuth = jest.fn(async () => ({ success: true }));
const setToast = jest.fn();
const onProfileRepModify = jest.fn(async () => undefined);
const profile = {
  id: "p1",
  handle: "rated_one",
  query: "rated_one",
  display: "rated_one",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContext.Provider
    value={
      {
        requestAuth,
        setToast,
        connectedProfile: { id: "me", handle: "me" },
        activeProfileProxy: null,
      } as never
    }
  >
    <ReactQueryWrapperContext.Provider
      value={{ onProfileRepModify, onProfileCICModify: jest.fn() } as never}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

beforeEach(() => jest.clearAllMocks());

it("writes REP on the 6529 Network once it is active, with no 6529.io sign-in", async () => {
  const chainWrite = jest.fn(async () => undefined);
  (useChainRatingWriter as jest.Mock).mockReturnValue(chainWrite);
  const { result } = renderHook(() => useRatingSave("REP"), { wrapper });
  let saved = false;
  await act(async () => {
    saved = await result.current.save([
      { profile: profile as never, amount: 25, category: "Art" },
    ]);
  });
  expect(saved).toBe(true);
  expect(chainWrite).toHaveBeenCalledWith({
    matter: "REP",
    profile,
    category: "Art",
    amount: 25,
  });
  expect(requestAuth).not.toHaveBeenCalled();
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("keeps 6529.io's own rating request before the switch-on", async () => {
  (useChainRatingWriter as jest.Mock).mockReturnValue(null);
  const { result } = renderHook(() => useRatingSave("REP"), { wrapper });
  await act(async () => {
    await result.current.save([
      { profile: profile as never, amount: 25, category: "Art" },
    ]);
  });
  expect(requestAuth).toHaveBeenCalled();
  expect(commonApiPost).toHaveBeenCalledWith({
    endpoint: "profiles/rated_one/rep/rating",
    body: { amount: 25, category: "Art" },
  });
});
