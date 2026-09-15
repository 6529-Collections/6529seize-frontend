import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useDropFilePreparation } from "@/components/waves/create-drop-content/useDropFilePreparation";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import {
  rememberPreparedDropImage,
  validateDropImageSignature,
} from "@/services/uploads/prepareDropImage";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";

jest.mock("@/components/auth/Auth", () => ({ useAuth: () => ({}) }));
jest.mock("@/services/uploads/prepareDropImage", () => ({
  validateDropImageSignature: jest.fn(() => Promise.resolve()),
  rememberPreparedDropImage: jest.fn(),
  getDropUploadOwner: () => "test-account",
}));
jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(),
}));
const toast = jest.fn();
const image = (name: string) =>
  new File(["image"], name, { type: "image/avif" });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
function useComposer(scope: string, initialFiles: File[] = []) {
  const [files, setFiles] = useState(initialFiles);
  const preparation = useDropFilePreparation({
    scopeKey: scope,
    existingFiles: files,
    disabled: false,
    setToast: toast,
    onFiles: (next) => setFiles((current) => [...current, ...next]),
  });
  return { ...preparation, files };
}
const ready = {
  url: "https://media.example/test.webp",
  mime_type: "image/webp",
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(validateDropImageSignature).mockResolvedValue(undefined);
  jest.mocked(multiPartUpload).mockResolvedValue(ready);
});
it("keeps Send pending through validation, upload and processing, then retains the file", async () => {
  const pending = deferred<ApiDropMedia>();
  jest.mocked(multiPartUpload).mockReturnValue(pending.promise);
  const file = image("still.AVIF");
  const { result } = renderHook(() => useComposer("wave"));
  act(() => result.current.handleFileChange([file]));
  expect(result.current.isPreparingFiles).toBe(true);
  await waitFor(() => expect(multiPartUpload).toHaveBeenCalled());
  act(() => jest.mocked(multiPartUpload).mock.calls[0]![0].onProcessing?.());
  expect(result.current.preparingFiles[0]?.phase).toBe("processing");
  expect(result.current.files).toEqual([]);
  await act(async () => pending.resolve(ready));
  expect(result.current.isPreparingFiles).toBe(false);
  expect(result.current.files).toEqual([file]);
  expect(rememberPreparedDropImage).toHaveBeenCalledWith(
    file,
    ready,
    "test-account"
  );
});
it("preserves valid selections when another file fails", async () => {
  jest.mocked(multiPartUpload).mockRejectedValue(new Error("Invalid AVIF"));
  const valid = new File(["image"], "valid.png", { type: "image/png" });
  const invalid = image("corrupt.avif");
  const { result } = renderHook(() => useComposer("wave"));
  await act(async () => result.current.handleFileChange([valid, invalid]));
  expect(result.current.files).toEqual([valid]);
  expect(result.current.isPreparingFiles).toBe(false);
  expect(result.current.preparingFiles).toEqual([]);
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Could not add corrupt.avif" })
  );
});
it("reserves file-count capacity across simultaneous batches", async () => {
  const pending = deferred<ApiDropMedia>();
  jest.mocked(multiPartUpload).mockReturnValue(pending.promise);
  const existing = Array.from({ length: 7 }, (_, i) =>
    image(`existing-${i}.avif`)
  );
  const file = image("eighth.avif");
  const { result } = renderHook(() => useComposer("wave", existing));
  act(() => {
    result.current.handleFileChange([file]);
    result.current.handleFileChange([image("ninth.avif")]);
  });
  await waitFor(() => expect(multiPartUpload).toHaveBeenCalledTimes(1));
  await act(async () => pending.resolve(ready));
  expect(result.current.files).toEqual([...existing, file]);
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({ message: expect.stringContaining("8") })
  );
});
it("aborts and discards an upload when its composer scope changes", async () => {
  const pending = deferred<ApiDropMedia>();
  jest.mocked(multiPartUpload).mockReturnValue(pending.promise);
  const { result, rerender } = renderHook(({ scope }) => useComposer(scope), {
    initialProps: { scope: "wave-one" },
  });
  act(() => result.current.handleFileChange([image("still.avif")]));
  await waitFor(() => expect(multiPartUpload).toHaveBeenCalled());
  const signal = jest.mocked(multiPartUpload).mock.calls[0]![0].signal;
  rerender({ scope: "wave-two" });
  expect(signal?.aborted).toBe(true);
  await act(async () => pending.resolve(ready));
  expect(result.current.files).toEqual([]);
  expect(result.current.isPreparingFiles).toBe(false);
  expect(rememberPreparedDropImage).not.toHaveBeenCalled();
  rerender({ scope: "wave-one" });
  expect(result.current.isPreparingFiles).toBe(false);
  expect(result.current.preparingFiles).toEqual([]);
});

it("keeps a new scope's reservation when an aborted upload finishes", async () => {
  const oldUpload = deferred<ApiDropMedia>();
  const newUpload = deferred<ApiDropMedia>();
  jest
    .mocked(multiPartUpload)
    .mockReturnValueOnce(oldUpload.promise)
    .mockReturnValueOnce(newUpload.promise);
  const file = image("last-slot.avif");
  const existing = Array.from({ length: 7 }, (_, i) =>
    image(`existing-${i}.avif`)
  );
  const { result, rerender } = renderHook(
    ({ scope }) => useComposer(scope, existing),
    { initialProps: { scope: "wave-one" } }
  );
  act(() => result.current.handleFileChange([file]));
  await waitFor(() => expect(multiPartUpload).toHaveBeenCalledTimes(1));
  rerender({ scope: "wave-two" });
  act(() => result.current.handleFileChange([file]));
  await waitFor(() => expect(multiPartUpload).toHaveBeenCalledTimes(2));
  await act(async () => oldUpload.resolve(ready));
  act(() => result.current.handleFileChange([image("overflow.avif")]));
  await act(async () => newUpload.resolve(ready));
  expect(multiPartUpload).toHaveBeenCalledTimes(2);
  expect(result.current.files).toEqual([...existing, file]);
});
