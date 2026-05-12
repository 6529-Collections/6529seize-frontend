import { render, screen } from "@testing-library/react";
import DropPartMarkdownImage from "@/components/drops/view/part/DropPartMarkdownImage";

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaImage",
  () => ({
    __esModule: true,
    default: (props: { src: string; loadStrategy: string }) => (
      <div
        data-testid="standard-image-media"
        data-src={props.src}
        data-load-strategy={props.loadStrategy}
      />
    ),
  })
);

describe("DropPartMarkdownImage", () => {
  it("renders markdown images through the standard image media component", () => {
    render(<DropPartMarkdownImage src="/img.png" alt="alt" />);

    expect(screen.getByTestId("standard-image-media")).toHaveAttribute(
      "data-src",
      "/img.png"
    );
    expect(screen.getByTestId("standard-image-media")).toHaveAttribute(
      "data-load-strategy",
      "eager"
    );
  });
});
