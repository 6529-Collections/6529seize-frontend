import {
  getContainedImageBounds,
  useContainedImageBoundsStyle,
} from "@/components/drops/view/item/content/media/containedImageBounds";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useLayoutEffect, useRef } from "react";

type ResizeObserverHarness = {
  readonly restore: () => void;
  readonly trigger: () => void;
};

const installResizeObserverMock = (): ResizeObserverHarness => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const callbacks: ResizeObserverCallback[] = [];

  globalThis.ResizeObserver = jest
    .fn()
    .mockImplementation((callback: ResizeObserverCallback) => {
      callbacks.push(callback);
      return {
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;

  return {
    restore: () => {
      globalThis.ResizeObserver = originalResizeObserver;
    },
    trigger: () => {
      for (const callback of callbacks) {
        callback([], {} as ResizeObserver);
      }
    },
  };
};

const getDefaultContainerRect = () =>
  createContainerRect({ height: 400, width: 1000 });

function BoundsProbe({
  getContainerRect = getDefaultContainerRect,
  getNaturalHeight,
  getNaturalWidth,
}: {
  readonly getContainerRect?: () => DOMRect;
  readonly getNaturalHeight: () => number;
  readonly getNaturalWidth: () => number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const boundsStyle = useContainedImageBoundsStyle({
    containerRef,
    imageRef,
    loaded: true,
    objectPosition: "center",
  });
  const renderCount = useRef(0);
  renderCount.current += 1;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) {
      return;
    }

    container.getBoundingClientRect = jest.fn(getContainerRect);
    Object.defineProperty(image, "naturalHeight", {
      configurable: true,
      get: getNaturalHeight,
    });
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      get: getNaturalWidth,
    });
  }, [getContainerRect, getNaturalHeight, getNaturalWidth]);

  return createElement(
    "div",
    { ref: containerRef },
    createElement("img", { ref: imageRef, alt: "" }),
    createElement(
      "output",
      { "data-testid": "render-count" },
      String(renderCount.current)
    ),
    createElement(
      "output",
      { "data-testid": "bounds-style" },
      JSON.stringify(boundsStyle)
    )
  );
}

function createContainerRect({
  height,
  width,
}: {
  readonly height: number;
  readonly width: number;
}): DOMRect {
  return {
    bottom: height,
    height,
    left: 0,
    right: width,
    top: 0,
    width,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  } as DOMRect;
}

describe("getContainedImageBounds", () => {
  it("anchors left-top positioned contained images to the container origin", () => {
    expect(
      getContainedImageBounds({
        containerHeight: 400,
        containerWidth: 1000,
        naturalHeight: 400,
        naturalWidth: 500,
        objectPosition: "left top",
      })
    ).toEqual({
      height: 400,
      left: 0,
      top: 0,
      width: 500,
    });
  });

  it("centers contained images when object position is centered", () => {
    expect(
      getContainedImageBounds({
        containerHeight: 400,
        containerWidth: 1000,
        naturalHeight: 400,
        naturalWidth: 500,
        objectPosition: "center",
      })
    ).toEqual({
      height: 400,
      left: 250,
      top: 0,
      width: 500,
    });
  });

  it("retries measurement until image natural dimensions are available", async () => {
    let naturalWidthReads = 0;
    const getNaturalWidth = jest.fn(() => {
      naturalWidthReads += 1;
      return naturalWidthReads === 1 ? 0 : 500;
    });

    render(
      createElement(BoundsProbe, {
        getNaturalHeight: () => 400,
        getNaturalWidth,
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId("bounds-style")).toHaveTextContent(
        '"width":"500px"'
      );
    });
    expect(getNaturalWidth).toHaveBeenCalledTimes(2);
  });

  it("keeps the current style when resize observation reports unchanged bounds", async () => {
    const resizeObserver = installResizeObserverMock();
    const getNaturalWidth = jest.fn(() => 500);

    try {
      render(
        createElement(BoundsProbe, {
          getNaturalHeight: () => 400,
          getNaturalWidth,
        })
      );

      await waitFor(() => {
        expect(screen.getByTestId("bounds-style")).toHaveTextContent(
          '"width":"500px"'
        );
      });

      const measuredRenderCount =
        screen.getByTestId("render-count").textContent ?? "";
      const measuredNaturalWidthReads = getNaturalWidth.mock.calls.length;

      act(() => {
        resizeObserver.trigger();
      });

      await waitFor(() => {
        expect(getNaturalWidth).toHaveBeenCalledTimes(
          measuredNaturalWidthReads + 1
        );
        expect(screen.getByTestId("bounds-style")).toHaveTextContent(
          '"left":"250px"'
        );
      });
      const repeatedNaturalWidthReads = getNaturalWidth.mock.calls.length;

      act(() => {
        resizeObserver.trigger();
      });

      await waitFor(() => {
        expect(getNaturalWidth).toHaveBeenCalledTimes(
          repeatedNaturalWidthReads + 1
        );
        expect(screen.getByTestId("bounds-style")).toHaveTextContent(
          '"left":"250px"'
        );
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent(
        measuredRenderCount
      );
    } finally {
      resizeObserver.restore();
    }
  });

  it("updates the current style when resize observation reports changed bounds", async () => {
    const resizeObserver = installResizeObserverMock();
    let containerWidth = 1000;
    const getNaturalWidth = jest.fn(() => 500);

    try {
      render(
        createElement(BoundsProbe, {
          getContainerRect: () =>
            createContainerRect({ height: 400, width: containerWidth }),
          getNaturalHeight: () => 400,
          getNaturalWidth,
        })
      );

      await waitFor(() => {
        expect(screen.getByTestId("bounds-style")).toHaveTextContent(
          '"left":"250px"'
        );
      });

      const measuredRenderCount = Number(
        screen.getByTestId("render-count").textContent ?? "0"
      );
      const measuredNaturalWidthReads = getNaturalWidth.mock.calls.length;

      containerWidth = 800;
      act(() => {
        resizeObserver.trigger();
      });

      await waitFor(() => {
        expect(getNaturalWidth).toHaveBeenCalledTimes(
          measuredNaturalWidthReads + 1
        );
        expect(screen.getByTestId("bounds-style")).toHaveTextContent(
          '"left":"150px"'
        );
      });
      expect(Number(screen.getByTestId("render-count").textContent)).toBe(
        measuredRenderCount + 1
      );
    } finally {
      resizeObserver.restore();
    }
  });
});
