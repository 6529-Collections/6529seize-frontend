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
    global.fetch = jest.fn().mockResolvedValue({
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

    expect(global.fetch).toHaveBeenCalledWith("/file.csv", {
      method: "GET",
      headers: { Accept: "text/csv" },
      signal: expect.objectContaining({ aborted: false }),
    });
    expect(shareFetchedBlobInNativeAppMock).toHaveBeenCalledWith(
      expect.any(Blob),
      "file.csv"
    );
    await waitFor(() => expect(result.current.percentage).toBe(100));
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
    global.fetch = jest.fn().mockResolvedValue(response);

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
