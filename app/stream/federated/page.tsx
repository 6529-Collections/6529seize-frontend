import { FederatedDirectoryPage } from "@/components/stream/pages/FederatedPages";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <FederatedDirectoryPage />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.federated.title", "/stream/federated");
