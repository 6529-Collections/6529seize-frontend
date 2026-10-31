import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import { PROFILE_COLLECTED_RETURN_PARAM } from "@/helpers/profile-collected-navigation";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildNftPageJsonLd, lookupNft } from "@/lib/structured-data/nft";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type GradientDetailSearchParams = Record<string, string | string[] | undefined>;

const serializeSearchParams = (
  searchParams: GradientDetailSearchParams
): string => {
  const serialized = new URLSearchParams();

  const returnTo = searchParams[PROFILE_COLLECTED_RETURN_PARAM];
  const returnToValue = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (returnToValue !== undefined) {
    serialized.set(PROFILE_COLLECTED_RETURN_PARAM, returnToValue);
  }

  return serialized.toString();
};

// The API reads a non-numeric id as token 0, so only plain integers are asked.
const isGradientTokenId = (id: string): boolean =>
  /^\d+$/u.test(id) && Number.isSafeInteger(Number(id));

const loadGradientNft = cache(async (id: string) => {
  if (!isGradientTokenId(id)) {
    return { status: "missing" } as const;
  }
  return lookupNft({ contract: GRADIENT_CONTRACT, id });
});

export default async function GradientPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ id: string }>;
  readonly searchParams?: Promise<GradientDetailSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const lookup = await loadGradientNft(id);
  if (lookup.status === "missing") notFound();
  const nft = lookup.status === "found" ? lookup.nft : null;

  return (
    <main className={styles["main"]}>
      {nft ? (
        <JsonLdScript
          data={buildNftPageJsonLd({
            nft,
            path: `/6529-gradient/${id}`,
            fallbackName: `6529 Gradient #${id}`,
            collectionName: "6529 Gradient",
            collectionPath: "/6529-gradient",
            license: null,
          })}
        />
      ) : null}
      <GradientPageComponent
        id={id}
        searchParamsString={serializeSearchParams(resolvedSearchParams)}
      />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const title = `6529 Gradient #${id}`;
  const lookup = await loadGradientNft(id);
  if (lookup.status === "missing") notFound();
  const nft = lookup.status === "found" ? lookup.nft : null;
  const artist = getUsableText(nft?.artist);
  const description = [title, artist].filter(Boolean).join(" · ");
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title,
      description,
      ogImage: getNftSocialCardImagePath({
        contract: GRADIENT_CONTRACT,
        id,
      }),
      ogImageAlt: `${title} social card`,
    }),
    {
      canonicalPath: `/6529-gradient/${encodeURIComponent(id)}`,
      robots: { index: nft !== null, follow: true },
    }
  );
}
