import {
  asRecord,
  isTokenNumber,
  text,
  withOgApiJson,
} from "@/app/api/og-metadata/_lib/apiMetadata";

const MAX_IMAGE_URL_LENGTH = 8192;

const NEXTGEN_COLLECTION_ID_PATTERN = /^\d{1,9}$/;

interface NextgenCollectionCardMetadata {
  readonly name: string;
  readonly imageUrl: string | null;
}

/** Resolve a NextGen collection's card text and artwork from the API. */
export async function fetchNextgenCollectionCard(
  id: string,
  signal?: AbortSignal
): Promise<NextgenCollectionCardMetadata | null> {
  if (!NEXTGEN_COLLECTION_ID_PATTERN.test(id)) return null;
  try {
    return await withOgApiJson(signal, async (fetchJson) => {
      const collection = asRecord(
        await fetchJson(["nextgen", "collections", id])
      );
      const name = text(collection?.["name"]);
      if (collection === null || name === null) return null;
      if (collection["id"] !== Number(id)) return null;
      return {
        name,
        imageUrl:
          text(collection["banner"], MAX_IMAGE_URL_LENGTH) ??
          text(collection["image"], MAX_IMAGE_URL_LENGTH),
      };
    });
  } catch {
    return null;
  }
}

/** Resolve the latest The Memes mint title from the API. */
export async function fetchLatestMemeMintTitle(
  signal?: AbortSignal
): Promise<string | null> {
  try {
    return await withOgApiJson(signal, async (fetchJson) => {
      const nft = asRecord(await fetchJson(["memes_latest"]));
      const id = nft?.["id"];
      const name = text(nft?.["name"]);
      return isTokenNumber(id) && name !== null
        ? `Mint #${id} | ${name} | The Memes`
        : null;
    });
  } catch {
    return null;
  }
}
