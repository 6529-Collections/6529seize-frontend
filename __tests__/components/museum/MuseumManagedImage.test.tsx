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

  it("delivers approved accession derivatives through the same-origin Museum endpoint", () => {
    const source =
      "https://d3lqz0a4bldqgf.cloudfront.net/museum/accessions/6529NM.2026.003/6529NM-W-0029/c1b6541832f2a237555adffae2f4870143a976549e591e2dbaa4d3d87f75d166/webp-v2-q82-m6-fixed-icc/640.webp";
    render(
      <MuseumManagedImage
        {...props}
        src={source}
        srcSet={`${source} 640w, ${source.replace("/640.webp", "/1280.webp")} 1280w`}
        alt="A governed accession image"
      />
    );

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute(
      "src",
      `/api/museum/media?url=${encodeURIComponent(source)}`
    );
    expect(image).toHaveAttribute(
      "srcset",
      `/api/museum/media?url=${encodeURIComponent(source)} 640w, /api/museum/media?url=${encodeURIComponent(source.replace("/640.webp", "/1280.webp"))} 1280w`
    );
  });
});
