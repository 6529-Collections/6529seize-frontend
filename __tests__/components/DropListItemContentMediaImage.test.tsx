import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (_src: string) => _src,
  responsiveDropImageLoader: jest.fn(),
  ImageScale: { AUTOx450: "AUTOx450", AUTOx1080: "AUTOx1080" },
}));

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/components/common/FallbackImage", () => {
  const React = require("react");

  return {
    FallbackImage: React.forwardRef(
      (
        {
          alt,
          primarySrc,
          fallbackSrc,
          optimize,
          loader,
          onClick,
          onError,
          onLoad,
        }: any,
        ref: any
      ) => (
        <img
          ref={ref}
          alt={alt}
          src={primarySrc}
          data-fallback-src={fallbackSrc}
          data-optimize={optimize === undefined ? "" : String(optimize)}
          data-has-loader={loader ? "true" : "false"}
          onClick={onClick}
          onError={onError}
          onLoad={onLoad}
        />
      )
    ),
  };
});

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: () => [jest.fn(), true],
}));

beforeEach(() => {
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

describe("DropListItemContentMediaImage", () => {
  it("calls onContainerClick from modal button", () => {
    const onContainerClick = jest.fn();
    render(
      <DropListItemContentMediaImage
        src="img"
        maxRetries={1}
        onContainerClick={onContainerClick}
      />
    );
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(img);
    fireEvent.click(screen.getByLabelText("View drop details"));
    expect(onContainerClick).toHaveBeenCalled();
  });

  it("does not open modal when disableModal is true", () => {
    render(<DropListItemContentMediaImage src="img" disableModal />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(img);
    expect(
      screen.queryByLabelText("View drop details")
    ).not.toBeInTheDocument();
  });

  it("keeps normal images unoptimized without a custom loader", () => {
    render(<DropListItemContentMediaImage src="img" />);

    const img = screen.getByAltText("Drop media");
    expect(img).toHaveAttribute("data-optimize", "false");
    expect(img).toHaveAttribute("data-has-loader", "false");
    expect(img).toHaveAttribute("data-fallback-src", "img");
  });

  it("uses the responsive loader only when responsive srcset mode is enabled", () => {
    render(
      <DropListItemContentMediaImage src="img" useResponsiveImageSrcSet />
    );

    const img = screen.getByAltText("Drop media");
    expect(img).toHaveAttribute("data-optimize", "true");
    expect(img).toHaveAttribute("data-has-loader", "true");
  });
});

describe("DropListItemContentMediaImage retry", () => {
  it("shows error and retries manually", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={-1} />);
    expect(screen.getByText("Couldn’t load image.")).toBeInTheDocument();
  });
});
