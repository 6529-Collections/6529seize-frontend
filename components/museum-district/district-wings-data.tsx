import type { ReactNode } from "react";

export type DistrictVariant = "om" | "museum";

export interface DistrictWingImage {
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly src: string;
  readonly wpImage: number;
  readonly srcSet?: string;
  readonly sizes?: string;
}

export interface DistrictWingLink {
  readonly label: ReactNode;
  readonly href: Record<DistrictVariant, string>;
}

export interface DistrictHeadingNumbers {
  readonly column: number;
  readonly title: number;
}

export interface DistrictCardNumbers {
  readonly column: number;
  readonly imageframe: number;
  readonly title: number;
  readonly text?: number;
  readonly nestedImg: number;
  readonly nestedText: number;
}

export type DistrictEntry =
  | {
      readonly kind: "heading";
      readonly text: Record<DistrictVariant, ReactNode>;
      readonly numbers: Record<DistrictVariant, DistrictHeadingNumbers>;
    }
  | {
      readonly kind: "card";
      readonly image: DistrictWingImage;
      readonly title: ReactNode;
      readonly noMargin: boolean;
      readonly links: readonly DistrictWingLink[];
      readonly numbers: Record<DistrictVariant, DistrictCardNumbers>;
    }
  | {
      readonly kind: "titleLinkCard";
      readonly image: DistrictWingImage;
      readonly label: ReactNode;
      readonly href: Record<DistrictVariant, string>;
      readonly numbers: Record<DistrictVariant, DistrictCardNumbers>;
    };

/**
 * The 6529 Museum District listing scraped twice by WordPress: once at
 * /om/6529-museum-district (linking each wing to its oncyber.io space)
 * and once at /museum (linking to the internal wing pages). One data
 * set drives both; only hrefs and the WP numeric class suffixes differ
 * per variant.
 */
