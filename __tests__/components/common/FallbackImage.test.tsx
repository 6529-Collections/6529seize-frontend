import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { FallbackImage } from "../../../components/common/FallbackImage";

describe("FallbackImage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("falls back without logging to the console", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const onPrimaryError = jest.fn();

    render(
      <FallbackImage
        primarySrc="primary.gif"
        fallbackSrc="fallback.gif"
        alt="fallback example"
        onPrimaryError={onPrimaryError}
      />
    );

    const image = screen.getByRole("img", { name: "fallback example" });
    expect(image.getAttribute("src")).toBe("primary.gif");

    fireEvent.error(image);

    await waitFor(() => {
      expect(image.getAttribute("src")).toBe("fallback.gif");
    });

    expect(onPrimaryError).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
