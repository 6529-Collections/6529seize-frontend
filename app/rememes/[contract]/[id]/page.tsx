import { getAppMetadata } from "@/components/providers/metadata";
import RememePage from "@/components/rememes/RememePage";
import { publicEnv } from "@/config/env";
import { formatAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import styles from "@/styles/Home.module.scss";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Rememe } from "@/entities/INFT";
import type { Metadata } from "next";

export default async function ReMeme({
  params,
}: {
  readonly params: Promise<{ contract: string; id: string }>;
}) {
  const { contract, id } = await params;

  return (
    <main className={styles.main}>
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
  let image = `${publicEnv.BASE_ENDPOINT}/6529io.png`;
  try {
    const response = await fetchUrl<DBResponse<Rememe>>(
      `${publicEnv.API_ENDPOINT}/api/rememes?contract=${contract}&id=${id}`
    );

    if (response?.data?.length > 0) {
      if (response.data[0].metadata?.name) {
        name = response.data[0].metadata.name;
      }
      if (response.data[0].image) {
        image = response.data[0].image;
      }
    }
  } catch (error) {
    console.error(
      `Failed to load ReMeme metadata for ${contract} #${id}`,
      error
    );
  }

  return getAppMetadata({
    title: name,
    ogImage: image ?? `${publicEnv.BASE_ENDPOINT}/re-memes-b.jpeg`,
    description: `ReMemes`,
    twitterCard: "summary",
  });
}
