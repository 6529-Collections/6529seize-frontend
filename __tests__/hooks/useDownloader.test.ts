import { act, renderHook, waitFor } from "@testing-library/react";
import useDownloader from "@/hooks/useDownloader";

const reactDownloadMock = jest.fn();
const shareFetchedBlobInNativeAppMock = jest.fn();
let reactDownloaderError: any = null;

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    size: 0,
    elapsed: 0,
    percentage: 0,
    download: reactDownloadMock,
    cancel: jest.fn(),
    error: reactDownloaderError,
    isInProgress: false,
  })),
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

// The bare @capacitor/core mock above drops registerPlugin/WebPlugin, which
// capacitor-secure-storage-plugin needs at module load. That module is pulled
// in through the jest.setup requireActual chain (SeizeSettingsContext ->
// 6529api -> auth.utils -> native-refresh-token-storage), so without this
// mock the whole suite fails to load.
jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("@/helpers/capacitorBlobDownload.helpers", () => ({
  shareFetchedBlobInNativeApp: (...args: unknown[]) =>
    shareFetchedBlobInNativeAppMock(...args),
}));

const { Capacitor } = require("@capacitor/core");

describe("useDownloader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reactDownloaderError = null;
    Capacitor.isNativePlatform.mockReturnValue(false);
  });

  it("delegates to react-use-downloader on web", async () => {
    const { result } = renderHook(() => useDownloader());

    await act(async () => {
      await result.current.download("/file.csv", "file.csv");
    });

    expect(reactDownloadMock).toHaveBeenCalledWith("/file.csv", "file.csv");
  });

  it("normalizes web 404 download errors", () => {
    reactDownloaderError = {
      errorMessage: "404 - : <html>not deployed</html>",
    };

    const { result } = renderHook(() => useDownloader());

    expect(result.current.error?.errorMessage).toBe(
      "This download is not available right now."
    );
  });

  it("fetches and shares downloaded files in Capacitor", async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["csv"], { type: "text/csv" })),
    });

    const { result } = renderHook(() =>
      useDownloader({ headers: { Authorization: "Bearer jwt" } })
    );

    await act(async () => {
      await result.current.download("/file.csv", "file.csv", undefined, {
        headers: { Accept: "text/csv" },
      });
    });

    const fetchOptions = (globalThis.fetch as jest.Mock).mock
      .calls[0][1] as RequestInit;
    expect(fetchOptions.method).toBe("GET");
    expect(new Headers(fetchOptions.headers).get("authorization")).toBe(
      "Bearer jwt"
    );
    expect(new Headers(fetchOptions.headers).get("accept")).toBe("text/csv");
    expect(fetchOptions.signal).toEqual(
      expect.objectContaining({ aborted: false })
    );
    expect(shareFetchedBlobInNativeAppMock).toHaveBeenCalledWith(
      expect.any(Blob),
      "file.csv"
    );
    await waitFor(() => expect(result.current.percentage).toBe(100));
  });

  it("merges Headers instances for Capacitor downloads", async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["csv"], { type: "text/csv" })),
    });

    const { result } = renderHook(() =>
      useDownloader({
        headers: new Headers({
          Authorization: "Bearer jwt",
          Accept: "application/json",
        }),
      })
    );

    await act(async () => {
      await result.current.download("/file.csv", "file.csv", undefined, {
        headers: new Headers({ Accept: "text/csv" }),
      });
    });

    const fetchOptions = (globalThis.fetch as jest.Mock).mock
      .calls[0][1] as RequestInit;
    const headers = new Headers(fetchOptions.headers);
    expect(headers.get("authorization")).toBe("Bearer jwt");
    expect(headers.get("accept")).toBe("text/csv");
  });

  it("aborts and clears native download work on unmount", async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    const clearIntervalSpy = jest.spyOn(globalThis.window, "clearInterval");
    const clearTimeoutSpy = jest.spyOn(globalThis.window, "clearTimeout");
    let signal: AbortSignal | undefined;
    globalThis.fetch = jest.fn((_, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>((_, reject) => {
        signal?.addEventListener("abort", () => {
          const abortError = new Error("Aborted");
          abortError.name = "AbortError";
          reject(abortError);
        });
      });
    });

    const { result, unmount } = renderHook(() => useDownloader());

    act(() => {
      result.current
        .download("/slow.csv", "slow.csv", 5000)
        .catch(() => undefined);
    });
    act(() => {
      unmount();
    });

    await waitFor(() => expect(signal?.aborted).toBe(true));
    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it("exposes download errors in Capacitor", async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    const response = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: { get: () => "application/json" },
      clone: () => response,
      json: () => Promise.resolve({ error: "No rows" }),
      text: () => Promise.resolve(JSON.stringify({ error: "No rows" })),
    };
    globalThis.fetch = jest.fn().mockResolvedValue(response);

    const { result } = renderHook(() => useDownloader());

    await act(async () => {
      await result.current.download("/missing.csv", "missing.csv");
    });

    await waitFor(() =>
      expect(result.current.error?.errorMessage).toBe(
        "This download is not available right now."
      )
    );
    expect(shareFetchedBlobInNativeAppMock).not.toHaveBeenCalled();
  });
});
