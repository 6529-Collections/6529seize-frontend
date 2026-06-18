import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Download from "@/components/download/Download";

const mockDownload = jest.fn();
const mockCancel = jest.fn();
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

describe("Download", () => {
  beforeEach(() => {
    mockDownload.mockClear();
    mockCancel.mockClear();
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
  });

  it("starts download on button click when not in progress", async () => {
    render(<Download href="/file" name="test" extension="txt" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Download file" })
    );
    expect(mockDownload).toHaveBeenCalledWith("/file", "test.txt");
  });

  it("shows progress and cancels when in progress", async () => {
    mockUseDownloader.mockReturnValueOnce({
      size: 0,
      elapsed: 0,
      percentage: 55,
      download: mockDownload,
      cancel: mockCancel,
      error: null,
      isInProgress: true,
    });
    render(<Download href="/file" name="test" extension="txt" />);
    expect(screen.getByText(/Downloading 55/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Cancel download" })
    );
    expect(mockCancel).toHaveBeenCalled();
  });

  it("uses custom labels for visible and accessible download states", async () => {
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
      <Download
        href="/file"
        name="test"
        extension="txt"
        labels={{
          cancelDownload: "Custom cancel",
          downloadingFile: "Custom downloading file",
          downloadingProgress: (percentage) => `Custom ${percentage}%`,
        }}
      />
    );

    expect(
      screen.getByLabelText("Custom downloading file")
    ).toBeInTheDocument();
    expect(screen.getByText("Custom 55%")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Custom cancel" })
    ).toBeInTheDocument();
  });
});
