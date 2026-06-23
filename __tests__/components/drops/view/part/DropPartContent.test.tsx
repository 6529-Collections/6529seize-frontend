import { forwardRef, type ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DropPartContent from "@/components/drops/view/part/DropPartContent";

let markdownProps: any;

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...rest }, ref) => (
      <img ref={ref} alt={alt ?? ""} {...rest} />
    )
  ),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));

jest.mock("@/components/drops/view/part/DropPartMarkdown", () => ({
  __esModule: true,
  default: (props: any) => {
    markdownProps = props;
    return <div data-testid="markdown" />;
  },
}));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => {
    function MockDropListItemContentMedia(props: any) {
      const { useDropImageGallery } = jest.requireActual(
        "@/components/drops/view/part/DropImageGalleryProvider"
      );
      const gallery = useDropImageGallery();

      return (
        <button
          type="button"
          data-testid="media"
          data-src={props.media_url}
          data-gallery-item-id={props.galleryItemId}
          onClick={() => {
            if (props.galleryItemId) {
              gallery?.openImage(props.galleryItemId);
            }
          }}
        >
          Open media
        </button>
      );
    }

    return {
      __esModule: true,
      default: MockDropListItemContentMedia,
    };
  }
);

const baseProps = {
  mentionedUsers: [],
  referencedNfts: [],
  partContent: "text",
  onQuoteClick: jest.fn(),
  currentDropId: "drop-1",
  currentPartCount: 1,
};

beforeEach(() => {
  markdownProps = undefined;
});

it("renders markdown and medias", () => {
  render(
    <DropPartContent
      {...baseProps}
      partMedias={[{ mimeType: "image/png", mediaSrc: "u" }]}
    />
  );
  expect(screen.getByTestId("markdown")).toBeInTheDocument();
  expect(screen.getByTestId("media")).toHaveAttribute("data-src", "u");
  expect(screen.getByTestId("media")).toHaveAttribute(
    "data-gallery-item-id",
    "drop-image-gallery:media:0:u"
  );
  expect(markdownProps.currentDropId).toBe("drop-1");
});

it("omits media container when none", () => {
  const { container } = render(
    <DropPartContent {...baseProps} partMedias={[]} />
  );
  expect(container.querySelectorAll('[data-testid="media"]').length).toBe(0);
});

it("opens duplicate uploaded image URLs at the clicked item", () => {
  render(
    <DropPartContent
      {...baseProps}
      partMedias={[
        { mimeType: "image/png", mediaSrc: "duplicate.png" },
        { mimeType: "image/png", mediaSrc: "duplicate.png" },
      ]}
    />
  );

  const mediaButtons = screen.getAllByTestId("media");
  fireEvent.click(mediaButtons[1]!);

  expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
    "src",
    "duplicate.png"
  );
  expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
    "2 / 2"
  );
});
