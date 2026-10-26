import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from "@testing-library/react";
import { useOriginalImage } from "@/components/drops/view/item/content/media/useOriginalImage";
import {
  createElement,
  forwardRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { MemesDropArtworkHero } from "@/components/waves/drop/MemesDropArtworkHero";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";

type MockImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean;
  readonly unoptimized?: boolean;
  readonly quality?: number;
};
jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockImageProps>(
    // eslint-disable-next-line react/display-name
    (
      { fill: _fill, unoptimized: _unoptimized, quality: _quality, ...props },
      ref
    ) => createElement("img", { ...props, ref })
  ),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (src: string) => src,
}));
jest.mock("@/hooks/useInView", () => ({
  useInView: () => [jest.fn(), true],
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: true }),
}));
jest.mock("@/hooks/useFullScreenSupported", () => ({
  useFullScreenSupported: () => true,
}));
jest.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }: { children: () => ReactNode }) => children(),
  TransformComponent: ({ children }: { children: ReactNode }) => children,
}));

const src = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/art.gif";
const artwork = { mime_type: "image/gif", url: src };

it("automatically loads a submission GIF with no eligible preview source", () => {
  const url = "http://external.example/art.gif";
  render(<MemesDropArtworkHero artworkMedia={{ ...artwork, url }} />);
  expect(screen.getByAltText("Original GIF animation")).toHaveAttribute(
    "src",
    url
  );
  expect(screen.queryByAltText("Drop media")).toBeNull();
  fireEvent.load(screen.getByAltText("Original GIF animation"));
  expect(screen.queryByRole("status", { name: "Loading image" })).toBeNull();
});

it("fills the reserved submission frame with a centered, reduced-motion-safe GIF loader", () => {
  const { rerender } = render(<MemesDropArtworkHero artworkMedia={artwork} />);
  const loader = screen.getByRole("status", { name: "Loading image" });
  expect(loader).toHaveClass(
    "tw-inset-0",
    "tw-flex",
    "tw-items-center",
    "tw-justify-center",
    "tw-bg-iron-800/40",
    "tw-pointer-events-none"
  );
  expect(loader).not.toHaveClass("tw-w-64", "tw-max-h-64", "tw-left-0");
  expect(loader.querySelector('[aria-hidden="true"]')).toHaveClass(
    "tw-size-8",
    "motion-safe:tw-animate-spin"
  );
  expect(screen.getByRole("button", { name: "View original" })).toBeEnabled();
  fireEvent.load(screen.getByAltText("Drop media"));
  expect(screen.queryByRole("status", { name: "Loading image" })).toBeNull();
  rerender(
    <MemesDropArtworkHero
      artworkMedia={{ ...artwork, url: src.replace("art.gif", "next.gif") }}
    />
  );
  expect(screen.getByRole("status", { name: "Loading image" })).toHaveClass(
    "tw-inset-0"
  );
});

it("clears the submission loader when the original loads before a legacy preview", () => {
  render(<MemesDropArtworkHero artworkMedia={artwork} />);
  rejectAnimatedPreviews();
  expect(
    screen.getByRole("status", { name: "Loading image" })
  ).toBeInTheDocument();
  fireEvent.load(screen.getByAltText("Original GIF animation"));
  expect(screen.queryByRole("status", { name: "Loading image" })).toBeNull();
});

it("applies batched quality toggles to the latest choice and ignores a previous artwork's toggle", () => {
  const { result, rerender } = renderHook(
    ({ source }) => useOriginalImage(source),
    { initialProps: { source: src } }
  );
  act(() => {
    result.current.toggle();
    result.current.toggle();
  });
  expect(result.current.requested).toBe(false);
  const staleToggle = result.current.toggle;
  rerender({ source: src.replace("art.gif", "next.gif") });
  act(staleToggle);
  expect(result.current.requested).toBe(false);
  act(() => result.current.requestAutomatically());
  expect(result.current.requested).toBe(true);
});

function rejectAnimatedPreviews() {
  const preview = screen.getByAltText("Drop media");
  expect(preview).toHaveAttribute(
    "src",
    src.replace("art.gif", "AUTOx1080_gifv2/art.gif")
  );
  fireEvent.error(preview);
  expect(preview).toHaveAttribute(
    "src",
    src.replace("art.gif", "AUTOx450_gifv2/art.gif")
  );
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
  fireEvent.error(preview);
  return preview;
}

