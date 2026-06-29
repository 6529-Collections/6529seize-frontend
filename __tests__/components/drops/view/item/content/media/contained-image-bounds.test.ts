import {
  getContainedImageBounds,
  useContainedImageBoundsStyle,
} from "@/components/drops/view/item/content/media/containedImageBounds";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useLayoutEffect, useRef } from "react";

function BoundsProbe({
  getNaturalHeight,
  getNaturalWidth,
}: {
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

  useLayoutEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) {
      return;
    }

    container.getBoundingClientRect = jest.fn(() => ({
      bottom: 400,
      height: 400,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));
    Object.defineProperty(image, "naturalHeight", {
      configurable: true,
      get: getNaturalHeight,
    });
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      get: getNaturalWidth,
    });
  }, [getNaturalHeight, getNaturalWidth]);

  return createElement(
    "div",
    { ref: containerRef },
    createElement("img", { ref: imageRef, alt: "" }),
    createElement(
      "output",
      { "data-testid": "bounds-style" },
      JSON.stringify(boundsStyle)
    )
  );
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
});
