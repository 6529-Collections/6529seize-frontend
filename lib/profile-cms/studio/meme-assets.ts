import type { CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";

const JPEG_MIME_TYPE = "image/jpeg";

export interface CmsStudioMemeWork {
  readonly cardId: number;
  readonly title: string;
  readonly artist: string;
  readonly url: string;
  readonly metadataUri: string;
  readonly asset: CmsAssetV1;
}

/** Exact original media from The Memes metadata; derivatives need their own hashes.
 * The selection is curated, not a statistical popularity ranking.
 */
export const CMS_STUDIO_MEME_WORKS: readonly CmsStudioMemeWork[] = [
  {
    cardId: 1,
    title: "6529Seizing",
    artist: "6529er",
    url: "https://6529.io/the-memes/1",
    metadataUri:
      "https://arweave.net/Jv9qMwx8lfuPMch9S_aBFk9-ENL1lWtbEV4zqWytJAM",
    asset: {
      id: "meme-1",
      kind: "image",
      uri: "https://arweave.net/eu-bNSvl6cRsi0DwZud2QRfOmaan-a6kI8OpWBkbyl0",
      content_hash:
        "sha256:fbc359a45841009abdfdfc984db2df75a790f9757010a3809337a700836badae",
      mime_type: JPEG_MIME_TYPE,
      width: 3241,
      height: 4744,
      file_size_bytes: 480353,
      alt_text: "6529Seizing by 6529er, The Memes card #1.",
      rights:
        "CC0 artwork: 6529Seizing by 6529er. The Memes #1. Source: https://6529.io/the-memes/1. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 2,
    title: "SeizeJPGs",
    artist: "6529er",
    url: "https://6529.io/the-memes/2",
    metadataUri:
      "https://arweave.net/mSZwo2unZ9WmKf-DgDhMmc-PRmegaKnn_jI_43RSdKQ",
    asset: {
      id: "meme-2",
      kind: "image",
      uri: "https://arweave.net/-MkTbohLWHDR66ufDwGJiTaBG1jZFMpTaTwwtLCPoSg",
      content_hash:
        "sha256:340363892b0cc7678b2e4aa356be65532c9b65be759796ab765d1b4b3f43db16",
      mime_type: JPEG_MIME_TYPE,
      width: 3241,
      height: 4744,
      file_size_bytes: 1485466,
      alt_text: "SeizeJPGs by 6529er, The Memes card #2.",
      rights:
        "CC0 artwork: SeizeJPGs by 6529er. The Memes #2. Source: https://6529.io/the-memes/2. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 4,
    title: "NakamotoFreedom",
    artist: "6529er",
    url: "https://6529.io/the-memes/4",
    metadataUri:
      "https://arweave.net/FJSRAk8oJypmGce-TanpBu7bQZGlGm7XVKhrXLCmwGo",
    asset: {
      id: "meme-4",
      kind: "image",
      uri: "https://arweave.net/lYUFW-vRUNYZC0Mlw45_uua_9KzCF4vwE3-aRU-5SVI",
      content_hash:
        "sha256:5ad18ab43460c8712c8b154e1d38c0e735d9ee0697135b940b875302e5b63fbe",
      mime_type: JPEG_MIME_TYPE,
      width: 3241,
      height: 4744,
      file_size_bytes: 1967396,
      alt_text: "NakamotoFreedom by 6529er, The Memes card #4.",
      rights:
        "CC0 artwork: NakamotoFreedom by 6529er. The Memes #4. Source: https://6529.io/the-memes/4. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 5,
    title: "rekt6529",
    artist: "OSF",
    url: "https://6529.io/the-memes/5",
    metadataUri:
      "https://arweave.net/KKXgahgxmbQ6aZDQvlIPKeDHek58_khryQGtvuZsNIw",
    asset: {
      id: "meme-5",
      kind: "image",
      uri: "https://arweave.net/WjpA-XWxKYVg6OI2TcOXZJpPw5Oh3wg-XhRyv9ZV3_s",
      content_hash:
        "sha256:1b67ca14866a10e5ded6e819c9af25f61fb388903ea068613574798d7aad1935",
      mime_type: "image/gif",
      width: 2048,
      height: 2732,
      file_size_bytes: 8474416,
      alt_text: "rekt6529 by OSF, The Memes card #5.",
      rights:
        "CC0 artwork: rekt6529 by OSF. The Memes #5. Source: https://6529.io/the-memes/5. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 8,
    title: "FirstGM",
    artist: "6529",
    url: "https://6529.io/the-memes/8",
    metadataUri:
      "https://arweave.net/f-XX_Zv-m9i84bTJmezdWkFRTHMFXL3lKcIXZyJEERk",
    asset: {
      id: "meme-8",
      kind: "image",
      uri: "https://arweave.net/4lazG3i2tb7esEYqdAEa1s_lJ4gY2vIP_wR8S_jLpL4",
      content_hash:
        "sha256:fa6490745eb9925a1487b8956bfdd19d36739ced8ba9ccb857defecd762b2cc9",
      mime_type: JPEG_MIME_TYPE,
      width: 1170,
      height: 806,
      file_size_bytes: 105288,
      alt_text: "FirstGM by 6529, The Memes card #8.",
      rights:
        "CC0 artwork: FirstGM by 6529. The Memes #8. Source: https://6529.io/the-memes/8. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 9,
    title: "The Institutions Are Coming",
    artist: "6529er",
    url: "https://6529.io/the-memes/9",
    metadataUri:
      "https://arweave.net/zrE2SGOIQGuUwnBtikwoThhNFx_nc6FcraQCB-YTnAo",
    asset: {
      id: "meme-9",
      kind: "image",
      uri: "https://arweave.net/ddmoXl2XeFoqk3qtc9cYElirXkUdZCVKxUvl5rv6c-Y",
      content_hash:
        "sha256:ae700fb90363f91f4ffff06424fa08794758bac80037d690a27c827b0ea356ec",
      mime_type: JPEG_MIME_TYPE,
      width: 2161,
      height: 2991,
      file_size_bytes: 6125364,
      alt_text: "The Institutions Are Coming by 6529er, The Memes card #9.",
      rights:
        "CC0 artwork: The Institutions Are Coming by 6529er. The Memes #9. Source: https://6529.io/the-memes/9. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 37,
    title: "Sgt. Pepe",
    artist: "Arsonic",
    url: "https://6529.io/the-memes/37",
    metadataUri:
      "https://arweave.net/kbe4EojT5F-YSs2Q5UoJ12d5KaNB1R-ZFiYvc6b5QHk",
    asset: {
      id: "meme-37",
      kind: "image",
      uri: "https://arweave.net/CLiT1eIwf-6ow_dVYBB61Nas0dow40cSUFjvSq_oyrs",
      content_hash:
        "sha256:e0e9664d89646a48d8afa3736c4e930c0f9387dc945b29804d9ced4b23a635ba",
      mime_type: JPEG_MIME_TYPE,
      width: 4480,
      height: 5720,
      file_size_bytes: 18397619,
      alt_text: "Sgt. Pepe by Arsonic, The Memes card #37.",
      rights:
        "CC0 artwork: Sgt. Pepe by Arsonic. The Memes #37. Source: https://6529.io/the-memes/37. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 47,
    title: "EXIT STRATEGY",
    artist: "XCOPY",
    url: "https://6529.io/the-memes/47",
    metadataUri:
      "https://arweave.net/F8zKA8wNE9VHS6IcoUsmrwOI-4i6QohLMuj0Y5bUj_M",
    asset: {
      id: "meme-47",
      kind: "image",
      uri: "https://arweave.net/B_j9Z1NTIt5QUGx_TTnAh0F93BMQ1FRAnDEg-TrehaE",
      content_hash:
        "sha256:0d8a5c1d829c0625a0dc7885718eaabf99b792eea8ce0c1e4280b0463e873264",
      mime_type: "image/gif",
      width: 2091,
      height: 3000,
      file_size_bytes: 16977727,
      alt_text: "EXIT STRATEGY by XCOPY, The Memes card #47.",
      rights:
        "CC0 artwork: EXIT STRATEGY by XCOPY. The Memes #47. Source: https://6529.io/the-memes/47. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 48,
    title: "Freedom to Explore",
    artist: "Cath Simard",
    url: "https://6529.io/the-memes/48",
    metadataUri:
      "https://arweave.net/Yh7_SQyiECHdU-RCWr64gqTwjcmI7PM7Xy9OvKGXFd0",
    asset: {
      id: "meme-48",
      kind: "image",
      uri: "https://arweave.net/Ud4ZqHkPHMAtVhLvIa-0hpa9c3FH5NvBXxRl_XC8yFQ",
      content_hash:
        "sha256:e8383e937a9bef06c13fbcca82a7d5d0952cf7cbae88b41e4ca8eb4dbdc27ae5",
      mime_type: JPEG_MIME_TYPE,
      width: 1920,
      height: 2400,
      file_size_bytes: 2838307,
      alt_text: "Freedom to Explore by Cath Simard, The Memes card #48.",
      rights:
        "CC0 artwork: Freedom to Explore by Cath Simard. The Memes #48. Source: https://6529.io/the-memes/48. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 52,
    title: "MEME FACTORY",
    artist: "Grant Riven Yun",
    url: "https://6529.io/the-memes/52",
    metadataUri:
      "https://arweave.net/9QxRoh8KyrWZb_KImmPWOWdpuKUEeEDuhosEW-yxKc4",
    asset: {
      id: "meme-52",
      kind: "image",
      uri: "https://arweave.net/80j_EJJG_w432PJGDoHpT9ktH1MtZzzwqU995_ciG8c",
      content_hash:
        "sha256:72e05de982018bf161b11014b0003fba391f1f615c86685f21d0265e53e4e2aa",
      mime_type: JPEG_MIME_TYPE,
      width: 4250,
      height: 5667,
      file_size_bytes: 5484347,
      alt_text: "MEME FACTORY by Grant Riven Yun, The Memes card #52.",
      rights:
        "CC0 artwork: MEME FACTORY by Grant Riven Yun. The Memes #52. Source: https://6529.io/the-memes/52. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 59,
    title: "Greedy Morning",
    artist: "Tyronejkd",
    url: "https://6529.io/the-memes/59",
    metadataUri:
      "https://arweave.net/7IpuKA7aM89IP4tf1lL6HHrreC7xtYasqz_8ldImvAc",
    asset: {
      id: "meme-59",
      kind: "image",
      uri: "https://arweave.net/IIxWtf3rHHhXtp4JiywwQtebUBw4qQQ0HiGhArmgIjM",
      content_hash:
        "sha256:1e2d0f431a5fc0578eb5b7ed994dbb146a11196ffe583a0e67fcad630c7c6e08",
      mime_type: "image/png",
      width: 1080,
      height: 1080,
      file_size_bytes: 1870757,
      alt_text: "Greedy Morning by Tyronejkd, The Memes card #59.",
      rights:
        "CC0 artwork: Greedy Morning by Tyronejkd. The Memes #59. Source: https://6529.io/the-memes/59. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 103,
    title: "Don't Trust, Check.",
    artist: "Jack Butcher",
    url: "https://6529.io/the-memes/103",
    metadataUri:
      "https://arweave.net/G0V_rGHGXur766ScCe74bagTlYS7Nhf2kM7WbazRAZ0",
    asset: {
      id: "meme-103",
      kind: "image",
      uri: "https://arweave.net/Z-6srTRuY8sCd6XZyWHwqmWtiW-LMgD6uVxZKvGOgqc",
      content_hash:
        "sha256:4eda22dd711d70563fcfe0f5a705023abb838b4752b2128009b9d00f1be3bb8d",
      mime_type: "image/png",
      width: 2160,
      height: 2160,
      file_size_bytes: 243765,
      alt_text: "Don't Trust, Check. by Jack Butcher, The Memes card #103.",
      rights:
        "CC0 artwork: Don't Trust, Check. by Jack Butcher. The Memes #103. Source: https://6529.io/the-memes/103. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 118,
    title: "The Socially Umpired Animals",
    artist: "Botto",
    url: "https://6529.io/the-memes/118",
    metadataUri:
      "https://arweave.net/q7SVyJMyDqqOcpLlshVpxl-AZtwLD0L_0bl6R3F8_GM",
    asset: {
      id: "meme-118",
      kind: "image",
      uri: "https://arweave.net/puMJ1mrbD3lAv5QA9bT5Vzf-au45QMXQ16Y1CSHb1Gg",
      content_hash:
        "sha256:ee5c894c22d7a79c91d9e4dbbf2c52d9e1c312017b3ead1a6a92309fd9fd7e82",
      mime_type: JPEG_MIME_TYPE,
      width: 2304,
      height: 2048,
      file_size_bytes: 1284728,
      alt_text: "The Socially Umpired Animals by Botto, The Memes card #118.",
      rights:
        "CC0 artwork: The Socially Umpired Animals by Botto. The Memes #118. Source: https://6529.io/the-memes/118. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 375,
    title: "The Tree of Knowledge of Good and Evil",
    artist: "ACK",
    url: "https://6529.io/the-memes/375",
    metadataUri:
      "https://arweave.net/aeW85Z-6hET78JcrRRgRg6Ig14p9HKXm3InZsGMKPnk",
    asset: {
      id: "meme-375",
      kind: "image",
      uri: "https://arweave.net/l8u02XnU5vLB2zvFoCKr4z2MUa5Dl4zeORP_OQWZ0fc",
      content_hash:
        "sha256:1e588dc5fa036fb2648f462ab5f74f517c855f29cd5e215bd3b33077fe4f0d50",
      mime_type: "image/png",
      width: 5500,
      height: 5940,
      file_size_bytes: 20267342,
      alt_text:
        "The Tree of Knowledge of Good and Evil by ACK, The Memes card #375.",
      rights:
        "CC0 artwork: The Tree of Knowledge of Good and Evil by ACK. The Memes #375. Source: https://6529.io/the-memes/375. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 537,
    title: "ＮＯ　ＨＵＭＡＮ　ＩＮＴＥＲＦＡＣＥ",
    artist: "MaNiC",
    url: "https://6529.io/the-memes/537",
    metadataUri:
      "https://arweave.net/oabF8gJ0t3efo1q8TF4KVjVovO3xyqjHh9ur5_Y-GTw",
    asset: {
      id: "meme-537",
      kind: "image",
      uri: "https://arweave.net/tqx3Gw4PZqYclMiyjtHydobRZi7IZYo989RQooU_6YA",
      content_hash:
        "sha256:50a2c76324526cbd1a373a847421c4aaa3e955ee028a82fe5d7294d8a8e99289",
      mime_type: "image/gif",
      width: 1000,
      height: 1000,
      file_size_bytes: 4919329,
      alt_text:
        "ＮＯ　ＨＵＭＡＮ　ＩＮＴＥＲＦＡＣＥ by MaNiC, The Memes card #537.",
      rights:
        "CC0 artwork: ＮＯ　ＨＵＭＡＮ　ＩＮＴＥＲＦＡＣＥ by MaNiC. The Memes #537. Source: https://6529.io/the-memes/537. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
  {
    cardId: 540,
    title: "Tears of the Desert",
    artist: "Ebrahim_Elmi",
    url: "https://6529.io/the-memes/540",
    metadataUri:
      "https://arweave.net/kkLBYsex6fR5BXndbq47XojNklUSLifn8wE2yUu2MKg",
    asset: {
      id: "meme-540",
      kind: "image",
      uri: "https://arweave.net/WILCqkT7L0Im3vGcTU7DalJ9cmnylnoC2n4w5b2T9rY",
      content_hash:
        "sha256:b9fc2eb47b25e0cb97d4f6e8d3a5a57a9b18603799036c4f9ed07f9ba325a4b2",
      mime_type: JPEG_MIME_TYPE,
      width: 4620,
      height: 6155,
      file_size_bytes: 22625460,
      alt_text: "Tears of the Desert by Ebrahim_Elmi, The Memes card #540.",
      rights:
        "CC0 artwork: Tears of the Desert by Ebrahim_Elmi. The Memes #540. Source: https://6529.io/the-memes/540. License: https://6529.io/about/license. Display does not claim NFT ownership, authorship or artist endorsement.",
      roles: ["original", "grid", "detail", "fullscreen"],
    },
  },
];

export const MEME_ART_ASSETS: readonly CmsAssetV1[] = CMS_STUDIO_MEME_WORKS.map(
  (work) => work.asset
);

export function getCmsStudioMemeWork(cardId: number): CmsStudioMemeWork {
  const work = CMS_STUDIO_MEME_WORKS.find((item) => item.cardId === cardId);
  if (!work) throw new Error("Unknown CMS template Meme card");
  return work;
}
