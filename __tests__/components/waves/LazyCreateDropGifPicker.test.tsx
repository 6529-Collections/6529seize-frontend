import { createDropGifPickerLoader } from "@/components/waves/CreateDropGifPickerLoader";
import LazyCreateDropGifPicker from "@/components/waves/LazyCreateDropGifPicker";
import { act, render, screen } from "@testing-library/react";

// The picker module imports the Giphy components, so counting its evaluations
// tells whether the Giphy chunk was fetched. These tests share one module
// registry on purpose: the order below is meaningful.
let mockPickerEvaluations = 0;

jest.mock("@/components/waves/CreateDropGifPicker", () => {
  mockPickerEvaluations += 1;
  return {
    __esModule: true,
    default: ({
      show,
      giphyApiKey,
    }: {
      readonly show: boolean;
      readonly giphyApiKey?: string;
    }) =>
      show ? <div data-testid="gif-picker" data-api-key={giphyApiKey} /> : null,
  };
});

const baseProps = {
  giphyApiKey: "key",
  setShow: jest.fn(),
  onSelect: jest.fn(),
};

describe("LazyCreateDropGifPicker", () => {
  it("does not fetch the Giphy chunk until the picker is opened", async () => {
    const { container } = render(
      <LazyCreateDropGifPicker {...baseProps} show={false} />
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container).toBeEmptyDOMElement();
    expect(mockPickerEvaluations).toBe(0);
  });

  it("renders nothing while the chunk loads, then the picker", async () => {
    const { container, rerender } = render(
      <LazyCreateDropGifPicker {...baseProps} show={false} />
    );

    rerender(<LazyCreateDropGifPicker {...baseProps} show={true} />);
    // No awaiting yet: the chunk cannot have arrived.
    expect(container).toBeEmptyDOMElement();

    const picker = await screen.findByTestId("gif-picker");
    expect(picker).toHaveAttribute("data-api-key", "key");
    expect(mockPickerEvaluations).toBe(1);
  });

  it("keeps the loaded chunk, so reopening renders in the same pass", async () => {
    const { rerender } = render(
      <LazyCreateDropGifPicker {...baseProps} show={false} />
    );
    expect(screen.queryByTestId("gif-picker")).toBeNull();

    // Nothing below awaits: the module is cached.
    rerender(<LazyCreateDropGifPicker {...baseProps} show={true} />);

    expect(screen.getByTestId("gif-picker")).toBeVisible();
    expect(mockPickerEvaluations).toBe(1);
  });

  it("warms the chunk on demand without showing the picker", () => {
    // Already loaded by the previous tests, so this must be a no-op.
    createDropGifPickerLoader.preload();

    expect(mockPickerEvaluations).toBe(1);
  });
});
