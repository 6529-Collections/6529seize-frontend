import { publicEnv } from "@/config/env";
import type { PageSSRMetadata } from "@/helpers/Types";
import type { Metadata } from "next";

export function getAppMetadata(
  customMetadata?: Partial<PageSSRMetadata>
): Metadata {
  const baseEndpoint = publicEnv.BASE_ENDPOINT;
  const isStaging = baseEndpoint.includes("staging");

  const title = customMetadata?.title ?? (isStaging ? "6529 Staging" : "6529");
  const description = customMetadata?.description ?? "";
  const ogImage = customMetadata?.ogImage ?? `${baseEndpoint}/6529io.png`;
  const twitterCard = customMetadata?.twitterCard ?? "summary";

  const domain = isStaging ? "staging.6529.io" : "6529.io";

  return {
    title,
    description: description ? `${description} | ${domain}` : domain,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      images: [ogImage],
      title,
      description: description ? `${description} | ${domain}` : domain,
    },
    twitter: {
      card: twitterCard,
    },
    other: {
      version: publicEnv.VERSION ?? "",
    },
  };
}
