import MemePageComponent from "@/components/the-memes/MemePage";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "@/constants/constants";
import JsonLdScript from "@/lib/structured-data/json-ld";
import {
  buildNftPageJsonLd,
  fetchNftForStructuredData,
} from "@/lib/structured-data/nft";
import type { Metadata } from "next";

export default async function MemePage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nft = await fetchNftForStructuredData({
    contract: MEMES_CONTRACT,
    id,
  });

  return (
    <>
      <JsonLdScript
        data={buildNftPageJsonLd({
          nft,
          path: `/the-memes/${id}`,
          fallbackName: `The Memes #${id}`,
          collectionName: "The Memes by 6529",
          collectionPath: "/the-memes",
        })}
      />
      <MemePageComponent nftId={id} />
    </>
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
  return getSharedAppServerSideProps(MEMES_CONTRACT, id, focus);
}
