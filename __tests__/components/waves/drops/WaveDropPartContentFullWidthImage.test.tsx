import { fireEvent, render, screen } from "@testing-library/react";
import WaveDropPartContentFullWidthImage from "@/components/waves/drops/WaveDropPartContentFullWidthImage";

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

beforeEach(() => {
  (globalThis as any).ResizeObserver = class {
    observe() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  };
});

describe("WaveDropPartContentFullWidthImage", () => {
  it("opens and closes the full-width image modal", () => {
    render(
      <WaveDropPartContentFullWidthImage src="https://example.com/path/image.png" />
    );

    fireEvent.click(screen.getByRole("button", { name: /open drop media/i }));
    expect(screen.getByAltText("Full size drop media")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });
});
