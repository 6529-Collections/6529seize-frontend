import { notFound } from "next/navigation";

import StreamAboutPage from "@/components/stream/about/StreamAboutPage";
import {
  STREAM_ABOUT_KEYS,
  STREAM_ABOUT_PAGES,
  type StreamAboutPage as AboutPage,
} from "@/components/stream/layout/streamNavigation";
import {
  assertStreamProduct,
  streamPageMetadata,
} from "@/lib/stream/route.server";

type Params = { readonly params: Promise<{ page: string }> };

/** The explainers other than the overview, which is /stream/about itself. */
function explainer(page: string): Exclude<AboutPage, "overview"> | null {
  const match = STREAM_ABOUT_PAGES.find(
    (candidate) => candidate === page && candidate !== "overview"
  );
  return match === undefined || match === "overview" ? null : match;
}

export default async function Page({ params }: Params) {
  assertStreamProduct();
  const page = explainer((await params).page);
  if (page === null) {
    notFound();
  }
  return <StreamAboutPage page={page} />;
}

export async function generateMetadata({ params }: Params) {
  const page = explainer((await params).page) ?? "developers";
  return streamPageMetadata(
    `stream.about.${STREAM_ABOUT_KEYS[page]}.title`,
    `/stream/about/${page}`
  );
}
