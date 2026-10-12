import { act, renderHook, waitFor } from "@testing-library/react";
import { useDropForgeManualWrite } from "@/hooks/useDropForgeManualWrite";
import {
  beginForgeManual,
  finishForgeManual,
} from "@/services/api/drop-forge-api";
const mockAuth = jest.fn().mockResolvedValue({ success: true });
const mockToast = jest.fn();
const mockClient = {
  invalidateQueries: jest.fn().mockResolvedValue(undefined),
};
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: mockAuth, setToast: mockToast }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockClient,
}));
jest.mock("@/services/api/drop-forge-api", () => ({
  beginForgeManual: jest.fn(),
  finishForgeManual: jest.fn(),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
const key = "drop-forge-manual:creator:123";
type Props = { hash: string | undefined; error: unknown; fingerprint: string };
function setup(initialHash?: string) {
  return renderHook(
    ({ hash, error, fingerprint }: Props) =>
      useDropForgeManualWrite("creator", 123, hash, error, fingerprint),
    {
      initialProps: {
        hash: initialHash,
        error: null,
        fingerprint: "original",
      } as Props,
    }
  );
}
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  jest.mocked(beginForgeManual).mockResolvedValue({ lease_id: "lease" });
  jest.mocked(finishForgeManual).mockResolvedValue({ lease_id: null });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
it("registers the new hash with the category and lease of its write, ignoring pre-existing data", async () => {
  const hook = setup("old-hash");
  const write = jest.fn();
  await act(async () => {
    await hook.result.current(write, "phase1");
  });
  expect(write).toHaveBeenCalledTimes(1);
  expect(finishForgeManual).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem(key)!).hash).toBeUndefined();
  hook.rerender({ hash: "new-hash", error: null, fingerprint: "original" });
  await waitFor(() =>
    expect(finishForgeManual).toHaveBeenCalledWith(
      "creator",
      123,
      "lease",
      "new-hash",
      "phase1"
    )
  );
  await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
});
it("releases a changed fingerprint and never persists a late hash for its cancelled attempt", async () => {
  let resolve!: (value: { lease_id: string }) => void;
  jest.mocked(beginForgeManual).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const hook = setup();
  const write = jest.fn();
  let pending!: Promise<void>;
  act(() => {
    pending = hook.result.current(write, "artist");
  });
  await waitFor(() => expect(beginForgeManual).toHaveBeenCalled());
  hook.rerender({ hash: undefined, error: null, fingerprint: "changed" });
  await act(async () => {
    resolve({ lease_id: "lease" });
    await pending;
  });
  expect(write).not.toHaveBeenCalled();
  expect(localStorage.getItem(key)).toBeNull();
  hook.rerender({ hash: "late-hash", error: null, fingerprint: "changed" });
  expect(localStorage.getItem(key)).toBeNull();
  expect(finishForgeManual).toHaveBeenCalledTimes(1);
});
it("keeps another tab attempt intact when an old hash arrives", async () => {
  const hook = setup();
  await act(async () => {
    await hook.result.current(jest.fn(), "phase2");
  });
  const other = JSON.stringify({ attempt_id: "another", lease: "other" });
  localStorage.setItem(key, other);
  hook.rerender({ hash: "late-hash", error: null, fingerprint: "original" });
  expect(localStorage.getItem(key)).toBe(other);
  expect(finishForgeManual).not.toHaveBeenCalled();
});
it("retains legacy writes when BEGIN explicitly returns no managed lease", async () => {
  jest.mocked(beginForgeManual).mockResolvedValue({ lease_id: null });
  const hook = setup();
  const write = jest.fn();
  await act(async () => {
    await hook.result.current(write, "team");
  });
  expect(write).toHaveBeenCalledTimes(1);
  hook.rerender({ hash: "hash", error: null, fingerprint: "original" });
  await waitFor(() =>
    expect(finishForgeManual).toHaveBeenCalledWith(
      "creator",
      123,
      null,
      "hash",
      "team"
    )
  );
});
it("clears a rejected wallet attempt and ignores its late data", async () => {
  const hook = setup();
  await act(async () => {
    await hook.result.current(jest.fn(), "phase0");
  });
  hook.rerender({
    hash: undefined,
    error: { code: 4001 },
    fingerprint: "original",
  });
  await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
  hook.rerender({ hash: "late-hash", error: null, fingerprint: "original" });
  expect(localStorage.getItem(key)).toBeNull();
  expect(finishForgeManual).toHaveBeenCalledTimes(1);
});
it("retains failed cancellation evidence without showing a toast after unmount", async () => {
  let reject!: (reason: Error) => void;
  jest.mocked(finishForgeManual).mockReturnValue(
    new Promise((_, fail) => {
      reject = fail;
    })
  );
  const hook = setup();
  await act(async () => {
    await hook.result.current(jest.fn(), "phase0");
  });
  hook.rerender({
    hash: undefined,
    error: { code: 4001 },
    fingerprint: "original",
  });
  await waitFor(() => expect(finishForgeManual).toHaveBeenCalledTimes(1));
  const pending = localStorage.getItem(key);
  hook.unmount();
  await act(async () => {
    reject(new Error("Cancellation requires recovery"));
  });
  expect(localStorage.getItem(key)).toBe(pending);
  expect(mockToast).not.toHaveBeenCalled();
});

it("blocks before acquiring a lease or prompting the wallet when storage cannot be read", async () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Storage denied");
  });
  const hook = setup();
  const write = jest.fn();
  await act(async () => {
    await expect(hook.result.current(write, "phase0")).rejects.toThrow(
      "Browser storage is unavailable"
    );
  });
  expect(beginForgeManual).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});

it("keeps a submitted hash in memory and retries the same proof if browser persistence fails", async () => {
  jest.useFakeTimers();
  const hook = setup();
  const write = jest.fn();
  await act(async () => {
    await hook.result.current(write, "phase1");
  });
  const originalWrite = Storage.prototype.setItem;
  const storageWrite = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(function (
      this: Storage,
      storageKey: string,
      value: string
    ) {
      if (storageKey === key && value.includes("submitted-hash"))
        throw new Error("Storage denied");
      return originalWrite.call(this, storageKey, value);
    });
  jest
    .mocked(finishForgeManual)
    .mockRejectedValueOnce(new Error("Backend unavailable"));
  await act(async () => {
    hook.rerender({
      hash: "submitted-hash",
      error: null,
      fingerprint: "original",
    });
  });
  expect(storageWrite).toHaveBeenCalledWith(
    key,
    expect.stringContaining("submitted-hash")
  );
  expect(finishForgeManual).toHaveBeenCalledWith(
    "creator",
    123,
    "lease",
    "submitted-hash",
    "phase1"
  );
  expect(finishForgeManual).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("submitted-hash"),
      })
    )
  );
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(finishForgeManual).toHaveBeenCalledTimes(2);
  expect(finishForgeManual).toHaveBeenLastCalledWith(
    "creator",
    123,
    "lease",
    "submitted-hash",
    "phase1"
  );
  expect(beginForgeManual).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(key)).toBeNull();
  hook.unmount();
});
