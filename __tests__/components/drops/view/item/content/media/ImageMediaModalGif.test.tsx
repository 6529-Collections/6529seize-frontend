import { fireEvent, render, screen } from "@testing-library/react";
import {
  createElement,
  createRef,
  forwardRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ImageMediaModal } from "@/components/drops/view/item/content/media/ImageMediaModal";

type MockImageProps = ComponentProps<"img"> & {
  fill?: boolean;
  unoptimized?: boolean;
};
jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...props }, ref) =>
      createElement("img", { ...props, ref, alt })
  ),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (src: string) => src,
}));
jest.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }: { children: () => ReactNode }) => children(),
  TransformComponent: ({ children }: { children: ReactNode }) => children,
}));
jest.mock(
  "@/components/drops/view/item/content/media/MediaActionToolbar",
  () => ({ ExpandedMediaToolbar: () => null })
);

const source = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/large.gif";
const props = {
  src: source,
  imageRef: createRef<HTMLImageElement>(),
  onClose: jest.fn(),
  onDownload: jest.fn(),
  onFullscreen: jest.fn(),
  isDownloading: false,
};

it("only loads the original after an explicit play action and can return to its preview", () => {
  render(<ImageMediaModal {...props} />);
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    source.replace("large.gif", "AUTOx1080_gifv2/large.gif")
  );
  fireEvent.click(screen.getByRole("button", { name: "Play original GIF" }));
  expect(screen.getByAltText("Original GIF animation")).toHaveAttribute(
    "src",
    source
  );
  fireEvent.click(screen.getByRole("button", { name: "Return to preview" }));
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
});

it("resets playback on gallery navigation, including when returning to the same GIF", () => {
  const { rerender } = render(<ImageMediaModal {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Play original GIF" }));
  rerender(
    <ImageMediaModal {...props} src={source.replace("large.gif", "next.gif")} />
  );
  expect(
    screen.getByRole("button", { name: "Play original GIF" })
  ).toBeInTheDocument();
  rerender(<ImageMediaModal {...props} />);
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
});

it("announces original-load failure and restores the preview with a retryable play action", () => {
  render(<ImageMediaModal {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Play original GIF" }));
  fireEvent.error(screen.getByAltText("Original GIF animation"));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Couldn't load the original GIF"
  );
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
  fireEvent.click(screen.getByRole("button", { name: "Play original GIF" }));
  expect(screen.getByRole("img")).toHaveAttribute("src", source);
});

it("does not offer GIF playback for ordinary images or unsafe schemes", () => {
  const { rerender } = render(
    <ImageMediaModal {...props} src={source.replace("gif", "jpg")} />
  );
  expect(
    screen.queryByRole("button", { name: "Play original GIF" })
  ).not.toBeInTheDocument();
  rerender(<ImageMediaModal {...props} src="javascript:artwork.gif" />);
  expect(
    screen.queryByRole("button", { name: "Play original GIF" })
  ).not.toBeInTheDocument();
});
