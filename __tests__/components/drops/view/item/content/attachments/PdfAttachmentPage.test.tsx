import { act, render, screen } from "@testing-library/react";
import PdfAttachmentPage from "@/components/drops/view/item/content/attachments/PdfAttachmentPage";

let mockWidth = 1920;
let mockHeight = 1080;
jest.mock("react-pdf", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    Page: ({
      onLoadSuccess,
      renderMode,
      renderTextLayer,
      devicePixelRatio,
    }: {
      onLoadSuccess: (page: {
        getViewport: () => { width: number; height: number };
      }) => void;
      renderMode: string;
      renderTextLayer: boolean;
      devicePixelRatio: number;
    }) => {
      React.useEffect(() => {
        onLoadSuccess({
          getViewport: () => ({ width: mockWidth, height: mockHeight }),
        });
      }, [onLoadSuccess]);
      return (
        <div
          data-testid="page"
          data-render={renderMode}
          data-text={renderTextLayer}
          data-pixel-ratio={devicePixelRatio}
        />
      );
    },
  };
});
const originalObserver = globalThis.IntersectionObserver;
let notifyIntersection: IntersectionObserverCallback;
const disconnect = jest.fn();
beforeEach(() => {
  mockWidth = 1920;
  mockHeight = 1080;
  disconnect.mockClear();
  globalThis.IntersectionObserver = jest.fn().mockImplementation((callback) => {
    notifyIntersection = callback;
    return { observe: jest.fn(), disconnect };
  });
});
afterEach(() => {
  globalThis.IntersectionObserver = originalObserver;
});
function visible(isIntersecting: boolean) {
  act(() =>
    notifyIntersection(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  );
}
it("releases raster and text layers away from the viewport while keeping measured page space", () => {
  const { container, unmount } = render(
    <PdfAttachmentPage
      page={4}
      width={430}
      viewportHeight={800}
      scrollRoot={document.createElement("div")}
      onError={jest.fn()}
    />
  );
  expect(screen.getByTestId("page")).toHaveAttribute("data-render", "none");
  expect((container.firstChild as HTMLElement).style.aspectRatio).toBe(
    "1 / 0.5625"
  );
  visible(true);
  expect(screen.getByTestId("page")).toHaveAttribute("data-render", "canvas");
  expect(screen.getByTestId("page")).toHaveAttribute("data-text", "true");
  visible(false);
  expect(screen.getByTestId("page")).toHaveAttribute("data-render", "none");
  expect(screen.getByTestId("page")).toHaveAttribute("data-text", "false");
  unmount();
  expect(disconnect).toHaveBeenCalled();
});
it("bounds canvas dimensions for unusually tall pages", () => {
  mockHeight = 19200;
  render(
    <PdfAttachmentPage
      page={1}
      width={1200}
      viewportHeight={800}
      scrollRoot={document.createElement("div")}
      onError={jest.fn()}
    />
  );
  visible(true);
  const ratio = Number(screen.getByTestId("page").dataset["pixelRatio"]);
  expect(1200 * 10 * ratio).toBeLessThanOrEqual(4096);
  expect(1200 * 1200 * 10 * ratio * ratio).toBeLessThanOrEqual(4_000_000);
});
it("reports invalid page dimensions instead of allocating an invalid canvas", () => {
  mockWidth = 0;
  const onError = jest.fn();
  render(
    <PdfAttachmentPage
      page={1}
      width={430}
      viewportHeight={800}
      scrollRoot={document.createElement("div")}
      onError={onError}
    />
  );
  visible(true);
  expect(onError).toHaveBeenCalled();
  expect(screen.getByTestId("page")).toHaveAttribute("data-render", "none");
});
