import { EditionsIndexPage } from "@/components/stream/pages/EditionPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <EditionsIndexPage />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.editions.title", "/stream/editions");
