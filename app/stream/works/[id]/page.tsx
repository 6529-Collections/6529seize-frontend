import { notFound } from "next/navigation";

import WorkPage from "@/components/stream/pages/WorkPage";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";
import { parseWorkKey } from "@/lib/stream/workKey";

type Params = { readonly params: Promise<{ id: string }> };

/**
 * Any variant: a bare 6529 Stream token ID, or `<contract>-<tokenId>`. Next
 * passes the segment already decoded; decoding it again would throw on `%`.
 */
export default async function Page({ params }: Params) {
  assertStreamProduct();
  const { id } = await params;
  if (parseWorkKey(id) === null) {
    notFound();
  }
  return <WorkPage workKey={id} />;
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return streamPageMetadata(
    "stream.work.metadataTitle",
    `/stream/works/${encodeURIComponent(id)}`,
    { id }
  );
}
