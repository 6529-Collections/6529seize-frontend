import LazyCreateDropGifPicker from "@/components/waves/LazyCreateDropGifPicker";
import { render, waitFor } from "@testing-library/react";

jest.mock("@/components/waves/CreateDropGifPicker", () => {
  throw new Error("chunk failed to load");
});

describe("LazyCreateDropGifPicker when its chunk fails to load", () => {
  it("closes the picker so the next click can retry", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const setShow = jest.fn();

    const { container } = render(
      <LazyCreateDropGifPicker
        giphyApiKey="key"
        show={true}
        setShow={setShow}
        onSelect={jest.fn()}
      />
    );

    await waitFor(() => expect(setShow).toHaveBeenCalledWith(false));
    expect(container).toBeEmptyDOMElement();
    consoleError.mockRestore();
  });
});
