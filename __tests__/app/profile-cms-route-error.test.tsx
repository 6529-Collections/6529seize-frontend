import { fireEvent, render, screen } from "@testing-library/react";

import ProfileCmsRouteError from "@/app/[user]/[...cmsPath]/error";

describe("ProfileCmsRouteError", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // The boundary logs the error it received.
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders the unavailable state and retries with Next 16.3 retry", () => {
    const error = new Error("render failed");
    const retry = jest.fn();
    const reset = jest.fn();

    render(<ProfileCmsRouteError error={error} retry={retry} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Website unavailable" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("This profile website could not be rendered.")
    ).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });

  it("still retries with Next 16.2 unstable_retry", () => {
    const unstableRetry = jest.fn();

    render(
      <ProfileCmsRouteError
        error={new Error("render failed")}
        unstable_retry={unstableRetry}
        reset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(unstableRetry).toHaveBeenCalledTimes(1);
  });
});
