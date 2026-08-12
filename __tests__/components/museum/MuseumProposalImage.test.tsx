import { fireEvent, render, screen } from "@testing-library/react";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";

describe("MuseumProposalImage", () => {
  const media = {
    src: "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/drop/image.jpg",
    alt: "Governed presentation photograph",
    width: 2400,
    height: 1600,
  };

  it("keeps only the intentional first image eager and reserves its aspect ratio", () => {
    render(
      <>
        <MuseumProposalImage {...media} eager />
        <MuseumProposalImage
          {...media}
          src={`${media.src}?second`}
          alt="Below-fold governed presentation photograph"
        />
      </>
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(images[1]).toHaveAttribute("loading", "lazy");
    expect(images[1]).toHaveAttribute("fetchpriority", "low");
    expect(images[0]).toHaveAttribute("width", "2400");
    expect(images[0]).toHaveAttribute("height", "1600");
    expect((images[0] as HTMLImageElement).style.aspectRatio).toBe(
      "2400 / 1600"
    );
  });

  it("requires an intentional view for a source-declared 16.9 MB presentation", () => {
    render(
      <MuseumProposalImage
        {...media}
        sourceByteSize={16_871_807}
        alt="Lorenzo Meloni historical proposal photograph"
      />
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const viewButton = screen.getByRole("button", {
      name: "View image · loads 16.9 MB",
    });
    fireEvent.click(viewButton);
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", media.src);
    expect(image.parentElement).toHaveFocus();
  });
});
