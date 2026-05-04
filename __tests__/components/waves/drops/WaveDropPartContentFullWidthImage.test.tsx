import { fireEvent, render, screen } from "@testing-library/react";
import WaveDropPartContentFullWidthImage from "@/components/waves/drops/WaveDropPartContentFullWidthImage";

const downloadMock = jest.fn();

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (_src: string) => _src,
  ImageScale: { AUTOx450: "AUTOx450", AUTOx1080: "AUTOx1080" },
}));

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: () => ({ download: downloadMock }),
}));

beforeEach(() => {
  downloadMock.mockClear();
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

describe("WaveDropPartContentFullWidthImage", () => {
  it("downloads the original image from the modal button", () => {
    render(
      <WaveDropPartContentFullWidthImage src="https://example.com/path/image.png" />
    );

    fireEvent.click(screen.getByRole("button", { name: /open drop media/i }));
    fireEvent.click(screen.getByRole("button", { name: /download image/i }));

    expect(downloadMock).toHaveBeenCalledWith(
      "https://example.com/path/image.png",
      "image.png"
    );
  });
});
