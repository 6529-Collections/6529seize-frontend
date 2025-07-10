import { PageSSRMetadata } from "@/helpers/Types";
import { Metadata } from "next";

export function getPageMetadata({
  componentMetadata,
  pageMetadata,
}: {
  componentMetadata?: Partial<PageSSRMetadata>;
  pageMetadata?: Partial<PageSSRMetadata>;
}): PageSSRMetadata {
  const baseEndpoint = process.env.BASE_ENDPOINT!;
  const isStaging = baseEndpoint.includes("staging");

  const title =
    componentMetadata?.title ??
    pageMetadata?.title ??
    (isStaging ? "6529 Staging" : "6529");

  const description =
    componentMetadata?.description ?? pageMetadata?.description ?? "";

  const ogImage =
    componentMetadata?.ogImage ??
    pageMetadata?.ogImage ??
    `${baseEndpoint}/6529io.png`;

  const twitterCard =
    componentMetadata?.twitterCard ?? pageMetadata?.twitterCard ?? "summary";

  const domain = isStaging ? "staging.6529.io" : "6529.io";

  return {
    title,
    description: description ? `${description} | ${domain}` : domain,
    ogImage,
    twitterCard,
  };
}

export function getAppMetadata(
  customMetadata?: Partial<PageSSRMetadata>
): Metadata {
  const baseEndpoint = process.env.BASE_ENDPOINT!;
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
      version: process.env.VERSION ?? "",
    },
  };
}
