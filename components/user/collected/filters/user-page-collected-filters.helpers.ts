import { CollectedCollectionType } from "../../../../entities/IProfile";

interface CollectedCollectionMeta {
  readonly label: string;
  readonly showCardDataRow: boolean;
  readonly cardPath: string;
}

export const COLLECTED_COLLECTIONS_META: Record<
  CollectedCollectionType,
  CollectedCollectionMeta
> = {
  [CollectedCollectionType.MEMES]: {
    label: "The Memes",
    showCardDataRow: true,
    cardPath: "/the-memes/",
  },
  [CollectedCollectionType.GRADIENTS]: {
    label: "Gradients",
    showCardDataRow: true,
    cardPath: "/6529-gradient/",
  },
  [CollectedCollectionType.NEXTGEN]: {
    label: "NextGen",
    showCardDataRow: true,
    cardPath: "/nextgen/token/",
  },
  [CollectedCollectionType.MEMELAB]: {
    label: "Meme Lab",
    showCardDataRow: false,
    cardPath: "/meme-lab/",
  },
};

export const convertAddressToLowerCase = (address: any) =>
  typeof address === "string" && address.length ? address.toLowerCase() : null;
