import { notFound } from "next/navigation";

import { EditionPage } from "@/components/stream/pages/EditionPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";
import { parseWorkKey } from "@/lib/stream/workKey";

type Params = { readonly params: Promise<{ id: string }> };

/** A master's token ID (6529 Stream Editions) or a federated `<contract>-<id>`. */
export default async function Page({ params }: Params) {
  assertStreamProduct();
  const { id } = await params;
  const key = decodeURIComponent(id);
  if (parseWorkKey(key) === null) {
    notFound();
  }
  return <EditionPage param={key} />;
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return streamPageMetadata(
    "stream.edition.metadataTitle",
    `/stream/editions/${id}`,
    {
      id: decodeURIComponent(id),
    }
  );
}
