import StreamAboutPage from "@/components/stream/about/StreamAboutPage";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

export default function Page() {
  assertStreamProduct();
  return <StreamAboutPage page="overview" />;
}

export const generateMetadata = () =>
  streamPageMetadata("stream.about.overview.title", "/stream/about");
