import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { forwardRef, type ComponentProps } from "react";

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
  readonly loader?:
    | ((props: {
        readonly src: string;
        readonly width: number;
        readonly quality?: number | undefined;
      }) => string)
    | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized, loader, alt, src, ...rest }, ref) => {
      const shouldUseLoader =
        typeof src === "string" && !!loader && !unoptimized;
      const renderedSrc = shouldUseLoader ? loader({ src, width: 1080 }) : src;
      const srcSet = shouldUseLoader
        ? `${loader({ src, width: 450 })} 450w, ${loader({
            src,
            width: 1080,
          })} 1080w`
        : undefined;

      return (
        <img
          ref={ref}
          alt={alt ?? ""}
          src={renderedSrc}
          srcSet={srcSet}
          data-unoptimized={unoptimized ? "true" : "false"}
          {...rest}
        />
      );
    }
  ),
}));

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
}));

import { FallbackImage } from "../../../components/common/FallbackImage";
import { responsiveDropImageLoader } from "@/helpers/image.helpers";

describe("FallbackImage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("falls back without logging to the console", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const onPrimaryError = jest.fn();

    render(
      <FallbackImage
        primarySrc="primary.gif"
        fallbackSrc="fallback.gif"
        alt="fallback example"
        onPrimaryError={onPrimaryError}
      />
    );

    const image = screen.getByRole("img", { name: "fallback example" });
    expect(image).toHaveAttribute("src", "primary.gif");

    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute("src", "fallback.gif");
    });

    expect(onPrimaryError).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("calls onError when both primary and fallback fail", async () => {
    const onPrimaryError = jest.fn();
    const onError = jest.fn();

    render(
      <FallbackImage
        primarySrc="primary.gif"
        fallbackSrc="fallback.gif"
        alt="fallback example"
        onPrimaryError={onPrimaryError}
        onError={onError}
      />
    );

    const image = screen.getByRole("img", { name: "fallback example" });

    fireEvent.error(image);
    await waitFor(() => {
      expect(image).toHaveAttribute("src", "fallback.gif");
    });

    fireEvent.error(image);

    expect(onPrimaryError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("resets fallback state when the primary source changes", async () => {
    const { rerender } = render(
      <FallbackImage
        primarySrc="primary-a.gif"
        fallbackSrc="fallback-a.gif"
        alt="rerender fallback example"
      />
    );

    const image = screen.getByRole("img", {
      name: "rerender fallback example",
    });
    expect(image).toHaveAttribute("src", "primary-a.gif");

    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute("src", "fallback-a.gif");
    });

    rerender(
      <FallbackImage
        primarySrc="primary-b.gif"
        fallbackSrc="fallback-b.gif"
        alt="rerender fallback example"
      />
    );

    const resetImage = screen.getByRole("img", {
      name: "rerender fallback example",
    });
    expect(resetImage).toHaveAttribute("src", "primary-b.gif");
  });

  it("uses the custom loader for responsive primary urls and direct fallback urls", async () => {
    const primarySrc =
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/drop-id/AUTOx450/art.png";
    const fallbackSrc =
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/drop-id/art.png";

    render(
      <FallbackImage
        primarySrc={primarySrc}
        fallbackSrc={fallbackSrc}
        alt="responsive fallback example"
        optimize={true}
        loader={responsiveDropImageLoader}
        sizes="(max-width: 767px) 100vw, 33vw"
      />
    );

    const image = screen.getByRole("img", {
      name: "responsive fallback example",
    });

    expect(image).toHaveAttribute(
      "src",
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/drop-id/AUTOx1080/art.png"
    );
    expect(image).toHaveAttribute(
      "srcset",
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/drop-id/AUTOx450/art.png 450w, https://d3lqz0a4bldqgf.cloudfront.net/drops/drop-id/AUTOx1080/art.png 1080w"
    );
    expect(image.getAttribute("srcset")).not.toContain("/_next/image");

    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute("src", fallbackSrc);
    });

    expect(image).not.toHaveAttribute("srcset");
    expect(image).toHaveAttribute("data-unoptimized", "true");
  });
});
