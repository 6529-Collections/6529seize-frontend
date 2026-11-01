import { ArtistsIndexPage } from "@/components/stream/pages/ArtistPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <ArtistsIndexPage />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.artists.title", "/stream/artists");
