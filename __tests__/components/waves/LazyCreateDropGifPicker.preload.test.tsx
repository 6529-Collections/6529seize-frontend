import { createDropGifPickerLoader } from "@/components/waves/CreateDropGifPickerLoader";
import LazyCreateDropGifPicker from "@/components/waves/LazyCreateDropGifPicker";
import { act, render, screen } from "@testing-library/react";

// Its own file, so the picker chunk is fetched by a preload and by nothing
// else before the first open: the warm-up path (hover or focus on the button).
jest.mock("@/components/waves/CreateDropGifPicker", () => ({
  __esModule: true,
  default: ({ show }: { readonly show: boolean }) =>
    show ? <div data-testid="gif-picker" /> : null,
}));

describe("LazyCreateDropGifPicker after its chunk was preloaded", () => {
  it("renders the picker in the first pass when it opens", async () => {
    createDropGifPickerLoader.preload();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Nothing below awaits. A next/dynamic loader would still suspend on the
    // first render even though the module was cached.
    render(
      <LazyCreateDropGifPicker
        giphyApiKey="key"
        show={true}
        setShow={jest.fn()}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByTestId("gif-picker")).toBeVisible();
  });
});
