import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import RememePage from "@/components/rememes/RememePage";
import { publicEnv } from "@/config/env";
import { formatAddress } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { fetchUrl } from "@/services/6529api";
import styles from "@/styles/Home.module.scss";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Rememe } from "@/entities/INFT";
import type { Metadata } from "next";

const getNonEmptyText = (value: string | undefined): string | undefined => {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : undefined;
};

const getRememeCollectionName = (rememe?: Rememe): string =>
  getNonEmptyText(rememe?.contract_opensea_data.collectionName) ?? "ReMemes";

const getRememeName = (rememe: Rememe): string | undefined => {
  const metadata = rememe.metadata as { name?: unknown };
  return typeof metadata.name === "string"
    ? getNonEmptyText(metadata.name)
    : undefined;
};

const getNonEmptyRecordText = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? getNonEmptyText(value) : undefined;
};

const getRememeMediaImage = (media: unknown): string | undefined => {
  if (Array.isArray(media)) {
    return media.find((item): item is { gateway: string } => {
      if (item === null || item === undefined || typeof item !== "object") {
        return false;
      }
      const gateway = (item as Record<string, unknown>)["gateway"];
      return typeof gateway === "string" && gateway.trim().length > 0;
    })?.gateway;
  }

  if (media === null || media === undefined || typeof media !== "object") {
    return undefined;
  }

  const mediaRecord = media as Record<string, unknown>;
  return (
    getNonEmptyRecordText(mediaRecord, "thumbnailUrl") ??
    getNonEmptyRecordText(mediaRecord, "cachedUrl") ??
    getNonEmptyRecordText(mediaRecord, "pngUrl") ??
    getNonEmptyRecordText(mediaRecord, "originalUrl")
  );
};

const getRememeImage = (rememe?: Rememe): string | undefined => {
  if (!rememe) {
    return undefined;
  }

  const mediaImage = getRememeMediaImage(rememe.media);

  return (
    getNonEmptyText(rememe.s3_image_scaled) ??
    getNonEmptyText(rememe.s3_image_original) ??
    getNonEmptyText(rememe.image) ??
    mediaImage ??
    getNonEmptyText(rememe.contract_opensea_data.imageUrl)
  );
};

export default async function ReMeme({
  params,
}: {
  readonly params: Promise<{ contract: string; id: string }>;
}) {
  const { contract, id } = await params;

  return (
    <main className={styles["main"]}>
      <RememePage contract={contract} id={id} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ contract: string; id: string }>;
}): Promise<Metadata> {
  const { contract, id } = await params;
  let name = `${formatAddress(contract)} #${id}`;
  let rememe: Rememe | undefined;

  try {
    const headers = await getAppCommonHeaders();
    const response = await fetchUrl<DBResponse<Rememe>>(
      `${publicEnv.API_ENDPOINT}/api/rememes?contract=${contract}&id=${id}`,
      { headers }
    );

    const firstRememe = response.data[0];
    if (firstRememe !== undefined) {
      rememe = firstRememe;
      const rememeName = getRememeName(rememe);
      if (rememeName !== undefined) {
        name = rememeName;
      }
    }
  } catch (error) {
    console.error(
      `Failed to load ReMeme metadata for ${contract} #${id}`,
      error
    );
  }

  const collectionName = getRememeCollectionName(rememe);

  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: name,
      description: "ReMemes",
      ogImage: getNftSocialCardImagePath({
        badge: "ReMemes",
        collection: collectionName,
        contract,
        id,
        image: getRememeImage(rememe),
        subtitle: `${collectionName} #${id} | ReMemes`,
        title: name,
      }),
      ogImageAlt: `${name} ReMeme social card`,
    })
  );
}
