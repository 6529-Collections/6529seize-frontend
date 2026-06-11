import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import RememePage from "@/components/rememes/RememePage";
import { publicEnv } from "@/config/env";
import { formatAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import styles from "@/styles/Home.module.scss";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Rememe } from "@/entities/INFT";
import type { Metadata } from "next";

const getRememeCollectionName = (rememe?: Rememe): string =>
  rememe?.contract_opensea_data?.collectionName?.trim() || "ReMemes";

const getRememeImage = (rememe?: Rememe): string | undefined =>
  rememe?.s3_image_scaled ||
  rememe?.s3_image_original ||
  rememe?.image ||
  rememe?.media?.find((media) => media.gateway)?.gateway ||
  rememe?.contract_opensea_data?.imageUrl ||
  undefined;

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
    const response = await fetchUrl<DBResponse<Rememe>>(
      `${publicEnv.API_ENDPOINT}/api/rememes?contract=${contract}&id=${id}`
    );

    if (response?.data?.length > 0) {
      rememe = response.data[0];
      if (rememe?.metadata?.name) {
        name = rememe.metadata.name;
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
