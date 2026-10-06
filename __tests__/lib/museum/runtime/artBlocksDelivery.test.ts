import { getCaseyArtwork } from "@/lib/museum/casey";
import { getArtBlocksPublisherDeliveryUrl } from "@/lib/museum/runtime/artBlocksDelivery";
import { getMuseumMediaDeliveryUrl } from "@/lib/museum/runtime/mediaDelivery";

const TOKEN_DESTINATIONS = [
  ["100000031", "artblocks-mainnet"],
  ["100000724", "artblocks-mainnet"],
  ["100000401", "artblocks-mainnet"],
  ["383000063", "artblocks-mainnet"],
  ["164000308", "artblocks-mainnet"],
  ["1000713", "art-blocks-bright-moments-mainnet"],
  ["248", "abstudio-92-mainnet"],
] as const;

it("delivers all seven Casey holdings from their observed publisher locations without changing the source record", () => {
  TOKEN_DESTINATIONS.forEach(([token, bucket], index) => {
    const artwork = getCaseyArtwork(
      `6529NM.2026.001.${String(index + 1).padStart(2, "0")}`
    )!;
    const source = artwork.imageUrl;
    const destination = `https://${bucket}.s3.amazonaws.com/${token}.png`;
    expect(getMuseumMediaDeliveryUrl(source)).toBe(destination);
    expect(artwork.mediaRetention).toBe("upstream_not_retained");
  });
});

it("delivers Themes and Variations from the observed Sotheby's publisher bucket", () => {
  expect(
    getMuseumMediaDeliveryUrl(
      "https://media-proxy.artblocks.io/1/0xe034bb2b1b9471e11cf1a0a9199a156fb227aa5d/210.png"
    )
  ).toBe("https://sothebys-gen-art-mainnet.s3.amazonaws.com/210.png");
});

it.each([
  "https://media-proxy.artblocks.io/1/0x99a9b7c1116f9ceeb1652de04d5969cce509b069/100000031.png",
  "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000032.png",
  "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png?redirect=https://example.com",
  "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png#fragment",
  "https://user:password@media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png",
  "https://media-proxy.artblocks.io.evil.example/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png",
  "http://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png",
])("never overrides an unregistered source: %s", (source) => {
  expect(getArtBlocksPublisherDeliveryUrl(source)).toBeUndefined();
  expect(getMuseumMediaDeliveryUrl(source)).toBe(source);
});
