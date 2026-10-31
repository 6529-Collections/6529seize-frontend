import { notFound } from "next/navigation";

import { EditionPage } from "@/components/stream/pages/EditionPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";
import { parseWorkKey } from "@/lib/stream/workKey";

type Params = { readonly params: Promise<{ id: string }> };

/**
 * A master's token ID (6529 Stream Editions) or a federated `<contract>-<id>`.
 * Next passes the segment already decoded; decoding it again would throw on `%`.
 */
export default async function Page({ params }: Params) {
  assertStreamProduct();
  const { id } = await params;
  if (parseWorkKey(id) === null) {
    notFound();
  }
  return <EditionPage param={id} />;
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return streamPageMetadata(
    "stream.edition.metadataTitle",
    `/stream/editions/${encodeURIComponent(id)}`,
    { id }
  );
}
