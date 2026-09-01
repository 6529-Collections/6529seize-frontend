import { render, screen } from "@testing-library/react";

import MessagesLoading from "@/app/messages/loading";
import WavesLoading from "@/app/waves/loading";

describe("stream route loading fallbacks", () => {
  const expectedMinHeight =
    "calc(100dvh - var(--stream-route-loading-header-reserve, 0px) - var(--stream-route-loading-bottom-reserve, 0px))";

  it("renders an accessible waves loading state", () => {
    render(<WavesLoading />);

    const shell = screen.getByTestId("stream-route-loading-shell");

    expect(
      screen.getByRole("status", { name: "Loading waves" })
    ).toBeInTheDocument();
    expect(shell).toBeInTheDocument();
  });

  it("renders an accessible messages loading state", () => {
    render(<MessagesLoading />);

    const shell = screen.getByTestId("stream-route-loading-shell");

    expect(
      screen.getByRole("status", { name: "Loading messages" })
    ).toBeInTheDocument();
    expect(shell).toBeInTheDocument();
  });

  it("uses layout-owned header and bottom reserves for route loading height", () => {
    render(<WavesLoading />);

    const shell = screen.getByTestId("stream-route-loading-shell");
    const shellBody = shell.firstElementChild?.nextElementSibling;

    expect(shell).not.toHaveClass("tw-min-h-[calc(100dvh-85px)]");
    expect(shell.getAttribute("style")).toContain(expectedMinHeight);
    expect(shellBody).not.toHaveClass("tw-min-h-[calc(100dvh-85px)]");
    expect(shellBody?.getAttribute("style")).toContain(expectedMinHeight);
  });
});
