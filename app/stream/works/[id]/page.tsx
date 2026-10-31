import { notFound } from "next/navigation";

import WorkPage from "@/components/stream/pages/WorkPage";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";
import { parseWorkKey } from "@/lib/stream/workKey";

type Params = { readonly params: Promise<{ id: string }> };

/** Any variant: a bare 6529 Stream token ID, or `<contract>-<tokenId>`. */
export default async function Page({ params }: Params) {
  assertStreamProduct();
  const { id } = await params;
  const key = decodeURIComponent(id);
  if (parseWorkKey(key) === null) {
    notFound();
  }
  return <WorkPage workKey={key} />;
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return streamPageMetadata(
    "stream.work.metadataTitle",
    `/stream/works/${id}`,
    {
      id: decodeURIComponent(id),
    }
  );
}
