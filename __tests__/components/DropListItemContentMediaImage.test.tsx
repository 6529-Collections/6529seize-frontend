import { render, screen, fireEvent } from "@testing-library/react";
import React, { createElement, forwardRef, type ComponentProps } from "react";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...rest }, ref) =>
      createElement("img", {
        ...rest,
        ref,
        alt: alt ?? "",
        "data-nimg": _fill ? "fill" : undefined,
      })
  ),
}));

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

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ hasTouchScreen: false })),
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: () => [jest.fn(), true],
}));

beforeEach(() => {
  (useCapacitor as jest.Mock).mockReturnValue({ isCapacitor: false });
  (useDeviceInfo as jest.Mock).mockReturnValue({ hasTouchScreen: false });

  (globalThis as any).ResizeObserver = class {
    observe() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  };
});

describe("DropListItemContentMediaImage", () => {
  it("opens and closes the modal", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));
    const modalImage = screen.getByAltText("Full size drop media");
    expect(modalImage).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("modal-backdrop"));
    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });

  it("closes the modal when the backdrop is clicked", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));

    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });

  it("closes the modal when the expanded image letterbox area is clicked", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));

    const modalImage = screen.getByAltText("Full size drop media");
    Object.defineProperty(modalImage, "naturalWidth", {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(modalImage, "naturalHeight", {
      configurable: true,
      value: 50,
    });
    modalImage.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      toJSON: jest.fn(),
    }));

    fireEvent.click(modalImage, { clientX: 50, clientY: 10 });

    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });

  it("closes the modal when the rendered image area is clicked", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));

    const modalImage = screen.getByAltText("Full size drop media");
    Object.defineProperty(modalImage, "naturalWidth", {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(modalImage, "naturalHeight", {
      configurable: true,
      value: 50,
    });
    modalImage.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      toJSON: jest.fn(),
    }));

    fireEvent.click(modalImage, { clientX: 50, clientY: 50 });

    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });

  it("does not open modal when disableModal is true", () => {
    render(<DropListItemContentMediaImage src="img" disableModal />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(img);
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

    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);

    expect(
      screen.queryByRole("button", { name: /full screen/i })
    ).not.toBeInTheDocument();

    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("keeps desktop-hover actions mounted when image bounds are unmeasured", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);

    fireEvent.load(screen.getByAltText("Drop media"));

    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("exposes media actions from the modal after tapping on touch devices", () => {
    (useDeviceInfo as jest.Mock).mockReturnValue({ hasTouchScreen: true });

    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);

    fireEvent.load(screen.getByAltText("Drop media"));
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));

    expect(screen.getByAltText("Full size drop media")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Download media" }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders intrinsic-height images in a natural-height frame", () => {
    const { container } = render(
      <DropListItemContentMediaImage src="img" intrinsicHeight />
    );

    const wrapper = container.querySelector(".tw-relative.tw-flex");
    const img = screen.getByAltText("Drop media");
    const imageFrame = img.parentElement;

    expect(wrapper).toHaveClass("tw-w-full", "tw-min-h-40");
    expect(wrapper).not.toHaveClass("tw-h-full");
    expect(imageFrame).toHaveClass(
      "tw-min-h-40",
      "tw-rounded-xl",
      "tw-bg-iron-900/40"
    );
    expect(imageFrame?.getAttribute("style")).toContain("aspect-ratio: 16 / 9");
    expect(imageFrame?.getAttribute("style")).toContain("max-height: 16rem");
    expect(img).toHaveClass(
      "tw-object-contain",
      "tw-max-h-64",
      "tw-max-w-full"
    );
    expect(img).not.toHaveClass("tw-w-full");
    expect(img).not.toHaveClass("tw-max-h-full");
    expect(img).toHaveAttribute("data-nimg", "fill");
  });

  it("retries intrinsic-height images instead of swapping to the same fallback source", () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");

    render(
      <DropListItemContentMediaImage src="img" intrinsicHeight maxRetries={1} />
    );

    fireEvent.error(screen.getByAltText("Drop media"));
    fireEvent.error(screen.getByAltText("Drop media"));

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);

    setTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});

describe("DropListItemContentMediaImage retry", () => {
  it("shows error and retries manually", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={-1} />);
    expect(screen.getByText("Couldn’t load image.")).toBeInTheDocument();
  });
});
