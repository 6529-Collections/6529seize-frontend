import { act, renderHook } from "@testing-library/react";
import { useAuthSessionRole } from "@/hooks/useAuthSessionRole";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  PROFILE_SWITCHED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";

let mockRole: string | null | undefined;
jest.mock("@/components/auth/auth-session-scope", () => ({
  getAuthSessionRole: () => mockRole,
}));

it.each([
  "storage",
  AUTH_TOKEN_CHANGED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
  PROFILE_SWITCHED_EVENT,
])("refreshes the role when %s reports a token change", (eventName) => {
  mockRole = null;
  const { result } = renderHook(() => useAuthSessionRole());
  expect(result.current).toBeNull();
  act(() => {
    mockRole = "proxy-profile";
    globalThis.dispatchEvent(new Event(eventName));
  });
  expect(result.current).toBe("proxy-profile");
  act(() => {
    mockRole = undefined;
    globalThis.dispatchEvent(new Event(eventName));
  });
  expect(result.current).toBeUndefined();
});
