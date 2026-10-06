// These are the final publisher locations observed through the canonical
// Art Blocks URLs for the eight accessioned works. This is delivery routing,
// not a new media source or retained Museum copy. Keep the publication URI,
// provenance, rights, and custody records unchanged.
const ART_BLOCKS_MAINNET_BUCKET = "artblocks-mainnet";

const PUBLISHER_STILLS = [
  [
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "100000031",
    ART_BLOCKS_MAINNET_BUCKET,
  ],
  [
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "100000724",
    ART_BLOCKS_MAINNET_BUCKET,
  ],
  [
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "100000401",
    ART_BLOCKS_MAINNET_BUCKET,
  ],
  [
    "99a9b7c1116f9ceeb1652de04d5969cce509b069",
    "383000063",
    ART_BLOCKS_MAINNET_BUCKET,
  ],
  [
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "164000308",
    ART_BLOCKS_MAINNET_BUCKET,
  ],
  [
    "145789247973c5d612bf121e9e4eef84b63eb707",
    "1000713",
    "art-blocks-bright-moments-mainnet",
  ],
  ["0000000c687daed0fba60d1dba4e5f6149e8b894", "248", "abstudio-92-mainnet"],
  [
    "e034bb2b1b9471e11cf1a0a9199a156fb227aa5d",
    "210",
    "sothebys-gen-art-mainnet",
  ],
] as const;

const DELIVERY_URLS = new Map(
  PUBLISHER_STILLS.map(([contract, token, bucket]) => [
    `https://media-proxy.artblocks.io/1/0x${contract}/${token}.png`,
    `https://${bucket}.s3.amazonaws.com/${token}.png`,
  ])
);

/** Only exact governed URLs receive an observed publisher delivery override. */
export function getArtBlocksPublisherDeliveryUrl(
  source: string
): string | undefined {
  return DELIVERY_URLS.get(source);
}
