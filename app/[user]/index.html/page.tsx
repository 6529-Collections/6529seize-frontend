import CmsPageRenderer from "@/components/cms/public/CmsPageRenderer";
import { getAppMetadata } from "@/components/providers/metadata";
import { getPublishedPrimaryCmsSiteForProfileIdentifier } from "@/lib/cms/profile-sites";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  readonly params: Promise<{
    readonly user: string;
  }>;
};

export function generateStaticParams() {
  return [{ user: "punk6529" }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { user } = await params;
  const site = await getPublishedPrimaryCmsSiteForProfileIdentifier(user);
  if (!site) {
    notFound();
  }

  const social = site.cmsPackage.payload.page.social;
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

export default async function ProfileCmsHomePage({ params }: PageProps) {
  const { user } = await params;
  const site = await getPublishedPrimaryCmsSiteForProfileIdentifier(user);
  if (!site) {
    notFound();
  }

  return <CmsPageRenderer cmsPackage={site.cmsPackage} />;
}
