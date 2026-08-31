import { fireEvent, render, screen } from "@testing-library/react";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import {
  getMuseumMediaDeliverySrcSet,
  getMuseumMediaDeliveryUrl,
} from "@/lib/museum/runtime/mediaDelivery";

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
    expect(viewButton).toHaveClass(
      "tw-h-full",
      "tw-items-center",
      "tw-justify-center"
    );
    fireEvent.click(viewButton);
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", media.src);
    expect(image.parentElement).toHaveFocus();
  });

  it("renders a large governed source immediately in an art-first exhibition", () => {
    render(
      <MuseumProposalImage
        {...media}
        sourceByteSize={16_871_807}
        alt="Lorenzo Meloni exhibition photograph"
        requireIntentForLargeSource={false}
        containerClassName="tw-h-full tw-w-full"
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", media.src);
    expect(image.parentElement).toHaveClass("tw-h-full", "tw-w-full");
  });

  it("delivers a large governed source through a responsive runtime derivative", () => {
    render(
      <MuseumProposalImage
        {...media}
        sourceByteSize={16_871_807}
        alt="Lorenzo Meloni accession photograph"
        optimizeSource
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("sizes");
    expect(image.getAttribute("src")).toContain("/_next/image?url=");
    expect(image.getAttribute("src")).toContain(encodeURIComponent(media.src));
  });

  it("uses the smallest approved delivery copy as src and publishes responsive candidates", () => {
    const variants = [
      {
        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/accessions/6529NM.2026.002/6529NM-W-0028/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/webp-v2-q82-m6-fixed-icc/640.webp",
        width: 640,
        height: 512,
        byteSize: 62_624,
        sha256: `sha256:${"a".repeat(64)}` as const,
      },
      {
        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/accessions/6529NM.2026.002/6529NM-W-0028/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/webp-v2-q82-m6-fixed-icc/1280.webp",
        width: 1280,
        height: 1023,
        byteSize: 221_762,
        sha256: `sha256:${"b".repeat(64)}` as const,
      },
      {
        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/accessions/6529NM.2026.002/6529NM-W-0028/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/webp-v2-q82-m6-fixed-icc/2400.webp",
        width: 2400,
        height: 1919,
        byteSize: 663_788,
        sha256: `sha256:${"c".repeat(64)}` as const,
      },
    ] as const;
    render(
      <MuseumProposalImage
        {...media}
        sourceByteSize={16_871_807}
        variants={variants}
        sizes="(min-width: 1280px) 30vw, 100vw"
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute(
      "src",
      getMuseumMediaDeliveryUrl(variants[0].url)
    );
    expect(image).toHaveAttribute(
      "srcset",
      getMuseumMediaDeliverySrcSet(
        `${variants[0].url} 640w, ${variants[1].url} 1280w, ${variants[2].url} 2400w`
      )
    );
    expect(image).toHaveAttribute("sizes", "(min-width: 1280px) 30vw, 100vw");
    expect(image).not.toHaveAttribute("src", media.src);
  });
});
