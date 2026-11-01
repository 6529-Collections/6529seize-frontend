import { MuseumPage } from "@/components/stream/pages/MuseumPage";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <MuseumPage />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.museum.title", "/stream/museum");
