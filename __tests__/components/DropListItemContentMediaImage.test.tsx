import { render, screen, fireEvent, within } from "@testing-library/react";
import React, { createElement, forwardRef, type ComponentProps } from "react";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
  readonly quality?: number | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, quality, alt, ...rest }, ref) =>
      createElement("img", {
        ...rest,
        ref,
        alt: alt ?? "",
        "data-nimg": _fill ? "fill" : undefined,
        "data-unoptimized": String(_unoptimized ?? false),
        "data-quality": quality,
      })
  ),
}));

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (src: string) => `${src}?preview`,
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
  it.each([
    ["jpg", "Original image"],
    ["gif", "Original GIF animation"],
  ])(
    "offers inline HD for %s artwork and shares its choice with the popup",
    (extension, originalAlt) => {
      const src = `https://d3lqz0a4bldqgf.cloudfront.net/drops/author/art.${extension}`;
      const { container } = render(
        <DropListItemContentMediaImage
          src={src}
          showOriginalQualityToggle
          preferHighQualityImage
        />
      );
      const inline = within(container);
      const preview = inline.getByAltText("Drop media");
      const toggle = inline.getByRole("button", { name: "View original" });
      expect(toggle.parentElement).toHaveClass(
        "tw-flex",
        "tw-pointer-events-auto"
      );
      expect(toggle.parentElement).not.toHaveClass("tw-hidden");
      expect(within(toggle.parentElement!).getAllByRole("button")[0]).toBe(
        toggle
      );
      expect(inline.queryByAltText(originalAlt)).toBeNull();
      fireEvent.load(preview);
      fireEvent.click(toggle);
      const original = inline.getByAltText(originalAlt);
      expect(original).toHaveAttribute("src", src);
      expect(original).toHaveAttribute("data-unoptimized", "true");
      expect(preview).toBeVisible();
      expect(original).not.toBeVisible();
      fireEvent.load(original);
      expect(original).toBeVisible();
      expect(preview).not.toBeVisible();
      expect(screen.queryByAltText("Expanded image preview")).toBeNull();
      fireEvent.click(
        inline.getByRole("button", { name: "Open image preview" })
      );
      const popupToggle = screen
        .getAllByRole("button", { name: "View optimized" })
        .at(-1)!;
      expect(popupToggle).toHaveAttribute("aria-pressed", "true");
      expect(within(popupToggle.parentElement!).getAllByRole("button")[0]).toBe(
        popupToggle
      );
      fireEvent.click(popupToggle);
      expect(
        inline.getByRole("button", { name: "View original" })
      ).toHaveAttribute("aria-pressed", "false");
      expect(preview).toBeVisible();
      expect(inline.queryByAltText(originalAlt)).toBeNull();
      fireEvent.click(screen.getByTestId("modal-backdrop"));
      expect(preview).toBeVisible();
    }
  );

  it("uses responsive high-quality still artwork by default and falls back to the CDN preview", () => {
    const src = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/photo.jpg";
    render(<DropListItemContentMediaImage src={src} preferHighQualityImage />);
    const image = screen.getByAltText("Drop media");
    expect(image).toHaveAttribute("src", src);
    expect(image).toHaveAttribute("data-quality", "100");
    expect(image).toHaveAttribute("data-unoptimized", "false");
    expect(image).toHaveAttribute("sizes", "(max-width: 1024px) 100vw, 896px");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", `${src}?preview`);
    expect(image).toHaveAttribute("data-unoptimized", "true");
  });

  it("restores the preview after an inline original failure and allows retry without opening a popup", () => {
    render(
      <DropListItemContentMediaImage
        src="https://example.com/photo.jpg"
        showOriginalQualityToggle
      />
    );
    const preview = screen.getByAltText("Drop media");
    fireEvent.load(preview);
    const toggle = screen.getByRole("button", { name: "View original" });
    toggle.focus();
    fireEvent.click(toggle);
    fireEvent.error(screen.getByAltText("Original image"));
    expect(preview).toBeVisible();
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAccessibleDescription(
      "Couldn't load the original image. You can try again."
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load the original image"
    );
    fireEvent.click(toggle);
    fireEvent.load(screen.getByAltText("Original image"));
    expect(screen.getByAltText("Original image")).toBeVisible();
    expect(preview).not.toBeVisible();
  });

  it("resets the artwork HD choice on source changes and omits it for unsafe URLs", () => {
    const { rerender } = render(
      <DropListItemContentMediaImage
        src="https://example.com/first.jpg"
        showOriginalQualityToggle
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "View original" }));
    fireEvent.load(screen.getByAltText("Original image"));
    rerender(
      <DropListItemContentMediaImage
        src="https://example.com/next.jpg"
        showOriginalQualityToggle
      />
    );
    expect(screen.queryByAltText("Original image")).toBeNull();
    expect(
      screen.getByRole("button", { name: "View original" })
    ).toHaveAttribute("aria-pressed", "false");
    rerender(
      <DropListItemContentMediaImage
        src="javascript:photo.jpg"
        showOriginalQualityToggle
      />
    );
    expect(screen.queryByRole("button", { name: "View original" })).toBeNull();
  });

  it("shows a GIF loading placeholder until ready and resets it for another source", () => {
    const { rerender } = render(
      <DropListItemContentMediaImage src="https://example.com/first.gif" />
    );
    const loader = screen.getByRole("status", { name: "Loading image" });
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveClass(
      "tw-pointer-events-none",
      "tw-left-0",
      "tw-top-0",
      "tw-w-64",
      "tw-max-w-full",
      "tw-max-h-64"
    );
    expect(loader.querySelector('[aria-hidden="true"]')).toHaveClass(
      "motion-safe:tw-animate-pulse"
    );
    fireEvent.load(screen.getByAltText("Drop media"));
    expect(
      screen.queryByRole("status", { name: "Loading image" })
    ).not.toBeInTheDocument();
    rerender(
      <DropListItemContentMediaImage src="https://example.com/second.GIF?version=2" />
    );
    expect(
      screen.getByRole("status", { name: "Loading image" })
    ).toBeInTheDocument();
  });

  it("does not add a GIF placeholder to static images", () => {
    render(
      <DropListItemContentMediaImage src="https://example.com/still.png" />
    );
    expect(
      screen.queryByRole("status", { name: "Loading image" })
    ).not.toBeInTheDocument();
  });

  it("replaces the placeholder on failure and restores it when retrying", () => {
    render(
      <DropListItemContentMediaImage src="https://example.com/failure.gif" />
    );
    fireEvent.error(screen.getByAltText("Drop media"));
    expect(
      screen.queryByRole("status", { name: "Loading image" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      screen.getByRole("status", { name: "Loading image" })
    ).toBeInTheDocument();
    fireEvent.load(screen.getByAltText("Drop media"));
    expect(
      screen.queryByRole("status", { name: "Loading image" })
    ).not.toBeInTheDocument();
  });

  it("keeps GIF quality controls in the popup and omits the inline preview badge", () => {
    render(<DropListItemContentMediaImage src="https://example.com/art.gif" />);
    fireEvent.load(screen.getByAltText("Drop media"));
    expect(screen.queryByText("GIF preview")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View original" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));
    expect(
      screen.getByRole("button", { name: "View original" })
    ).toBeInTheDocument();
  });

  it("opens and closes the modal", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));
    const modalImage = screen.getByAltText("Expanded image preview");
    expect(modalImage).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("modal-backdrop"));
    expect(
      screen.queryByAltText("Expanded image preview")
    ).not.toBeInTheDocument();
  });

  it("closes the modal when the backdrop is clicked", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));

    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(
      screen.queryByAltText("Expanded image preview")
    ).not.toBeInTheDocument();
  });

  it("closes the modal when the expanded image letterbox area is clicked", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));

    const modalImage = screen.getByAltText("Expanded image preview");
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
      screen.queryByAltText("Expanded image preview")
    ).not.toBeInTheDocument();
  });

  it("closes the modal when the rendered image area is clicked", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));

    const modalImage = screen.getByAltText("Expanded image preview");
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
      screen.queryByAltText("Expanded image preview")
    ).not.toBeInTheDocument();
  });

  it("does not open modal when disableModal is true", () => {
    render(<DropListItemContentMediaImage src="img" disableModal />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(img);
    expect(
      screen.queryByAltText("Expanded image preview")
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

    expect(screen.getByAltText("Expanded image preview")).toBeInTheDocument();
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
    expect(imageFrame).toHaveClass("tw-min-h-40", "tw-bg-iron-900/40");
    expect(imageFrame).not.toHaveClass("tw-rounded-xl");
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

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);

    setTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});

describe("DropListItemContentMediaImage retry", () => {
  it("keeps original actions available after a preview fails", () => {
    render(<DropListItemContentMediaImage src="img" />);
    fireEvent.error(screen.getByAltText("Drop media"));
    expect(screen.getByText("Preview unavailable")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
    expect(screen.queryByAltText("Drop media")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByAltText("Drop media")).toHaveAttribute(
      "src",
      "img?preview"
    );
  });
});
