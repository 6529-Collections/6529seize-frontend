import { renderHook } from "@testing-library/react";
import { useMembershipNavigation } from "@/hooks/useMembershipNavigation";

let mockAddress: string | undefined;
let mockConnectedProfile: { handle: string | null } | null = null;
let mockAuthenticated = false;
let mockFetching = false;
let mockHydrated = true;
let mockConnectionState = "disconnected";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockConnectedProfile,
    isAuthenticated: mockAuthenticated,
    fetchingProfile: mockFetching,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAddress,
    connectionState: mockConnectionState,
  }),
}));
jest.mock("@/hooks/useHasHydrated", () => ({
  useHasHydrated: () => mockHydrated,
}));

beforeEach(() => {
  mockAddress = undefined;
  mockConnectedProfile = null;
  mockAuthenticated = false;
  mockFetching = false;
  mockHydrated = true;
  mockConnectionState = "disconnected";
});

it.each(["initializing", "connecting"])(
  "does not publish Validator while %s",
  (state) => {
    mockAuthenticated = true;
    mockConnectionState = state;
    const { result } = renderHook(useMembershipNavigation);
    expect(result.current).toMatchObject({
      href: "/join-6529",
      isPending: true,
    });
  }
);
it("waits for profile loading and hydration even with a cached authenticated session", () => {
  mockAuthenticated = true;
  mockFetching = true;
  const { result, rerender } = renderHook(useMembershipNavigation);
  expect(result.current.isPending).toBe(true);
  mockFetching = false;
  mockHydrated = false;
  rerender();
  expect(result.current).toMatchObject({ href: "/join-6529", isPending: true });
  mockHydrated = true;
  rerender();
  expect(result.current).toMatchObject({
    href: "/validator",
    label: "Validator",
    isPending: false,
  });
});
it("switches safely between member, profileless wallet, and logout", () => {
  mockConnectionState = "connected";
  mockAuthenticated = true;
  const { result, rerender } = renderHook(useMembershipNavigation);
  expect(result.current.href).toBe("/validator");
  mockAuthenticated = false;
  rerender();
  expect(result.current).toMatchObject({
    href: "/join-6529",
    label: "Join 6529",
    isPending: false,
  });
  mockConnectionState = "disconnected";
  rerender();
  expect(result.current.href).toBe("/join-6529");
});

it("keeps a failed identity lookup unresolved until a successful profileless response", () => {
  mockAddress = "0x1111111111111111111111111111111111111111";
  mockConnectionState = "connected";
  const { result, rerender } = renderHook(useMembershipNavigation);
  expect(result.current).toMatchObject({ href: "/join-6529", isPending: true });
  mockConnectedProfile = { handle: null };
  rerender();
  expect(result.current).toMatchObject({
    href: "/join-6529",
    isPending: false,
  });
});
