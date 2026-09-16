import { act, renderHook } from "@testing-library/react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useCurationOrder } from "@/hooks/useCurationOrder";
import { moveCurationDrop } from "@/services/api/curation-drop-order-api";

const mockRequestAuth = jest.fn();
const mockInvalidate = jest.fn();
let mockProfile: { id: string } | null = { id: "curator" };
let mockProxy: { id: string } | null = null;
const mockRefetch = jest.fn();
let mockDrops = [{ id: "a" }, { id: "b" }, { id: "c" }] as ExtendedDrop[];
const mockQuery = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestAuth: mockRequestAuth,
    connectedProfile: mockProfile,
    activeProfileProxy: mockProxy,
  }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { DROPS: "drops" },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useWaveCurationDrops", () => ({
  useWaveCurationDrops: (params: unknown) => {
    mockQuery(params);
    return {
      drops: mockDrops,
      startIndex: 0,
      isPlaceholderData: false,
      refetch: mockRefetch,
    };
  },
}));
jest.mock("@/services/api/curation-drop-order-api", () => ({
  ...jest.requireActual("@/services/api/curation-drop-order-api"),
  moveCurationDrop: jest.fn(),
}));
const moveMock = jest.mocked(moveCurationDrop);
const wave = { id: "wave" } as ApiWave;
const renderOrder = () =>
  renderHook(() => useCurationOrder({ wave, curationId: "curation" }));

beforeEach(() => {
  jest.clearAllMocks();
  mockProfile = { id: "curator" };
  mockProxy = null;
  mockDrops = [{ id: "a" }, { id: "b" }, { id: "c" }] as ExtendedDrop[];
  mockRequestAuth.mockResolvedValue({ success: true });
  mockRefetch.mockResolvedValue({});
  mockInvalidate.mockResolvedValue(undefined);
  moveMock.mockResolvedValue(undefined);
});

it("holds realtime order changes during selection but allows new pages to append", () => {
  const { result, rerender } = renderOrder();
  act(() => result.current.hold());
  mockDrops = [...mockDrops, { id: "d" } as ExtendedDrop];
  rerender();
  expect(result.current.drops.map(({ id }) => id)).toEqual([
    "a",
    "b",
    "c",
    "d",
  ]);
  mockDrops = [mockDrops[1]!, mockDrops[0]!, mockDrops[2]!];
  rerender();
  expect(result.current.drops.map(({ id }) => id)).toEqual(["a", "b", "c"]);
  act(() => result.current.release());
  expect(result.current.drops.map(({ id }) => id)).toEqual(["b", "a", "c"]);
});

it("shows the move immediately, rejects overlapping saves, and rolls back failure", async () => {
  let rejectSave: (reason: Error) => void = () => {};
  moveMock.mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        rejectSave = reject;
      })
  );
  const { result } = renderOrder();
  let saving: Promise<void>;
  await act(async () => {
    saving = result.current.move("a", {
      placement: "after",
      anchorDropId: "c",
    });
  });
  expect(result.current.drops.map(({ id }) => id)).toEqual(["b", "c", "a"]);
  await act(async () => {
    await result.current.move("b", { placement: "after", anchorDropId: "c" });
  });
  expect(moveMock).toHaveBeenCalledTimes(1);
  await act(async () => {
    rejectSave(new Error("network unavailable"));
    await saving!;
  });
  expect(result.current.drops.map(({ id }) => id)).toEqual(["a", "b", "c"]);
  expect(result.current.error).toBe("Couldn't save the order. Try again.");
  expect(result.current.busy).toBe(false);
});

it("keeps the successful save when refreshing the posts fails", async () => {
  mockRefetch.mockResolvedValueOnce({ isError: true });
  const { result } = renderOrder();
  await act(async () => {
    await result.current.move("a", { placement: "after", anchorDropId: "b" });
  });
  expect(moveMock).toHaveBeenCalledTimes(1);
  expect(result.current.saved).toBe(true);
  expect(result.current.error).toBe(
    "Order saved, but posts couldn't refresh. Reload to see the latest order."
  );
});

it.each(["disconnected", "proxy"])(
  "does not save for a %s session",
  async (kind) => {
    if (kind === "disconnected") mockProfile = null;
    else mockProxy = { id: "proxy" };
    const { result } = renderOrder();
    await act(async () => {
      await result.current.move("a", { placement: "after", anchorDropId: "b" });
    });
    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(moveMock).not.toHaveBeenCalled();
  }
);

it("shows the authentication cancellation message without saving", async () => {
  mockRequestAuth.mockResolvedValueOnce({ success: false });
  const { result } = renderOrder();
  await act(async () => {
    await result.current.move("a", { placement: "after", anchorDropId: "b" });
  });
  expect(moveMock).not.toHaveBeenCalled();
  expect(result.current.error).toBe("Authentication was cancelled.");
  expect(result.current.busy).toBe(false);
});

it("does not submit an old session's pending authorization after account switching", async () => {
  let authorize: (value: { success: boolean }) => void = () => {};
  mockRequestAuth.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        authorize = resolve;
      })
  );
  const { result, rerender } = renderOrder();
  let saving: Promise<void>;
  act(() => {
    saving = result.current.move("a", {
      placement: "after",
      anchorDropId: "b",
    });
  });
  mockProfile = { id: "another-curator" };
  rerender();
  await act(async () => {
    authorize({ success: true });
    await saving!;
  });
  expect(moveMock).not.toHaveBeenCalled();
  expect(result.current.busy).toBe(false);
});