export const DISTRICT_WINGS: readonly DistrictEntry[] = [
  {
    kind: "heading",
    text: {
      om: <>6529 MUSEUM DISTRICT GUIDE</>,
      museum: <>6529 MUSEUM OF ART GALLERIES</>,
    },
    numbers: {
      om: { column: 2, title: 2 },
      museum: { column: 3, title: 1 },
    },
  },
  {
    kind: "card",
    image: {
      width: 165,
      height: 166,
      title: "6529MoA",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/6529MoA.png",
      wpImage: 159,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/6529MoA-66x66.png 66w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/6529MoA-150x150.png 150w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/6529MoA.png 165w",
      sizes: "(max-width: 165px) 100vw, 165px",
    },
    title: <>1 OF 1 ART</>,
    noMargin: true,
    links: [
      {
        label: (
          <>
            <u>IMAGINED WORLDS</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=115.81x2.8x-47.23x-1.50",
          museum: "/museum/imagined-worlds/",
        },
      },
      {
        label: (
          <>
            <u>EARLY NFT ART</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=117.37x2.8x-35.82x-1.67",
          museum: "/museum/early-nft-art/",
        },
      },
      {
        label: (
          <>
            Y<u>ONGOH KIM</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=116.94x2.8x-21.20x-1.59",
          museum: "/museum/yongoh-kim/",
        },
      },
      {
        label: (
          <>
            <u>SOZET LOUNGE</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=116.56x2.8x-5.36x-1.59",
          museum: "/museum/sozet-lounge/",
        },
      },
    ],
    numbers: {
      om: {
        column: 3,
        imageframe: 2,
        title: 3,
        text: 2,
        nestedImg: 0,
        nestedText: 1,
      },
      museum: {
        column: 4,
        imageframe: 3,
        title: 2,
        text: 2,
        nestedImg: 0,
        nestedText: 1,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 157,
      height: 210,
      title: "Gen-Art",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/Gen-Art.png",
      wpImage: 165,
    },
    title: <>GENERATIVE ART</>,
    noMargin: true,
    links: [
      {
        label: (
          <>
            <u>GENESIS</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=116.87x2.8x190.55x-1.56",
          museum: "/museum/genesis/",
        },
      },
    ],
    numbers: {
      om: {
        column: 4,
        imageframe: 3,
        title: 4,
        text: 3,
        nestedImg: 2,
        nestedText: 3,
      },
      museum: {
        column: 5,
        imageframe: 4,
        title: 3,
        text: 3,
        nestedImg: 2,
        nestedText: 3,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 152,
      height: 152,
      title: "NFTPhotography",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/NFTPhotography.png",
      wpImage: 167,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/NFTPhotography-66x66.png 66w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/NFTPhotography-150x150.png 150w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/NFTPhotography.png 152w",
      sizes: "(max-width: 152px) 100vw, 152px",
    },
    title: <>NFT PHOTOGRAPHY</>,
    noMargin: true,
    links: [
      {
        label: (
          <>
            <u>6529 PHOTO A</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=108.57x2.8x348.03x-1.62",
          museum: "/museum/6529-photo-a/",
        },
      },
      {
        label: (
          <>
            <u>6529 PHOTO B</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=107.85x2.8x393.99x-1.59",
          museum: "/museum/6529-photo-b/",
        },
      },
    ],
    numbers: {
      om: {
        column: 5,
        imageframe: 4,
        title: 5,
        text: 4,
        nestedImg: 4,
        nestedText: 5,
      },
      museum: {
        column: 6,
        imageframe: 5,
        title: 4,
        text: 4,
        nestedImg: 4,
        nestedText: 5,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 190,
      height: 190,
      title: "GeneralAssembly",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/GeneralAssembly.png",
      wpImage: 166,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/GeneralAssembly-66x66.png 66w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/GeneralAssembly-150x150.png 150w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/GeneralAssembly.png 190w",
      sizes: "(max-width: 190px) 100vw, 190px",
    },
    title: <>6529 GENERAL ASSEMBLY</>,
    noMargin: true,
    links: [
      {
        label: (
          <>
            <u>GENERAL ASSEMBLY</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-117.88x2.8x76.13x1.53",
          museum: "/museum/general-assembly/",
        },
      },
    ],
    numbers: {
      om: {
        column: 6,
        imageframe: 5,
        title: 6,
        text: 5,
        nestedImg: 6,
        nestedText: 7,
      },
      museum: {
        column: 7,
        imageframe: 6,
        title: 5,
        text: 5,
        nestedImg: 6,
        nestedText: 7,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 151,
      height: 150,
      title: "6529Fam",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/6529Fam.png",
      wpImage: 158,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/6529Fam-66x66.png 66w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/6529Fam.png 151w",
      sizes: "(max-width: 151px) 100vw, 151px",
    },
    title: <>6529 FAM</>,
    noMargin: true,
    links: [
      {
        label: (
          <>
            <u>6529 FAM 2021</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=69.65x2.8x-96.75x0.02",
          museum: "/museum/6529-fam-2021/",
        },
      },
      {
        label: (
          <>
            <u>6529 GRADIENT COLLECTOR CURATED</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=80.16x2.8x-97.23x0.05",
          museum: "/museum/6529-gradient-collector-curated/",
        },
      },
      {
        label: (
          <>
            <u>6529 PUBLIC DOMAIN</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=90.32x2.8x-97.37x0.01",
          museum: "/museum/6529-public-domain/",
        },
      },
    ],
    numbers: {
      om: {
        column: 7,
        imageframe: 6,
        title: 7,
        text: 6,
        nestedImg: 8,
        nestedText: 9,
      },
      museum: {
        column: 8,
        imageframe: 7,
        title: 6,
        text: 6,
        nestedImg: 8,
        nestedText: 9,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 173,
      height: 174,
      title: "TheInstitutions",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/TheInstitutions.png",
      wpImage: 170,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/TheInstitutions-66x66.png 66w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/TheInstitutions-150x150.png 150w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/TheInstitutions.png 173w",
      sizes: "(max-width: 173px) 100vw, 173px",
    },
    title: <>THE INSTITUTIONS</>,
    noMargin: true,
    links: [
      {
        label: (
          <>
            <u>6529 FUND SZN1</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-99.64x2.8x-30.16x1.61",
          museum: "/museum/6529-fund-szn1/",
        },
      },
    ],
    numbers: {
      om: {
        column: 8,
        imageframe: 7,
        title: 8,
        text: 7,
        nestedImg: 10,
        nestedText: 11,
      },
      museum: {
        column: 9,
        imageframe: 8,
        title: 7,
        text: 7,
        nestedImg: 10,
        nestedText: 11,
      },
    },
  },
  {
    kind: "titleLinkCard",
    image: {
      width: 217,
      height: 217,
      title: "Sunshine",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/Sunshine.png",
      wpImage: 168,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/Sunshine-200x200.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/Sunshine.png 217w",
      sizes: "(max-width: 640px) 100vw, 217px",
    },
    label: (
      <>
        <u>SUNSHINE SQUARE</u>
      </>
    ),
    href: {
      om: "https://oncyber.io/6529om?coords=-0.99x2.8x-181.98x-0.13",
      museum: "/museum/sunshine-square/",
    },
    numbers: {
      om: { column: 9, imageframe: 8, title: 9, nestedImg: 12, nestedText: 13 },
      museum: {
        column: 10,
        imageframe: 9,
        title: 8,
        nestedImg: 12,
        nestedText: 13,
      },
    },
  },
  {
    kind: "titleLinkCard",
    image: {
      width: 146,
      height: 190,
      title: "TempleGM",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/TempleGM.png",
      wpImage: 169,
    },
    label: (
      <>
        <u>TEMPLE OF GM</u>
      </>
    ),
    href: {
      om: "https://oncyber.io/6529om?coords=-74.35x2.8x-107.85x-0.17",
      museum: "/museum/temple-of-gm/",
    },
    numbers: {
      om: {
        column: 10,
        imageframe: 9,
        title: 10,
        nestedImg: 14,
        nestedText: 15,
      },
      museum: {
        column: 11,
        imageframe: 10,
        title: 9,
        nestedImg: 14,
        nestedText: 15,
      },
    },
  },
  {
    kind: "titleLinkCard",
    image: {
      width: 291,
      height: 106,
      title: "ACKBar",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/ACKBar.png",
      wpImage: 160,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/ACKBar-200x73.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/ACKBar.png 291w",
      sizes: "(max-width: 640px) 100vw, 291px",
    },
    label: (
      <>
        <u>ACK BAR</u>
      </>
    ),
    href: {
      om: "https://oncyber.io/6529om?coords=106.87x2.8x447.93x-2.55",
      museum: "/museum/ack-bar/",
    },
    numbers: {
      om: {
        column: 11,
        imageframe: 10,
        title: 11,
        nestedImg: 16,
        nestedText: 17,
      },
      museum: {
        column: 12,
        imageframe: 11,
        title: 10,
        nestedImg: 16,
        nestedText: 17,
      },
    },
  },
  {
    kind: "heading",
    text: { om: <>6529 TEAM MUSEUMS</>, museum: <>6529 TEAM MUSEUMS</> },
    numbers: {
      om: { column: 12, title: 12 },
      museum: { column: 13, title: 11 },
    },
  },
  {
    kind: "card",
    image: {
      width: 178,
      height: 158,
      title: "BKMuseum",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/BKMuseum.png",
      wpImage: 163,
    },
    title: <>BHARAT KRYMO MUSEUM</>,
    noMargin: false,
    links: [
      {
        label: (
          <>
            <u>BHARAT KRYMO MUSEE D'ART 1</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-144.52x2.8x218.64x1.37",
          museum: "/museum/bharat-krymo-museum-1/",
        },
      },
      {
        label: (
          <>
            <u>BHARAT KRYMO MUSEE D'ART 2</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-125.23x2.8x195.75x1.32",
          museum: "/museum/bharat-krymo-museum-2/",
        },
      },
      {
        label: (
          <>
            <u>BHARAT KRYMO MUSEE D'ART 3</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-141.26x2.8x158.47x1.68",
          museum: "/museum/bharat-krymo-museum-3/",
        },
      },
    ],
    numbers: {
      om: {
        column: 13,
        imageframe: 11,
        title: 13,
        text: 8,
        nestedImg: 18,
        nestedText: 19,
      },
      museum: {
        column: 14,
        imageframe: 12,
        title: 12,
        text: 8,
        nestedImg: 18,
        nestedText: 19,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 241,
      height: 136,
      title: "BSYMuseum]",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/BSYMuseum.png",
      wpImage: 164,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/BSYMuseum-200x113.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/BSYMuseum.png 241w",
      sizes: "(max-width: 640px) 100vw, 241px",
    },
    title: <>BATSOUPYUM MUSEUM</>,
    noMargin: false,
    links: [
      {
        label: (
          <>
            <u>BATSOUPCAVE</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-122.69x2.8x330.00x1.33",
          museum: "/museum/batsoupyum-museum-1/",
        },
      },
      {
        label: (
          <>
            <u>BATSOUPLOUNGE</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-120.46x2.8x320.42x1.39",
          museum: "/museum/batsoupyum-museum-2/",
        },
      },
    ],
    numbers: {
      om: {
        column: 14,
        imageframe: 12,
        title: 14,
        text: 9,
        nestedImg: 20,
        nestedText: 21,
      },
      museum: {
        column: 15,
        imageframe: 13,
        title: 13,
        text: 9,
        nestedImg: 20,
        nestedText: 21,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 159,
      height: 158,
      title: "ACMuseum",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/ACMuseum.png",
      wpImage: 161,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/ACMuseum-66x66.png 66w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/ACMuseum-150x150.png 150w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/ACMuseum.png 159w",
      sizes: "(max-width: 159px) 100vw, 159px",
    },
    title: <>AC MUSEUM</>,
    noMargin: false,
    links: [
      {
        label: (
          <>
            <u>AC COLLECTION</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-139.01x14.52x402.20x1.49",
          museum: "/museum/ac-museum/",
        },
      },
    ],
    numbers: {
      om: {
        column: 15,
        imageframe: 13,
        title: 15,
        text: 10,
        nestedImg: 22,
        nestedText: 23,
      },
      museum: {
        column: 16,
        imageframe: 14,
        title: 14,
        text: 10,
        nestedImg: 22,
        nestedText: 23,
      },
    },
  },
  {
    kind: "card",
    image: {
      width: 255,
      height: 129,
      title: "BFHMuseum",
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/BFHMuseum.png",
      wpImage: 172,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/BFHMuseum-200x101.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/03/BFHMuseum.png 255w",
      sizes: "(max-width: 640px) 100vw, 255px",
    },
    title: <>BONAFIDEHAN MUSEUM</>,
    noMargin: false,
    links: [
      {
        label: (
          <>
            <u>BONAFIDEHAN GALLERY</u>
          </>
        ),
        href: {
          om: "https://oncyber.io/6529om?coords=-119.63x2.8x472.51x1.51",
          museum: "/museum/bonafidehan-museum/",
        },
      },
    ],
    numbers: {
      om: {
        column: 16,
        imageframe: 14,
        title: 16,
        text: 11,
        nestedImg: 24,
        nestedText: 25,
      },
      museum: {
        column: 17,
        imageframe: 15,
        title: 15,
        text: 11,
        nestedImg: 24,
        nestedText: 25,
      },
    },
  },
];
