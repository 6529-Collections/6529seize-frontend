import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement, forwardRef, type ComponentProps } from "react";
import { DropImagePreview } from "@/components/drops/view/item/content/media/DropImagePreview";
import { ImageScale } from "@/helpers/image.helpers";

type MockImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean;
  readonly unoptimized?: boolean;
  readonly quality?: number;
};
jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized, quality, alt, ...props }, ref) =>
      createElement("img", {
        ...props,
        ref,
        alt,
        "data-unoptimized": String(unoptimized),
        "data-quality": quality,
      })
  ),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (src: string) =>
    src.replace("ipfs://", "https://gateway.example/"),
}));

const original = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/file.jpg";
const preview = (size: string) =>
  original.replace("file.jpg", `${size}/file.jpg`);

it.each(["JPG", "jpeg", "png", "webp", "avif"])(
  "allows first-party %s artwork as a high-quality optimizer source",
  (extension) => {
    const src = original.replace("jpg", extension) + "?version=2";
    render(
      <DropImagePreview
        originalSrc={src}
        imageScale={ImageScale.AUTOx1080}
        alt="Artwork"
        fill
        preferHighQuality
      />
    );
    const image = screen.getByAltText("Artwork");
    expect(image).toHaveAttribute("src", src);
    expect(image).toHaveAttribute("data-unoptimized", "false");
    expect(image).toHaveAttribute("data-quality", "100");
  }
);

it.each([
  original.replace("jpg", "gif"),
  original.replace("jpg", "svg"),
  "https://example.com/drops/file.jpg",
  "https://d3lqz0a4bldqgf.cloudfront.net/images/file.jpg",
  "https://d3lqz0a4bldqgf.cloudfront.net.evil.test/drops/file.jpg",
  "http://d3lqz0a4bldqgf.cloudfront.net/drops/file.jpg",
  "javascript:photo.jpg",
])("leaves other media and hosts on the existing preview path: %s", (src) => {
  render(
    <DropImagePreview
      originalSrc={src}
      imageScale={ImageScale.AUTOx1080}
      alt="Artwork"
      fill
      preferHighQuality
    />
  );
  const image = screen.queryByAltText("Artwork");
  expect(image?.getAttribute("src")).not.toBe(src);
  if (image) {
    expect(image).toHaveAttribute("data-unoptimized", "true");
    expect(image).not.toHaveAttribute("data-quality");
  }
});

it("tries only bounded previews and reports exhaustion once", () => {
  const onError = jest.fn();
  render(
    <DropImagePreview
      originalSrc={original}
      imageScale={ImageScale.AUTOx1080}
      alt="Artwork"
      fill
      onError={onError}
    />
  );
  const status = screen.getByRole("status");
  expect(status).toBeEmptyDOMElement();
  expect(screen.getByAltText("Artwork")).toHaveAttribute(
    "src",
    preview("AUTOx1080")
  );
  fireEvent.error(screen.getByAltText("Artwork"));
  expect(screen.getByAltText("Artwork")).toHaveAttribute(
    "src",
    preview("AUTOx450")
  );
  expect(onError).not.toHaveBeenCalled();
  fireEvent.error(screen.getByAltText("Artwork"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent("Preview unavailable");
  expect(onError).toHaveBeenCalledTimes(1);
});

it("counts repeated errors from the same rendered preview only once", () => {
  const onError = jest.fn();
  render(
    <DropImagePreview
      originalSrc={original}
      imageScale={ImageScale.AUTOx1080}
      alt="Artwork"
      fill
      onError={onError}
    />
  );
  const failTwice = () => {
    const image = screen.getByAltText("Artwork");
    act(() => {
      fireEvent.error(image);
      fireEvent.error(image);
    });
  };
  failTwice();
  expect(screen.getByAltText("Artwork")).toHaveAttribute(
    "src",
    preview("AUTOx450")
  );
  expect(onError).not.toHaveBeenCalled();
  failTwice();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it.each([
  "http://unknown.example/huge.jpg",
  "https://localhost/private.png",
  "data:image/png;base64,AAAA",
])("does not fetch unbounded source %s", (src) => {
  render(
    <DropImagePreview
      originalSrc={src}
      imageScale={ImageScale.AUTOx450}
      alt="Artwork"
      fill
    />
  );
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Preview unavailable");
});

it("resets failed previews when the gallery source changes", () => {
  const { rerender } = render(
    <DropImagePreview
      originalSrc={original}
      imageScale={ImageScale.AUTOx450}
      alt="Artwork"
      fill
    />
  );
  fireEvent.error(screen.getByAltText("Artwork"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  rerender(
    <DropImagePreview
      originalSrc={original.replace("file.jpg", "next.gif")}
      imageScale={ImageScale.AUTOx450}
      alt="Artwork"
      fill
    />
  );
  expect(screen.getByAltText("Artwork")).toHaveAttribute(
    "src",
    preview("AUTOx450_gifv2").replace("file.jpg", "next.gif")
  );
});

it.each([
  "https://external.example/image.jpg",
  "ipfs://artwork/image.gif",
  original.replace("jpg", "svg"),
])(
  "uses a server-generated preview for %s instead of hiding the image or loading its original",
  (src) => {
    render(
      <DropImagePreview
        originalSrc={src}
        imageScale={ImageScale.AUTOx450}
        alt="Artwork"
        fill
      />
    );
    const imageSrc = screen.getByAltText("Artwork").getAttribute("src")!;
    expect(imageSrc).toMatch(/^\/api\/og-metadata\/image\?/);
    const query = new URL(imageSrc, "https://6529.io").searchParams;
    expect(query.get("url")).toBe(
      src.replace("ipfs://", "https://gateway.example/")
    );
    expect(query.get("w")).toBe("800");
    fireEvent.error(screen.getByAltText("Artwork"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  }
);

it("falls back from a rejected GIF animation to a legacy preview, never the original", () => {
  const gif = original.replace("file.jpg", "artwork.gif");
  render(
    <DropImagePreview
      originalSrc={gif}
      imageScale={ImageScale.AUTOx450}
      alt="GIF"
      fill
    />
  );
  expect(screen.getByAltText("GIF")).toHaveAttribute(
    "src",
    gif.replace("artwork.gif", "AUTOx450_gifv2/artwork.gif")
  );
  fireEvent.error(screen.getByAltText("GIF"));
  expect(screen.getByAltText("GIF")).toHaveAttribute(
    "src",
    gif.replace("artwork.gif", "AUTOx450/artwork.gif")
  );
  fireEvent.error(screen.getByAltText("GIF"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
