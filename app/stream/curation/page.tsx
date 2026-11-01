import { CurationPage } from "@/components/stream/pages/CurationPage";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <CurationPage />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.curation.title", "/stream/curation");
