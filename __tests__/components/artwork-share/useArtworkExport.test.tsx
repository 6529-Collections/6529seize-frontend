import { act, renderHook, waitFor } from "@testing-library/react";
import { useArtworkExport } from "@/components/artwork-share/useArtworkExport";

const png = () =>
  ({
    ok: true,
    headers: new Headers({ "content-type": "image/png" }),
    blob: async () => new Blob(["png"], { type: "image/png" }),
  }) as Response;

describe("useArtworkExport", () => {
  const originalFetch = global.fetch;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    URL.createObjectURL = jest.fn(() => "blob:artwork");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it("withholds the previous file while replacement artwork is loading and releases its preview", async () => {
    fetchMock.mockResolvedValueOnce(png());
    let resolveNext!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveNext = resolve;
        })
    );
    const { result, rerender, unmount } = renderHook(
      ({ url }) => useArtworkExport(url, "art.png"),
      { initialProps: { url: "/first.png" } }
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    rerender({ url: "/replacement.png" });
    expect(result.current.state).toEqual({ status: "loading" });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:artwork");
    await act(async () => resolveNext(png()));
    expect(result.current.state.status).toBe("ready");
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("allows retry after a failed export without exposing an HTML response as a PNG", async () => {
    fetchMock.mockResolvedValueOnce({
      ...png(),
      headers: new Headers({ "content-type": "text/html" }),
    });
    fetchMock.mockResolvedValueOnce(png());
    const { result } = renderHook(() => useArtworkExport("/export", "art.png"));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    act(() => result.current.retry());
    expect(result.current.state.status).toBe("loading");
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
  });

  it("aborts preparation when the dialog closes and does not create a late preview", async () => {
    let resolve!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        })
    );
    const { unmount } = renderHook(() =>
      useArtworkExport("/export", "art.png")
    );
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => resolve(png()));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("turns a timed out preparation into a retryable error", async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementationOnce(
        (_url: string, { signal }: RequestInit) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          })
      );
      const { result } = renderHook(() =>
        useArtworkExport("/export", "art.png")
      );
      await act(async () => jest.advanceTimersByTime(30_000));
      expect(result.current.state.status).toBe("error");
    } finally {
      jest.useRealTimers();
    }
  });
});
