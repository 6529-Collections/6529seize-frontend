import { act, renderHook } from "@testing-library/react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useDropEditWindow } from "@/hooks/useDropEditWindow";
const mockSession = {
  isAuthenticated: true,
  isDirectProfileSession: true,
  fetchingProfile: false,
  connectedProfile: { handle: "me" },
  activeProfileProxy: null,
};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockSession }));

const NOW = Date.UTC(2026, 10, 5);
const WINDOW_MS = 300_000;
const drop = (overrides: Partial<ApiDrop> = {}): ApiDrop =>
  ({
    id: "message",
    created_at: NOW,
    updated_at: null,
    wave: { description_drop_id: "description" },
    ...overrides,
  }) as ApiDrop;

beforeEach(() => {
  mockSession.isAuthenticated = true;
  mockSession.isDirectProfileSession = true;
  mockSession.fetchingProfile = false;
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});
afterEach(() => jest.useRealTimers());

it("expires the edit action while the message stays mounted", () => {
  const { result } = renderHook(() => useDropEditWindow(drop(), true));
  expect(result.current).toBe(true);
  act(() => jest.advanceTimersByTime(WINDOW_MS + 1));
  expect(result.current).toBe(false);
});

it.each(["isAuthenticated", "isDirectProfileSession"] as const)(
  "hides edit when %s becomes false",
  (flag) => {
    const { result, rerender } = renderHook(() =>
      useDropEditWindow(drop(), true)
    );
    expect(result.current).toBe(true);
    mockSession[flag] = false;
    rerender();
    expect(result.current).toBe(false);
  }
);

it("does not edit a temporary drop even for its authenticated author", () => {
  const { result } = renderHook(() =>
    useDropEditWindow(drop({ id: "temp-1" }), true)
  );
  expect(result.current).toBe(false);
});

it("uses the last edit time and updates eligibility when the message changes", () => {
  const { result, rerender } = renderHook(
    ({ message }) => useDropEditWindow(message, true),
    {
      initialProps: { message: drop({ created_at: NOW - WINDOW_MS - 1 }) },
    }
  );
  expect(result.current).toBe(false);
  rerender({
    message: drop({ created_at: NOW - WINDOW_MS - 1, updated_at: NOW }),
  });
  expect(result.current).toBe(true);
});

it("keeps the server's wave-description exception and denies non-authors", () => {
  const description = drop({
    id: "description",
    created_at: NOW - WINDOW_MS - 1,
  });
  const { result, rerender } = renderHook(
    ({ author }) => useDropEditWindow(description, author),
    {
      initialProps: { author: true },
    }
  );
  expect(result.current).toBe(true);
  rerender({ author: false });
  expect(result.current).toBe(false);
});
