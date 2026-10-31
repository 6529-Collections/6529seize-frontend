import { LaunchPage } from "@/components/stream/pages/FederatedPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <LaunchPage />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.launch.title", "/stream/launch");
