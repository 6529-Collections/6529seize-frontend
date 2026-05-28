import { render, screen } from "@testing-library/react";

import MessagesLoading from "@/app/messages/loading";
import WavesLoading from "@/app/waves/loading";

describe("stream route loading fallbacks", () => {
  it("renders an accessible waves loading state", () => {
    render(<WavesLoading />);

    expect(
      screen.getByRole("status", { name: "Loading waves" })
    ).toBeInTheDocument();
  });

  it("renders an accessible messages loading state", () => {
    render(<MessagesLoading />);

    expect(
      screen.getByRole("status", { name: "Loading messages" })
    ).toBeInTheDocument();
  });
});
