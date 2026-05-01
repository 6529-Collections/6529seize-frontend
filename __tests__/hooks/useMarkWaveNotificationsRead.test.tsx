import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

const createDeferred = (): Deferred => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

const apiPostMock = commonApiPostWithoutBodyAndResponse as jest.MockedFunction<
  typeof commonApiPostWithoutBodyAndResponse
>;

const createWrapper =
  (invalidateNotifications: jest.Mock) =>
  ({ children }: { readonly children: ReactNode }) => (
    <ReactQueryWrapperContext.Provider
      value={{ invalidateNotifications } as any}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  );

describe("useMarkWaveNotificationsRead", () => {
  beforeEach(() => {
    apiPostMock.mockReset();
  });

  it("sends one trailing read after two calls for the same wave", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const firstPromise = result.current("wave-1");
    const secondPromise = result.current("wave-1");

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave-1/read",
    });

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });
    expect(apiPostMock).toHaveBeenLastCalledWith({
      endpoint: "notifications/wave/wave-1/read",
    });
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);

    trailingRequest.resolve();

    await expect(firstPromise).resolves.toBeUndefined();
    await expect(secondPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("collapses repeated same-wave calls into one trailing read", async () => {
    const firstRequest = createDeferred();
    const trailingRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(trailingRequest.promise);

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const promises = [
      result.current("wave-1"),
      result.current("wave-1"),
      result.current("wave-1"),
      result.current("wave-1"),
    ];

    expect(apiPostMock).toHaveBeenCalledTimes(1);

    firstRequest.resolve();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(2);
    });

    trailingRequest.resolve();

    await Promise.all(promises);

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });

  it("reads different waves independently", async () => {
    const waveOneRequest = createDeferred();
    const waveTwoRequest = createDeferred();
    const invalidateNotifications = jest.fn();

    apiPostMock.mockImplementation(({ endpoint }) => {
      if (endpoint === "notifications/wave/wave-1/read") {
        return waveOneRequest.promise;
      }

      return waveTwoRequest.promise;
    });

    const { result } = renderHook(() => useMarkWaveNotificationsRead(), {
      wrapper: createWrapper(invalidateNotifications),
    });

    const waveOnePromise = result.current("wave-1");
    const waveTwoPromise = result.current("wave-2");

    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(apiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: "notifications/wave/wave-1/read",
    });
    expect(apiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: "notifications/wave/wave-2/read",
    });

    waveTwoRequest.resolve();

    await expect(waveTwoPromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);

    waveOneRequest.resolve();

    await expect(waveOnePromise).resolves.toBeUndefined();
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });
});
