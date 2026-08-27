import { useWaveGuidelinesSubmission } from "@/components/waves/create-drop-content/useWaveGuidelinesSubmission";
import type { DropMutationBody } from "@/components/waves/create-drop-content/drop-submission.types";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { act, renderHook } from "@testing-library/react";

const createRequest = (): DropMutationBody =>
  ({
    drop: {
      drop_type: ApiDropType.Chat,
      parts: [{ content: "hi" }],
    },
  }) as DropMutationBody;

describe("useWaveGuidelinesSubmission", () => {
  it("recovers after a rejected preflight instead of silently locking submissions", async () => {
    const enqueueDrop = jest.fn().mockReturnValue(true);
    const requestGuidelinesAgreement = jest
      .fn()
      .mockRejectedValueOnce(new Error("metadata request failed"))
      .mockResolvedValueOnce("accepted");
    const setToast = jest.fn();
    const { result } = renderHook(() =>
      useWaveGuidelinesSubmission({
        enqueueDrop,
        requestGuidelinesAgreement,
        setToast,
      })
    );

    await act(async () => {
      await expect(result.current(createRequest())).resolves.toBe(false);
    });
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Couldn't load the wave guidelines.",
      })
    );

    await act(async () => {
      await expect(result.current(createRequest())).resolves.toBe(true);
    });
    expect(enqueueDrop).toHaveBeenCalledTimes(1);
  });

  it("shares an in-flight preflight instead of rejecting a second submit silently", async () => {
    let resolveAgreement!: (value: "accepted") => void;
    const agreement = new Promise<"accepted">((resolve) => {
      resolveAgreement = resolve;
    });
    const enqueueDrop = jest.fn().mockReturnValue(true);
    const requestGuidelinesAgreement = jest.fn().mockReturnValue(agreement);
    const { result } = renderHook(() =>
      useWaveGuidelinesSubmission({
        enqueueDrop,
        requestGuidelinesAgreement,
        setToast: jest.fn(),
      })
    );

    const first = result.current(createRequest());
    const second = result.current(createRequest());
    expect(second).toBe(first);
    expect(requestGuidelinesAgreement).toHaveBeenCalledTimes(1);

    resolveAgreement("accepted");
    await expect(first).resolves.toBe(true);
    expect(enqueueDrop).toHaveBeenCalledTimes(1);
  });
});
