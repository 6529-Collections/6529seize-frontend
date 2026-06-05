import { publicEnv } from "@/config/env";
import type { PageSSRMetadata } from "@/helpers/Types";
import type { Metadata } from "next";

export function getAppMetadata(
  customMetadata?: Partial<PageSSRMetadata>
): Metadata {
  const baseEndpoint = publicEnv.BASE_ENDPOINT;
  const isStaging = baseEndpoint.includes("staging");

  const title =
    customMetadata?.title ?? (isStaging ? "6529 Staging" : "6529.io");
  const description = customMetadata?.description ?? "";
  const ogImage = customMetadata?.ogImage ?? `${baseEndpoint}/6529io.png`;
  const ogImageHeight = customMetadata?.ogImageHeight;
  const ogImageWidth = customMetadata?.ogImageWidth;
  const twitterCard = customMetadata?.twitterCard ?? "summary";
  const openGraphImages =
    ogImageHeight && ogImageWidth
      ? [{ url: ogImage, width: ogImageWidth, height: ogImageHeight }]
      : [ogImage];

  const domain = isStaging ? "staging.6529.io" : "6529.io";

  return {
    title,
    description: description ? `${description} | ${domain}` : domain,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      siteName: "6529.io",
      images: openGraphImages,
      title,
      description: description ? `${description} | ${domain}` : domain,
    },
    twitter: {
      card: twitterCard,
      site: "@6529Collections",
    },
    other: {
      version: publicEnv.VERSION ?? "",
    },
  };
}
