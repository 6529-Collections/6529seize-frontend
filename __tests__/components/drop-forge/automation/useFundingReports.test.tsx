import { act, renderHook, waitFor } from "@testing-library/react";
import { useFundingReports } from "@/components/drop-forge/automation/useFundingReports";
import { recordForgeFunding } from "@/services/api/drop-forge-settings";
jest.mock("@/services/api/drop-forge-settings", () => ({
  recordForgeFunding: jest.fn(),
}));
const prefix = "drop-forge-funding:test:";
const original = "0x" + "ab".repeat(32);
const replacement = "0x" + "cd".repeat(32);
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(prefix + original, original);
  localStorage.setItem(prefix + replacement, replacement);
});
it("registers original evidence before its replacement, then clears acknowledged hashes", async () => {
  let acknowledge!: (value: { accepted: boolean }) => void;
  jest
    .mocked(recordForgeFunding)
    .mockReturnValueOnce(
      new Promise((resolve) => {
        acknowledge = resolve;
      })
    )
    .mockResolvedValueOnce({ accepted: true });
  const hook = renderHook(() => useFundingReports(prefix));
  await waitFor(() =>
    expect(recordForgeFunding).toHaveBeenCalledWith(original)
  );
  expect(recordForgeFunding).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(prefix + replacement)).toBe(replacement);
  await act(async () => acknowledge({ accepted: true }));
  await waitFor(() =>
    expect(recordForgeFunding).toHaveBeenNthCalledWith(2, replacement)
  );
  await waitFor(() => {
    expect(localStorage.getItem(prefix + original)).toBeNull();
    expect(localStorage.getItem(prefix + replacement)).toBeNull();
  });
  expect(hook.result.current.pending).toBe(false);
});
it("retains both hashes and stops the batch if the original is not acknowledged", async () => {
  jest.mocked(recordForgeFunding).mockRejectedValue(new Error("offline"));
  const hook = renderHook(() => useFundingReports(prefix));
  await waitFor(() => expect(hook.result.current.pending).toBe(true));
  expect(recordForgeFunding).toHaveBeenCalledTimes(1);
  expect(recordForgeFunding).toHaveBeenCalledWith(original);
  expect(localStorage.getItem(prefix + original)).toBe(original);
  expect(localStorage.getItem(prefix + replacement)).toBe(replacement);
});
