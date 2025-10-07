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

  it("calls onError when both primary and fallback fail", async () => {
    const onPrimaryError = jest.fn();
    const onError = jest.fn();

    render(
      <FallbackImage
        primarySrc="primary.gif"
        fallbackSrc="fallback.gif"
        alt="fallback example"
        onPrimaryError={onPrimaryError}
        onError={onError}
      />
    );

    const image = screen.getByRole("img", { name: "fallback example" });

    fireEvent.error(image);
    await waitFor(() => {
      expect(image.getAttribute("src")).toBe("fallback.gif");
    });

    fireEvent.error(image);

    expect(onPrimaryError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
