import { pollDocumentationProcessing } from "@/lib/artwork-documentation/poll-processing";

describe("processing polling", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it("keeps one request in flight and aborts a stalled request at expiry", async () => {
    let signal!: AbortSignal;
    const poll = jest.fn((current: AbortSignal) => {
      signal = current;
      return new Promise<boolean>(() => {});
    });
    const onError = jest.fn();
    const stop = pollDocumentationProcessing({
      expiresAt: Date.now() + 15_000,
      poll,
      onError,
    });
    await jest.advanceTimersByTimeAsync(14_000);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(signal.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1000);
    expect(signal.aborted).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
    stop();
  });
  it("waits until a settled poll before scheduling the next and cancels on unmount", async () => {
    const poll = jest.fn().mockResolvedValue(true);
    const onError = jest.fn();
    const stop = pollDocumentationProcessing({
      expiresAt: Date.now() + 60_000,
      poll,
      onError,
    });
    await jest.advanceTimersByTimeAsync(6000);
    expect(poll).toHaveBeenCalledTimes(2);
    stop();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(poll).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });
});
