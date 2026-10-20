import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiCompetition } from "@/generated/models/ApiCompetition";
import { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { useCompetitionEntrySubmit } from "@/hooks/competitions/useCompetitionEntrySubmit";
import {
  createCompetitionEntry,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";

let mockViewer = "viewer:self";
const mockSign = jest.fn();
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignatureFor: () => mockSign,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => mockViewer,
}));
jest.mock("@/services/api/competitions-api", () => ({
  createCompetitionEntry: jest.fn(),
  invalidateCompetition: jest.fn(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropV2ById: jest.fn(),
}));
const competition = Object.assign(new ApiCompetition(), {
  id: "selected",
  wave_id: "wave",
  config_version: 3,
  participation: { signature_required: true },
});
const content = Object.assign(new ApiCreateDropRequest(), {
  wave_id: "wave",
  signature: "old-drop-signature",
  signature_message: "old-message",
  parts: [],
});
function setup(selected: ApiCompetition | null = competition) {
  const client = new QueryClient();
  return renderHook(() => useCompetitionEntrySubmit(selected), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  mockViewer = "viewer:self";
  mockSign.mockResolvedValue({
    message: "competition-message",
    signature: "competition-signature",
  });
  jest
    .mocked(createCompetitionEntry)
    .mockResolvedValue({ id: "entry", drop_id: "saved-drop" } as never);
  jest.mocked(fetchDropV2ById).mockResolvedValue({ id: "saved-drop" } as never);
  jest.mocked(invalidateCompetition).mockResolvedValue(undefined);
});
it("does not create an entry after a canceled signature and can sign a retry", async () => {
  const canceled = Object.assign(new Error("Canceled"), { code: 4001 });
  mockSign.mockRejectedValueOnce(canceled);
  const { result } = setup();
  await act(async () => {
    await expect(result.current(content)).rejects.toBe(canceled);
  });
  expect(createCompetitionEntry).not.toHaveBeenCalled();
  await act(async () => {
    await result.current(content);
  });
  expect(mockSign).toHaveBeenCalledTimes(2);
  expect(createCompetitionEntry).toHaveBeenCalledTimes(1);
});
it("signs and creates in the explicit competition scope without a legacy drop signature", async () => {
  const { result } = setup();
  await act(async () => {
    await result.current(content);
  });
  const [identity, request] = jest.mocked(createCompetitionEntry).mock
    .calls[0]!;
  expect(identity).toEqual({ waveId: "wave", competitionId: "selected" });
  expect(request).toMatchObject({
    config_version: 3,
    drop: { wave_id: "wave", signature: null },
    signature: { message: "competition-message" },
  });
  expect(request.drop).not.toHaveProperty("signature_message");
  expect(mockSign).toHaveBeenCalledWith(
    "ENTRY_CREATE",
    { drop: request.drop, drop_id: null },
    null,
    null
  );
});
it("reuses the same signed command after an uncertain create response", async () => {
  jest
    .mocked(createCompetitionEntry)
    .mockRejectedValueOnce(new Error("Offline"));
  const { result } = setup();
  await act(async () => {
    await expect(result.current(content)).rejects.toThrow("Offline");
  });
  await act(async () => {
    await result.current(content);
  });
  expect(jest.mocked(createCompetitionEntry).mock.calls[0]).toEqual(
    jest.mocked(createCompetitionEntry).mock.calls[1]
  );
  expect(mockSign).toHaveBeenCalledTimes(1);
});
it("retains the command after accepted creation even when hydration is temporarily unavailable", async () => {
  jest.mocked(fetchDropV2ById).mockRejectedValueOnce({ status: 404 });
  const { result } = setup();
  await act(async () => {
    await expect(result.current(content)).rejects.toEqual({ status: 404 });
  });
  await act(async () => {
    await result.current(content);
  });
  expect(jest.mocked(createCompetitionEntry).mock.calls[0]).toEqual(
    jest.mocked(createCompetitionEntry).mock.calls[1]
  );
  expect(mockSign).toHaveBeenCalledTimes(1);
});
it("clears rejected commands and isolates another viewer's retry", async () => {
  jest.mocked(createCompetitionEntry).mockRejectedValueOnce({ status: 409 });
  const { result, rerender } = setup();
  await act(async () => {
    await expect(result.current(content)).rejects.toEqual({ status: 409 });
  });
  mockViewer = "other:self";
  rerender();
  await act(async () => {
    await result.current(content);
  });
  const requests = jest.mocked(createCompetitionEntry).mock.calls;
  expect(requests[0]![1].idempotency_key).not.toBe(
    requests[1]![1].idempotency_key
  );
  expect(mockSign).toHaveBeenCalledTimes(2);
});
it.each([
  null,
  Object.assign(new ApiCompetition(), { ...competition, wave_id: "other" }),
])("rejects missing or cross-wave scope before signing", async (selected) => {
  const { result } = setup(selected);
  await act(async () => {
    await expect(result.current(content)).rejects.toThrow("scope");
  });
  expect(mockSign).not.toHaveBeenCalled();
  expect(createCompetitionEntry).not.toHaveBeenCalled();
});
