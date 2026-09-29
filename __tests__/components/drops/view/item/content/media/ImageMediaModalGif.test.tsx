import { act, fireEvent, render, screen, within } from "@testing-library/react";
import {
  StrictMode,
  createElement,
  createRef,
  forwardRef,
  type ComponentProps,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { ImageMediaModal } from "@/components/drops/view/item/content/media/ImageMediaModal";

type MockImageProps = ComponentProps<"img"> & {
  fill?: boolean;
  unoptimized?: boolean;
};
const mockImageRender = jest.fn<void, [MockImageProps]>();
jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, ...props }, ref) => {
      mockImageRender(props);
      return createElement("img", { ...props, ref });
    }
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
  const preview = screen.getByAltText("Expanded image preview");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("title", "View optimized");
  expect(toggle).toHaveAttribute("aria-pressed", "true");
  const original = screen.getByAltText("Original GIF animation");
  expect(original).toHaveAttribute("src", source);
  expect(original).not.toBeVisible();
  expect(preview).toBeVisible();
  expect(props.imageRef.current).toBe(preview);
  expect(
    screen.getByRole("status", { name: "Loading original GIF" })
  ).toBeInTheDocument();
  fireEvent.load(original);
  expect(original).toBeVisible();
  expect(preview).not.toBeVisible();
  expect(props.imageRef.current).toBe(original);
  expect(
    screen.queryByRole("status", { name: "Loading original GIF" })
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", {
      name: "View optimized",
    })
  );
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
  expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByAltText("Expanded image preview")).toBe(preview);
  expect(preview).toBeVisible();
  expect(props.imageRef.current).toBe(preview);
});

it("resets playback on gallery navigation, including when returning to the same GIF", () => {
  const { rerender } = render(<ImageMediaModal {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  fireEvent.load(screen.getByAltText("Original GIF animation"));
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
  const preview = screen.getByAltText("Expanded image preview");
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  fireEvent.error(screen.getByAltText("Original GIF animation"));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Couldn't load the original GIF"
  );
  expect(screen.getByRole("img")).not.toHaveAttribute("src", source);
  expect(screen.getByRole("img")).toBe(preview);
  expect(
    screen.queryByRole("status", { name: "Loading original GIF" })
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  fireEvent.load(screen.getByAltText("Original GIF animation"));
  expect(screen.getByRole("img")).toHaveAttribute("src", source);
});

it("ignores late original events after cancelling or navigating, including a new request for the same GIF", () => {
  const { rerender } = render(<ImageMediaModal {...props} />);
  for (const cancel of ["toggle", "gallery"]) {
    fireEvent.click(screen.getByRole("button", { name: "View original" }));
    const staleImage = screen.getByAltText("Original GIF animation");
    const stale = mockImageRender.mock.calls
      .filter(([image]) => image.alt === "Original GIF animation")
      .at(-1)![0];
    if (cancel === "toggle") {
      fireEvent.click(screen.getByRole("button", { name: "View optimized" }));
    } else {
      rerender(
        <ImageMediaModal
          {...props}
          src={source.replace("large.gif", "next.gif")}
        />
      );
      rerender(<ImageMediaModal {...props} />);
    }
    expect(
      screen.queryByRole("status", { name: "Loading original GIF" })
    ).toBeNull();
    expect(staleImage).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View original" }));
    const currentImage = screen.getByAltText("Original GIF animation");
    expect(currentImage).not.toBe(staleImage);
    // Native events belong to the detached old node, not the newly mounted
    // image for the same URL. Also exercise callbacks already queued by Next.
    fireEvent.load(staleImage);
    fireEvent.error(staleImage);
    act(() => {
      stale.onLoad?.({} as SyntheticEvent<HTMLImageElement>);
      stale.onError?.({} as SyntheticEvent<HTMLImageElement>);
    });
    expect(screen.getByAltText("Expanded image preview")).toBeVisible();
    expect(screen.getByAltText("Original GIF animation")).not.toBeVisible();
    expect(
      screen.getByRole("status", { name: "Loading original GIF" })
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    fireEvent.load(screen.getByAltText("Original GIF animation"));
    expect(screen.getByAltText("Original GIF animation")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "View optimized" }));
  }
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
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(within(button).queryByTestId("gif-quality-error")).toBeNull();
    expect(alert).toBeEmptyDOMElement();
    fireEvent.error(screen.getByAltText("Original GIF animation"));
    expect(screen.getByRole("alert")).toBe(alert);
    expect(alert).toHaveTextContent("Couldn't load the original GIF");
    expect(button).toHaveFocus();
    expect(within(button).getByTestId("gif-quality-error")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAccessibleDescription(
      "Couldn't load the original GIF. You can try again."
    );
    const description = document.getElementById(
      button.getAttribute("aria-describedby")!
    );
    expect(description).not.toBe(alert);
    expect(description).not.toHaveAttribute("role", "alert");
    expect(description).toHaveTextContent(
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
