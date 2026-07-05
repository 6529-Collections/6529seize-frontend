import { generateMetadata as generateGradientMetadata } from "@/app/6529-gradient/page";
import { generateMetadata as generateMemeLabMetadata } from "@/app/meme-lab/page";
import { generateMetadata as generateTheMemesMetadata } from "@/app/the-memes/page";
import type { Metadata } from "next";

jest.mock("@/components/6529Gradient/6529Gradient", () => ({
  __esModule: true,
  default: () => <div data-testid="gradient" />,
}));

jest.mock("@/components/memelab/MemeLab", () => ({
  __esModule: true,
  default: () => <div data-testid="meme-lab" />,
}));

jest.mock("@/components/the-memes/TheMemes", () => ({
  __esModule: true,
  default: () => <div data-testid="the-memes" />,
}));

const getSocialImage = (metadata: Metadata) => {
  const [image] = metadata.openGraph?.images as {
    alt: string;
    height: number;
    url: string;
    width: number;
  }[];
  return image;
};

describe("collection landing metadata", () => {
  it.each([
    {
      alt: "The Memes collection social card",
      generateMetadata: generateTheMemesMetadata,
      slug: "the-memes",
      title: "The Memes | Collections",
    },
    {
      alt: "Meme Lab collection social card",
      generateMetadata: generateMemeLabMetadata,
      slug: "meme-lab",
      title: "Meme Lab | Collections",
    },
    {
      alt: "6529 Gradient collection social card",
      generateMetadata: generateGradientMetadata,
      slug: "6529-gradient",
      title: "6529 Gradient | Collections",
    },
  ])("uses branded collection card metadata for $title", async (route) => {
    const metadata = await route.generateMetadata();
    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe(route.title);
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(image).toMatchObject({
      alt: route.alt,
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe(`/api/og-metadata/collections/${route.slug}`);
    expect(url.search).toBe("");
  });
});
