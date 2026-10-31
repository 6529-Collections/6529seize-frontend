import { notFound } from "next/navigation";

import { ArtistPage } from "@/components/stream/pages/ArtistPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

type Params = { readonly params: Promise<{ id: string }> };

/** An artist ID: lowercase hex, as the renderer's `Artist ID` trait writes it. */
const ARTIST_ID = /^0x[0-9a-f]{1,64}$/;

export default async function Page({ params }: Params) {
  assertStreamProduct();
  const { id } = await params;
  // Next passes the segment already decoded.
  const artistId = id.toLowerCase();
  if (!ARTIST_ID.test(artistId)) {
    notFound();
  }
  return <ArtistPage artistId={artistId} />;
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return streamPageMetadata(
    "stream.artist.metadataTitle",
    `/stream/artists/${encodeURIComponent(id)}`
  );
}
