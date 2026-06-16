import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CmsPageRenderer from "@/components/cms/public/CmsPageRenderer";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  cmsFixtureSlugs,
  getCmsFixturePackage,
  type CmsFixtureSlug,
} from "@/lib/cms/fixtures";

type CmsFixturePageProps = {
  readonly params: Promise<{
    readonly fixture: string;
  }>;
};

export function generateStaticParams(): { fixture: CmsFixtureSlug }[] {
  return cmsFixtureSlugs.map((fixture) => ({ fixture }));
}

export async function generateMetadata({
  params,
}: CmsFixturePageProps): Promise<Metadata> {
  const { fixture } = await params;
  const cmsPackage = getCmsFixturePackage(fixture);
  if (!cmsPackage) {
    notFound();
  }

  const social = cmsPackage.payload.page.social;
  return getAppMetadata({
    title: social.title,
    description: social.description,
    ogImage: social.open_graph_image.url,
    ogImageAlt: social.open_graph_image.alt,
    ogImageHeight: social.open_graph_image.height,
    ogImageWidth: social.open_graph_image.width,
    twitterCard: "summary_large_image",
  });
}

export default async function CmsFixturePage({ params }: CmsFixturePageProps) {
  const { fixture } = await params;
  const cmsPackage = getCmsFixturePackage(fixture);
  if (!cmsPackage) {
    notFound();
  }

  return <CmsPageRenderer cmsPackage={cmsPackage} />;
}
