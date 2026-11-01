import { LaunchWizard } from "@/components/stream/federated/LaunchWizard";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <LaunchWizard />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.launch.title", "/stream/launch");
