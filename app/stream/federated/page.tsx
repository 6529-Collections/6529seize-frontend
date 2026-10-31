import { FederatedDirectoryPage } from "@/components/stream/federated/FederatedDirectoryPage";
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
