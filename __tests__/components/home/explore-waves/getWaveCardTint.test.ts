import { getWaveCardTint } from "@/components/home/explore-waves/getWaveCardTint";

function loadedImage(source: string) {
  const image = document.createElement("img");
  image.src = source;
  Object.defineProperties(image, {
    complete: { value: true },
    naturalWidth: { value: 400 },
    naturalHeight: { value: 600 },
  });
  return image;
}

describe("getWaveCardTint", () => {
  afterEach(() => jest.restoreAllMocks());

  it("samples the bottom half once per loaded URL and ignores transparent pixels", () => {
    const drawImage = jest.fn();
    const getImageData = jest.fn(() => ({
      data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 0]),
    }));
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
      getImageData,
    } as unknown as CanvasRenderingContext2D);
    const image = loadedImage("https://example.com/red-bottom.png");
    expect(getWaveCardTint(image)).toBe("58 7 7");
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 32, 32);
    expect(getImageData).toHaveBeenCalledWith(0, 16, 32, 16);
    expect(getWaveCardTint(image)).toBe("58 7 7");
    expect(getWaveCardTint(loadedImage(image.src))).toBe("58 7 7");
    expect(getImageData).toHaveBeenCalledTimes(1);
  });

  it("caches the fallback when pixel access is blocked without changing the image", () => {
    const getImageData = jest.fn(() => {
      throw new DOMException("Tainted canvas", "SecurityError");
    });
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: jest.fn(),
      getImageData,
    } as unknown as CanvasRenderingContext2D);
    const image = loadedImage("https://example.com/blocked.png");
    const markup = image.outerHTML;
    expect(getWaveCardTint(image)).toBeNull();
    expect(getWaveCardTint(image)).toBeNull();
    expect(getImageData).toHaveBeenCalledTimes(1);
    expect(image.outerHTML).toBe(markup);
  });

  it("keeps the fallback for empty pixels and unavailable canvas contexts", () => {
    const context = jest.spyOn(HTMLCanvasElement.prototype, "getContext");
    context.mockReturnValue(null);
    expect(
      getWaveCardTint(loadedImage("https://example.com/no-context.png"))
    ).toBeNull();
    context.mockReturnValue({
      drawImage: jest.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray([255, 255, 255, 0]) }),
    } as unknown as CanvasRenderingContext2D);
    expect(
      getWaveCardTint(loadedImage("https://example.com/transparent.png"))
    ).toBeNull();
  });

  it("waits for pixels before using the canvas", () => {
    const context = jest.spyOn(HTMLCanvasElement.prototype, "getContext");
    expect(getWaveCardTint(document.createElement("img"))).toBeNull();
    expect(context).not.toHaveBeenCalled();
  });
});
