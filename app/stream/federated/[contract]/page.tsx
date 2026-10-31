import { notFound } from "next/navigation";

import { FederatedContractPage } from "@/components/stream/pages/FederatedPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";
import type { Address } from "@/lib/stream/types";

type Params = { readonly params: Promise<{ contract: string }> };

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export default async function Page({ params }: Params) {
  assertStreamProduct();
  const { contract } = await params;
  if (!ADDRESS.test(contract)) {
    notFound();
  }
  return <FederatedContractPage address={contract.toLowerCase() as Address} />;
}

export async function generateMetadata({ params }: Params) {
  const { contract } = await params;
  return streamPageMetadata(
    "stream.federated.metadataTitle",
    `/stream/federated/${encodeURIComponent(contract.toLowerCase())}`
  );
}
