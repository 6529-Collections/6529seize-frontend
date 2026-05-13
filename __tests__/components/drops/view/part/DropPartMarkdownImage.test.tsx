import { render, screen } from "@testing-library/react";
import DropPartMarkdownImage from "@/components/drops/view/part/DropPartMarkdownImage";

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaImage",
  () => ({
    __esModule: true,
    default: (props: {
      src: string;
      loadStrategy: string;
      intrinsicHeight?: boolean;
    }) => (
      <div
        data-testid="standard-image-media"
        data-src={props.src}
        data-load-strategy={props.loadStrategy}
        data-intrinsic-height={String(props.intrinsicHeight)}
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

  it("does not reserve the old fixed image height", () => {
    const { container } = render(<DropPartMarkdownImage src="/img.png" />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass("tw-relative", "tw-mt-2", "tw-w-full");
    expect(wrapper).not.toHaveClass("tw-h-64");
  });
});
