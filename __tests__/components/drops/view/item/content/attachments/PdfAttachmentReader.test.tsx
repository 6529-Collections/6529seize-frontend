import type { ReactNode } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PdfAttachmentReader from "@/components/drops/view/item/content/attachments/PdfAttachmentReader";
import {
  fetchPdfPreview,
  PDF_PREVIEW_TIMEOUT_MS,
} from "@/components/drops/view/item/content/attachments/fetchPdfPreview";

let mockPageCount = 20;
let mockDocumentPending = false;
jest.mock(
  "@/components/drops/view/item/content/attachments/fetchPdfPreview",
  () => ({
    ...jest.requireActual(
      "@/components/drops/view/item/content/attachments/fetchPdfPreview"
    ),
    fetchPdfPreview: jest.fn(),
  })
);
jest.mock("react-pdf", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    pdfjs: { version: "test", GlobalWorkerOptions: {} },
    Document: ({
      children,
      onLoadSuccess,
    }: {
      children: ReactNode;
      onLoadSuccess: (doc: { numPages: number }) => void;
    }) => {
      React.useEffect(() => {
        if (!mockDocumentPending) onLoadSuccess({ numPages: mockPageCount });
      }, [onLoadSuccess]);
      return children;
    },
  };
});
jest.mock(
  "@/components/drops/view/item/content/attachments/PdfAttachmentPage",
  () => ({
    __esModule: true,
    default: ({ page, width }: { page: number; width: number }) => (
      <div data-testid="pdf-page" data-pdf-page={page} data-width={width}>
        Document page {page}
      </div>
    ),
  })
);
const fetchPdf = jest.mocked(fetchPdfPreview);
const originalObserver = globalThis.ResizeObserver;
beforeEach(() => {
  mockPageCount = 20;
  mockDocumentPending = false;
  fetchPdf.mockReset().mockResolvedValue(new Uint8Array([1]));
  globalThis.ResizeObserver = jest.fn().mockImplementation((callback) => ({
    observe: () => callback([{ contentRect: { width: 320, height: 600 } }]),
    disconnect: jest.fn(),
  }));
});
afterEach(() => {
  globalThis.ResizeObserver = originalObserver;
  jest.useRealTimers();
});

it("makes every page available by scrolling, without navigation or zoom controls", async () => {
  render(<PdfAttachmentReader url="https://example.test/long.pdf" />);
  await screen.findByText("Page 1 of 20");
  expect(screen.getAllByTestId("pdf-page")).toHaveLength(20);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  const scroller = screen.getByRole("region", { name: "PDF pages" });
  Object.defineProperties(scroller, {
    clientHeight: { value: 600 },
    scrollHeight: { value: 6000 },
  });
  fireEvent.scroll(scroller, { target: { scrollTop: 5400 } });
  expect(screen.getByText("Page 20 of 20")).toBeInTheDocument();
});
it("keeps separate reader instances independent", async () => {
  render(
    <>
      <section aria-label="First">
        <PdfAttachmentReader url="https://example.test/a.pdf" />
      </section>
      <section aria-label="Second">
        <PdfAttachmentReader url="https://example.test/b.pdf" />
      </section>
    </>
  );
  const first = within(screen.getByRole("region", { name: "First" }));
  const second = within(screen.getByRole("region", { name: "Second" }));
  await first.findByText("Page 1 of 20");
  await second.findByText("Page 1 of 20");
  const scroller = first.getByRole("region", { name: "PDF pages" });
  Object.defineProperties(scroller, {
    clientHeight: { value: 600 },
    scrollHeight: { value: 6000 },
  });
  fireEvent.scroll(scroller, { target: { scrollTop: 5400 } });
  expect(first.getByText("Page 20 of 20")).toBeInTheDocument();
  expect(second.getByText("Page 1 of 20")).toBeInTheDocument();
});
it("shows the complete single-page document without extra controls", async () => {
  mockPageCount = 1;
  render(<PdfAttachmentReader url="https://example.test/one.pdf" />);
  await screen.findByText("Page 1 of 1");
  expect(screen.getAllByTestId("pdf-page")).toHaveLength(1);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("shows loading, recovers a failed request, and aborts when closed", async () => {
  const user = userEvent.setup();
  fetchPdf.mockRejectedValueOnce(new Error("unavailable"));
  const { unmount } = render(
    <PdfAttachmentReader url="https://example.test/retry.pdf" />
  );
  expect(screen.getByRole("status")).toHaveTextContent("Loading PDF");
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("Page 1 of 20");
  expect(screen.getByRole("region", { name: "PDF pages" })).toHaveFocus();
  const signal = fetchPdf.mock.calls.at(-1)?.[1];
  unmount();
  expect(signal?.aborted).toBe(true);
});
it("ends a stalled download with an actionable error", async () => {
  jest.useFakeTimers();
  fetchPdf.mockImplementation(
    (_url, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError"))
        );
      })
  );
  render(<PdfAttachmentReader url="https://example.test/slow.pdf" />);
  await act(async () => jest.advanceTimersByTime(PDF_PREVIEW_TIMEOUT_MS));
  await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
});

it("recovers when the PDF worker stalls after the download completes", async () => {
  jest.useFakeTimers();
  mockDocumentPending = true;
  render(<PdfAttachmentReader url="https://example.test/stalled-worker.pdf" />);
  await act(async () => {});
  await act(async () => jest.advanceTimersByTime(PDF_PREVIEW_TIMEOUT_MS));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open full PDF" })).toBeVisible();
  mockDocumentPending = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await act(async () => {});
  expect(screen.getAllByTestId("pdf-page")).toHaveLength(20);
  await act(async () => jest.advanceTimersByTime(PDF_PREVIEW_TIMEOUT_MS));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
