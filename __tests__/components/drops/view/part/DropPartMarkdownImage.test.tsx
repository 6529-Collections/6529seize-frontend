import { render, screen } from "@testing-library/react";
import DropPartMarkdownImage, {
  DropPartMarkdownImageGroup,
} from "@/components/drops/view/part/DropPartMarkdownImage";

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaImage",
  () => ({
    __esModule: true,
    default: (props: {
      src: string;
      loadStrategy: string;
      intrinsicHeight?: boolean;
      galleryItemId?: string;
    }) => (
      <div
        data-testid="standard-image-media"
        data-src={props.src}
        data-load-strategy={props.loadStrategy}
        data-intrinsic-height={String(props.intrinsicHeight)}
        data-gallery-item-id={props.galleryItemId}
      />
    ),
  })
);

describe("DropPartMarkdownImage", () => {
  it("renders markdown images through the standard image media component", () => {
    render(<DropPartMarkdownImage src="/img.png" />);

    expect(screen.getByTestId("standard-image-media")).toHaveAttribute(
      "data-src",
      "/img.png"
    );
    expect(screen.getByTestId("standard-image-media")).toHaveAttribute(
      "data-load-strategy",
      "eager"
    );
    expect(screen.getByTestId("standard-image-media")).toHaveAttribute(
      "data-intrinsic-height",
      "true"
    );
  });

  it("passes the gallery item id to the standard image media component", () => {
    render(
      <DropPartMarkdownImage
        src="/img.png"
        galleryItemId="drop-image-gallery:body:0:/img.png"
      />
    );

    expect(screen.getByTestId("standard-image-media")).toHaveAttribute(
      "data-gallery-item-id",
      "drop-image-gallery:body:0:/img.png"
    );
  });

  it("does not reserve the old fixed image height", () => {
    const { container } = render(<DropPartMarkdownImage src="/img.png" />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass("tw-relative", "tw-mt-2", "tw-w-full");
    expect(wrapper).not.toHaveClass("tw-h-64");
  });

  it("removes standalone spacing when rendered inside an image group", () => {
    const { container } = render(
      <DropPartMarkdownImage src="/img.png" layout="grouped" />
    );
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass("tw-relative", "tw-min-w-0", "tw-w-full");
    expect(wrapper).not.toHaveClass("tw-mt-2");
    expect(wrapper).not.toHaveClass("tw-h-64");
  });

  it("lays out grouped images as one-column mobile and responsive desktop grid", () => {
    const { container } = render(
      <DropPartMarkdownImageGroup>
        <DropPartMarkdownImage src="/one.png" layout="grouped" />
        <DropPartMarkdownImage src="/two.png" layout="grouped" />
      </DropPartMarkdownImageGroup>
    );
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass(
      "tw-mt-2",
      "tw-grid",
      "tw-w-full",
      "tw-grid-cols-1",
      "tw-gap-2",
      "sm:tw-grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),16rem))]"
    );
  });
});
