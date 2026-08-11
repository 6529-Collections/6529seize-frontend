import { fireEvent, render, screen } from "@testing-library/react";
import { MuseumManagedImage } from "@/components/museum/MuseumManagedImage";

const props = {
  src: "https://example.com/governed-image.jpg",
  width: 1200,
  height: 800,
  failureMessage: "This image is unavailable.",
  retryLabel: "Retry",
};

describe("MuseumManagedImage", () => {
  it("offers Retry after a governed image fails and retries the request", () => {
    render(<MuseumManagedImage {...props} alt="A governed image" />);

    fireEvent.error(screen.getByRole("img"));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByRole("img")).toHaveAttribute("src", props.src);
  });

  it("fails closed without an inert Retry control when governed alt is absent", () => {
    render(<MuseumManagedImage {...props} alt="" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This image is unavailable."
    );
    expect(
      screen.queryByRole("button", { name: "Retry" })
    ).not.toBeInTheDocument();
  });
});
