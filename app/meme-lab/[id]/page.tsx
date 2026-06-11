import styles from "@/styles/Home.module.scss";

import MemeLabPageComponent from "@/components/memelab/MemeLabPage";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import JsonLdScript from "@/lib/structured-data/json-ld";
import {
  buildNftPageJsonLd,
  fetchNftForStructuredData,
} from "@/lib/structured-data/nft";
import type { Metadata } from "next";

export default async function MemeLabPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nft = await fetchNftForStructuredData({
    contract: MEMELAB_CONTRACT,
    id,
    apiPath: "nfts_memelab",
  });

  return (
    <main className={styles["main"]}>
      <JsonLdScript
        data={buildNftPageJsonLd({
          nft,
          path: `/meme-lab/${id}`,
          fallbackName: `Meme Lab #${id}`,
          collectionName: "Meme Lab",
          collectionPath: "/meme-lab",
        })}
      />
      <MemeLabPageComponent nftId={id} />
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { focus } = await searchParams;
  return getSharedAppServerSideProps(MEMELAB_CONTRACT, id, focus);
}
