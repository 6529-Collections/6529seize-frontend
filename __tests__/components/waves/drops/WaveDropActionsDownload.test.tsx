import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropActionsDownload from "@/components/waves/drops/WaveDropActionsDownload";

const mockDownload = jest.fn();
const mockCancel = jest.fn();
const mockShareFetchedBlobInNativeApp = jest.fn();
const mockUseDownloader = jest.fn(() => ({
  size: 0,
  elapsed: 0,
  percentage: 42,
  download: mockDownload,
  cancel: mockCancel,
  error: null,
  isInProgress: false,
}));

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: () => mockUseDownloader(),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/helpers/capacitorBlobDownload.helpers", () => ({
  shareFetchedBlobInNativeApp: (...args: any[]) =>
    mockShareFetchedBlobInNativeApp(...args),
}));

describe("WaveDropActionsDownload", () => {
  const originalFetch = globalThis.fetch;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click");

  beforeEach(() => {
    mockDownload.mockClear();
    mockCancel.mockClear();
    mockShareFetchedBlobInNativeApp.mockClear();
    anchorClickSpy.mockClear();
    mockUseDownloader.mockClear();
    mockUseDownloader.mockReturnValue({
      size: 0,
      elapsed: 0,
      percentage: 42,
      download: mockDownload,
      cancel: mockCancel,
      error: null,
      isInProgress: false,
    });
    globalThis.fetch = jest.fn();
    URL.createObjectURL = jest.fn(() => "blob:media");
    URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    anchorClickSpy.mockRestore();
  });

  it("starts download on button click when not in progress", async () => {
    const user = userEvent.setup();
    render(
      <WaveDropActionsDownload
        href="/file"
        name="test"
        extension="txt"
        tooltipId="download-media-1"
      />
    );
    const button = screen.getByRole("button", { name: /download file/i });
    await user.click(button);
    expect(mockDownload).toHaveBeenCalledWith("/file", "test.txt");
  });

  it("cancels download when in progress on button click", async () => {
    const user = userEvent.setup();
    mockUseDownloader.mockReturnValueOnce({
      size: 0,
      elapsed: 0,
      percentage: 55,
      download: mockDownload,
      cancel: mockCancel,
      error: null,
      isInProgress: true,
    });
    render(
      <WaveDropActionsDownload
        href="/file"
        name="test"
        extension="txt"
        tooltipId="download-media-1"
      />
    );
    const button = screen.getByRole("button", { name: /download file/i });
    await user.click(button);
    expect(mockCancel).toHaveBeenCalled();
  });

  it("downloads mobile media with the attachment-preview blob flow", async () => {
    const user = userEvent.setup();
    const onDownload = jest.fn();
    const blob = new Blob(["media"]);
    jest.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockResolvedValue(blob),
    } as any);

    render(
      <WaveDropActionsDownload
        href="https://example.com/media.png"
        name="media"
        extension="png"
        isMobile
        showProgress={false}
        onDownload={onDownload}
      />
    );

    await user.click(screen.getByRole("button", { name: /download media/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://example.com/media.png",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(anchorClickSpy).toHaveBeenCalled();
      expect(onDownload).toHaveBeenCalled();
    });
  });
});
