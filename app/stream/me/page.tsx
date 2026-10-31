import MePage from "@/components/stream/pages/MePage";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <MePage />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.me.title", "/stream/me");
