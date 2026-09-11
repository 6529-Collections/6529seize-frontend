import { act, renderHook, waitFor } from "@testing-library/react";
import { ReadableStream } from "node:stream/web";
import { useArtworkExport } from "@/components/artwork-share/useArtworkExport";

const MAX_EXPORT_BYTES = 8 * 1024 * 1024;

const pngResponse = (
  body: ReadableStream<Uint8Array> | null,
  contentLength?: string
) =>
  ({
    ok: true,
    headers: new Headers({
      "content-type": "image/png",
      ...(contentLength === undefined
        ? {}
        : { "content-length": contentLength }),
    }),
    body,
  }) as Response;

const png = () =>
  pngResponse(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([137, 80, 78, 71]));
        controller.close();
      },
    })
  );

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

  it.each([String(MAX_EXPORT_BYTES + 1), "-1", "NaN", "12bytes", "8.5", ""])(
    "rejects invalid or oversized content-length %s before reading any bytes",
    async (contentLength) => {
      const pull = jest.fn();
      const cancel = jest.fn();
      const body = new ReadableStream({ pull, cancel }, { highWaterMark: 0 });
      fetchMock.mockResolvedValueOnce(pngResponse(body, contentLength));

      const { result } = renderHook(() =>
        useArtworkExport("/export", "art.png")
      );

      await waitFor(() => expect(result.current.state.status).toBe("error"));
      expect(pull).not.toHaveBeenCalled();
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(body.locked).toBe(false);
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, "3"])(
    "stops streaming at the byte limit with content-length %s",
    async (contentLength) => {
      let chunksRead = 0;
      const cancel = jest.fn();
      const body = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            chunksRead += 1;
            controller.enqueue(
              new Uint8Array(chunksRead === 1 ? MAX_EXPORT_BYTES : 1)
            );
          },
          cancel,
        },
        { highWaterMark: 0 }
      );
      fetchMock.mockResolvedValueOnce(pngResponse(body, contentLength));
      const { result } = renderHook(() =>
        useArtworkExport("/export", "art.png")
      );

      await waitFor(() => expect(result.current.state.status).toBe("error"));
      expect(chunksRead).toBe(2);
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(body.locked).toBe(false);
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    }
  );

  it("prepares the complete file at the exact byte limit and releases the reader", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_EXPORT_BYTES / 2));
        controller.enqueue(new Uint8Array(MAX_EXPORT_BYTES / 2));
        controller.close();
      },
    });
    fetchMock.mockResolvedValueOnce(pngResponse(body));
    const { result } = renderHook(() => useArtworkExport("/export", "art.png"));

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.state).toMatchObject({
      status: "ready",
      file: { name: "art.png", size: MAX_EXPORT_BYTES, type: "image/png" },
    });
    expect(body.locked).toBe(false);
  });

  it("rejects an empty body and supports retry after a stream error", async () => {
    const emptyBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    const failedBody = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.error(new Error("Connection closed"));
      },
    });
    fetchMock.mockResolvedValueOnce(pngResponse(emptyBody));
    fetchMock.mockResolvedValueOnce(pngResponse(failedBody));
    fetchMock.mockResolvedValueOnce(png());
    const { result } = renderHook(() => useArtworkExport("/export", "art.png"));

    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(emptyBody.locked).toBe(false);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(failedBody.locked).toBe(false);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
  });

  it("cancels a pending stream read when the dialog closes", async () => {
    const cancel = jest.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    fetchMock.mockResolvedValueOnce(pngResponse(body));
    const { unmount } = renderHook(() =>
      useArtworkExport("/export", "art.png")
    );
    await waitFor(() => expect(body.locked).toBe(true));

    unmount();

    await waitFor(() => expect(body.locked).toBe(false));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("cancels a pending stream read on timeout and exposes a retryable error", async () => {
    jest.useFakeTimers();
    try {
      const cancel = jest.fn();
      const body = new ReadableStream<Uint8Array>({ cancel });
      fetchMock.mockResolvedValueOnce(pngResponse(body));
      const { result } = renderHook(() =>
        useArtworkExport("/export", "art.png")
      );
      await act(async () => Promise.resolve());
      expect(body.locked).toBe(true);

      await act(async () => jest.advanceTimersByTime(30_000));

      expect(result.current.state.status).toBe("error");
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(body.locked).toBe(false);
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
