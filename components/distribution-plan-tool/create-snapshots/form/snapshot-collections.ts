import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";

export interface SnapshotCollectionSelection {
  readonly id: string;
  readonly address: string;
  readonly name: string;
  readonly tokenIds: string | null;
}

// Collection names are canonical proper names and snapshot data, not translated
// interface copy. Keep them identical across locales and backend submissions.
export const MEMES_SNAPSHOT_COLLECTION_NAME = "The Memes by 6529";

export const INTERN_JPGS_COLLECTION_ID =
  "0x495f947276749ce646f68ac8c248420045cb7b5e:opensea-6529internjpg";

// Keep these shortcuts aligned with allowlist-api's canonical metadata. They
// must remain available without a provider or metadata request.
export const SNAPSHOT_COLLECTIONS = [
  {
    id: MEMES_CONTRACT.toLowerCase(),
    address: MEMES_CONTRACT.toLowerCase(),
    name: MEMES_SNAPSHOT_COLLECTION_NAME,
    tokenType: "ERC1155",
    imageUrl: "https://6529.io/memes-preview.png",
  },
  {
    id: MEMELAB_CONTRACT,
    address: MEMELAB_CONTRACT,
    name: "Meme Lab",
    tokenType: "ERC1155",
    imageUrl:
      "https://i2c.seadn.io/ethereum/35e37c625ffb45f3a5e669d5b267a1ad/dd9de48b32f23da6535a028f1d8c36/d1dd9de48b32f23da6535a028f1d8c36.jpeg",
  },
  {
    id: GRADIENT_CONTRACT.toLowerCase(),
    address: GRADIENT_CONTRACT.toLowerCase(),
    name: "6529 Gradient",
    tokenType: "ERC721",
    imageUrl:
      "https://i2c.seadn.io/ethereum/9415f36597d64ab9be239e0c818430d4/dfbae56955745a231e038d7ad712ac/0fdfbae56955745a231e038d7ad712ac.png",
  },
  {
    id: "0x07e24ee32163da59297b5341bef8f8a2eead271e",
    address: "0x07e24ee32163da59297b5341bef8f8a2eead271e",
    name: "6529 RAW",
    tokenType: "ERC721",
    imageUrl:
      "https://i2c.seadn.io/ethereum/37e7c49010bc4d2ea70fe6908c0659a4/30ad5c9e46fc60931cb68ae69e36ea/3b30ad5c9e46fc60931cb68ae69e36ea.png",
  },
  {
    id: INTERN_JPGS_COLLECTION_ID,
    address: "0x495f947276749ce646f68ac8c248420045cb7b5e",
    name: "6529 Intern JPGs",
    tokenType: "ERC1155",
    imageUrl:
      "https://i2.seadn.io/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/b7b5b774da194235d7a5baf0fed900c8.png?h=250&w=250",
  },
] as const;
