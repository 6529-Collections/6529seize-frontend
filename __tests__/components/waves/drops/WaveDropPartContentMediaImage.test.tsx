import { fireEvent, render, screen } from "@testing-library/react";
import WaveDropPartContentMediaImage from "@/components/waves/drops/WaveDropPartContentMediaImage";
import useCapacitor from "@/hooks/useCapacitor";

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (_src: string) => _src,
  ImageScale: { AUTOx450: "AUTOx450", AUTOx1080: "AUTOx1080" },
}));

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));

beforeEach(() => {
  (useCapacitor as jest.Mock).mockReturnValue({ isCapacitor: false });

  (globalThis as any).ResizeObserver = class {
    observe() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  };
});

describe("WaveDropPartContentMediaImage", () => {
  it("fills a reserved-height media container without natural aspect sizing", () => {
    const { container } = render(
      <WaveDropPartContentMediaImage
        src="https://example.com/path/image.png"
        fillContainer
      />
    );

    const outer = container.firstElementChild;
    const button = screen.getByRole("button", { name: /open drop media/i });
    const imageWrapper = button.firstElementChild;

    expect(outer).toHaveClass("tw-h-full");
    expect(button).toHaveClass("tw-h-full");
    expect(imageWrapper).toHaveClass("tw-h-full", "tw-w-full");
    expect(imageWrapper).not.toHaveStyle({ maxHeight: "16rem" });
  });

  it("opens and closes the image modal", () => {
    render(
      <WaveDropPartContentMediaImage src="https://example.com/path/image.png" />
    );

    fireEvent.click(screen.getByRole("button", { name: /open drop media/i }));
    expect(screen.getByAltText("Full size drop media")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });

  it("hides native fullscreen in Capacitor", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isCapacitor: true });
    const requestFullscreen = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLImageElement.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    render(
      <WaveDropPartContentMediaImage src="https://example.com/path/image.png" />
    );

    expect(
      screen.queryByRole("button", { name: /full screen/i })
    ).not.toBeInTheDocument();

    expect(requestFullscreen).not.toHaveBeenCalled();
  });
});