it("keeps a successful animated submission preview without fetching the original", () => {
  render(<MemesDropArtworkHero artworkMedia={artwork} />);
  fireEvent.load(screen.getByAltText("Drop media"));
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
  expect(screen.getByRole("button", { name: "View original" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  fireEvent.error(screen.getByAltText("Drop media"));
  fireEvent.load(screen.getByAltText("Drop media"));
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
});

it("automatically animates the submission after both animated previews fail and shares HD with its popup", () => {
  const { container } = render(<MemesDropArtworkHero artworkMedia={artwork} />);
  const preview = rejectAnimatedPreviews();
  fireEvent.load(preview);
  const original = screen.getByAltText("Original GIF animation");
  expect(original).toHaveAttribute("src", src);
  expect(original).not.toBeVisible();
  expect(preview).toBeVisible();
  expect(
    screen.getByRole("status", { name: "Loading original GIF" })
  ).toBeInTheDocument();
  fireEvent.load(original);
  expect(original).toBeVisible();
  expect(preview).not.toBeVisible();
  expect(
    screen.getByRole("button", { name: "View optimized" })
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));
  expect(
    screen.getAllByRole("button", { name: "View optimized" })
  ).toHaveLength(2);
  const popupToggle = screen
    .getAllByRole("button", { name: "View optimized" })
    .at(-1)!;
  fireEvent.click(popupToggle);
  // Opening or loading the popup must not undo the viewer's optimized choice.
  const popupPreview = screen.getByAltText("Expanded image preview");
  fireEvent.error(popupPreview);
  fireEvent.error(popupPreview);
  fireEvent.load(popupPreview);
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
  expect(
    within(container).getByRole("button", { name: "View original" })
  ).toHaveAttribute("aria-pressed", "false");
  expect(preview).toBeVisible();
});

it("keeps the legacy preview on original failure without automatic retry and lets HD retry", () => {
  render(<MemesDropArtworkHero artworkMedia={artwork} />);
  const preview = rejectAnimatedPreviews();
  fireEvent.load(preview);
  fireEvent.error(screen.getByAltText("Original GIF animation"));
  expect(preview).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Couldn't load the original GIF"
  );
  fireEvent.load(preview);
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));
  const popupPreview = screen.getByAltText("Expanded image preview");
  fireEvent.error(popupPreview);
  fireEvent.error(popupPreview);
  fireEvent.load(popupPreview);
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
  fireEvent.click(
    screen.getAllByRole("button", { name: "View original" }).at(-1)!
  );
  const popupOriginal = screen
    .getAllByAltText("Original GIF animation")
    .at(-1)!;
  fireEvent.load(popupOriginal);
  expect(popupOriginal).toBeVisible();
});

it("resets automatic playback for another submission", () => {
  const { rerender } = render(<MemesDropArtworkHero artworkMedia={artwork} />);
  rejectAnimatedPreviews();
  fireEvent.load(screen.getByAltText("Original GIF animation"));
  const nextSrc = src.replace("art.gif", "next.gif");
  rerender(
    <MemesDropArtworkHero artworkMedia={{ ...artwork, url: nextSrc }} />
  );
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
  const preview = screen.getByAltText("Drop media");
  fireEvent.error(preview);
  fireEvent.error(preview);
  expect(screen.getByAltText("Original GIF animation")).toHaveAttribute(
    "src",
    nextSrc
  );
});

it("can show the original even when no legacy preview loads", () => {
  render(<MemesDropArtworkHero artworkMedia={artwork} />);
  const preview = rejectAnimatedPreviews();
  fireEvent.error(preview);
  fireEvent.error(preview);
  const original = screen.getByAltText("Original GIF animation");
  fireEvent.load(original);
  expect(original).toBeVisible();
  expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
});

it("respects a manual optimized choice before animation fallbacks finish", () => {
  render(<MemesDropArtworkHero artworkMedia={artwork} />);
  fireEvent.click(screen.getByRole("button", { name: "View original" }));
  fireEvent.click(screen.getByRole("button", { name: "View optimized" }));
  const preview = rejectAnimatedPreviews();
  fireEvent.load(preview);
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
});

it("does not automatically load original GIFs in ordinary drop images", () => {
  render(<DropListItemContentMediaImage src={src} />);
  const preview = screen.getByAltText("Drop media");
  fireEvent.error(preview);
  fireEvent.load(preview);
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open image preview" }));
  const popupPreview = screen.getByAltText("Expanded image preview");
  for (let attempt = 0; attempt < 4; attempt++) fireEvent.error(popupPreview);
  expect(screen.queryByAltText("Original GIF animation")).toBeNull();
});

it("does not automatically load original still artwork", () => {
  render(
    <MemesDropArtworkHero
      artworkMedia={{ mime_type: "image/png", url: src.replace("gif", "png") }}
    />
  );
  const preview = screen.getByAltText("Drop media");
  fireEvent.error(preview);
  fireEvent.load(preview);
  expect(screen.queryByAltText("Original image")).toBeNull();
});
