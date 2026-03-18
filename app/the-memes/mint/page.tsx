import {
  getTheMemesMintMetadata,
  TheMemesMintPageShell,
} from "@/components/the-memes/TheMemesMintPageShell";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import type { Metadata } from "next";

export default async function TheMemesMintPage() {
  const headers = await getAppCommonHeaders();
  const nft = await commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: "memes_latest",
    headers,
  });
  return <TheMemesMintPageShell nft={nft} />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getTheMemesMintMetadata();
}
