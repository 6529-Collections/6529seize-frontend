import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  StrictMode,
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
  resolveIpfsUrlSync: (src: string) =>
    src.startsWith("ipfs://")
      ? `https://ipfs-gateway.test/ipfs/${src.slice(7)}`
      : src,
}));
jest.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }: { children: () => ReactNode }) => children(),
  TransformComponent: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/hooks/useFullScreenSupported", () => ({
  useFullScreenSupported: () => true,
}));

const source = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/large.gif";
const props = {
  src: source,
  imageRef: createRef<HTMLImageElement>(),
  onClose: jest.fn(),
  onDownload: jest.fn(),
  onFullscreen: jest.fn(),
  isDownloading: false,
};

it("only loads the original after an explicit HD action and can return to its preview", () => {
  render(<ImageMediaModal {...props} />);
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    source.replace("large.gif", "AUTOx1080_gifv2/large.gif")
  );
  const toggle = screen.getByRole("button", { name: "View original" });
  expect(toggle).toHaveAttribute("title", "View original");
  expect(toggle).toHaveAttribute("aria-pressed", "false");
  const toolbar = toggle.parentElement!;
  expect(within(toolbar).getAllByRole("button")[0]).toBe(toggle);
  expect(toolbar).toContainElement(
    screen.getByRole("button", { name: "Full screen" })
  );
  expect(toggle.textContent).toBe("");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("title", "View optimized");
  expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByAltText("Original GIF animation")).toHaveAttribute(
    "src",
    source
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "View optimized",
    })
  );
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
  expect(toggle).toHaveAttribute("aria-pressed", "false");
});

it("resets playback on gallery navigation, including when returning to the same GIF", () => {
  const { rerender } = render(<ImageMediaModal {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  rerender(
    <ImageMediaModal {...props} src={source.replace("large.gif", "next.gif")} />
  );
  expect(
    screen.getByRole("button", { name: "View original" })
  ).toBeInTheDocument();
  rerender(<ImageMediaModal {...props} />);
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
});

it("announces original-load failure and restores the preview with a retryable HD action", () => {
  render(<ImageMediaModal {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  fireEvent.error(screen.getByAltText("Original GIF animation"));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Couldn't load the original GIF"
  );
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  expect(screen.getByRole("img")).toHaveAttribute("src", source);
});

it("does not offer GIF playback for ordinary images or unsafe schemes", () => {
  const { rerender } = render(
    <ImageMediaModal {...props} src={source.replace("gif", "jpg")} />
  );
  expect(
    screen.queryByRole("button", { name: "View original" })
  ).not.toBeInTheDocument();
  rerender(<ImageMediaModal {...props} src="javascript:artwork.gif" />);
  expect(
    screen.queryByRole("button", { name: "View original" })
  ).not.toBeInTheDocument();
});

it("retains keyboard focus and announces each failure in the persistent alert", () => {
  render(
    <StrictMode>
      <ImageMediaModal {...props} />
    </StrictMode>
  );
  const button = screen.getByRole("button", { name: "View original" });
  const alert = screen.getByRole("alert");
  button.focus();
  for (let attempt = 0; attempt < 2; attempt++) {
    fireEvent.click(button);
    expect(button).toHaveAccessibleName("View optimized");
    expect(alert).toBeEmptyDOMElement();
    fireEvent.error(screen.getByAltText("Original GIF animation"));
    expect(screen.getByRole("alert")).toBe(alert);
    expect(alert).toHaveTextContent("Couldn't load the original GIF");
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAccessibleDescription(
      "Couldn't load the original GIF. You can try again."
    );
  }
});

it("keeps the HD action available when fullscreen is unavailable", () => {
  render(<ImageMediaModal {...props} fullscreenTargetAvailable={false} />);
  expect(
    screen.queryByRole("button", { name: "Full screen" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "View original" })
  ).toBeInTheDocument();
});

it("offers original playback for an IPFS GIF pathname", () => {
  render(<ImageMediaModal {...props} src="ipfs://bafyexample/art.gif" />);
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  expect(screen.getByAltText("Original GIF animation")).toHaveAttribute(
    "src",
    "https://ipfs-gateway.test/ipfs/bafyexample/art.gif"
  );
});
