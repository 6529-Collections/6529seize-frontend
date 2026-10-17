import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import RememePage from "@/components/rememes/RememePage";
import {
  getRememesRouteLocale,
  getRememeDetailCanonicalPath,
  type RememesSearchParams,
} from "@/components/rememes/rememesRouteParams";
import { formatAddress } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import styles from "@/styles/Home.module.css";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Rememe } from "@/entities/INFT";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type RememeDetailSearchParams = Pick<RememesSearchParams, "locale">;

type RememeRouteProps = {
  readonly params: Promise<{ contract: string; id: string }>;
  readonly searchParams?: Promise<RememeDetailSearchParams>;
};

type RememeLookup =
  | { readonly status: "found"; readonly rememe: Rememe }
  | { readonly status: "missing" }
  | { readonly status: "unavailable" };

// An empty answer means the API does not know this token; a failed request is
// only "unavailable", so the client page can still retry it.
const lookupRememe = cache(
  async (contract: string, id: string): Promise<RememeLookup> => {
    try {
      const headers = await getAppCommonHeaders();
      const response = await commonApiFetch<
        DBResponse<Rememe>,
        { contract: string; id: string }
      >({
        endpoint: "rememes",
        headers,
        params: { contract, id },
      });
      const data = (response as DBResponse<Rememe> | null)?.data;
      if (!Array.isArray(data)) {
        return { status: "unavailable" };
      }
      const [rememe] = data;
      return rememe === undefined
        ? { status: "missing" }
        : { status: "found", rememe };
    } catch (error) {
      console.error(
        `Failed to load ReMeme metadata for ${contract} #${id}`,
        error
      );
      return { status: "unavailable" };
    }
  }
);

const getNonEmptyText = (
  value: string | null | undefined
): string | undefined => {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : undefined;
};

const getRememeCollectionName = (rememe?: Rememe): string =>
  getNonEmptyText(rememe?.contract_opensea_data?.collectionName) ?? "ReMemes";

const getRememeName = (rememe: Rememe): string | undefined => {
  const metadata = rememe.metadata as { name?: unknown } | null | undefined;
  return typeof metadata?.name === "string"
    ? getNonEmptyText(metadata.name)
    : undefined;
};

const getNonEmptyRecordText = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? getNonEmptyText(value) : undefined;
};

const getRememeMediaImage = (media: unknown): string | undefined => {
  if (Array.isArray(media)) {
    return media.find((item): item is { gateway: string } => {
      if (item === null || item === undefined || typeof item !== "object") {
        return false;
      }
      const gateway = (item as Record<string, unknown>)["gateway"];
      return typeof gateway === "string" && gateway.trim().length > 0;
    })?.gateway;
  }

  if (media === null || media === undefined || typeof media !== "object") {
    return undefined;
  }

  const mediaRecord = media as Record<string, unknown>;
  return (
    getNonEmptyRecordText(mediaRecord, "thumbnailUrl") ??
    getNonEmptyRecordText(mediaRecord, "cachedUrl") ??
    getNonEmptyRecordText(mediaRecord, "pngUrl") ??
    getNonEmptyRecordText(mediaRecord, "originalUrl")
  );
};

const getRememeImage = (rememe?: Rememe): string | undefined => {
  if (!rememe) {
    return undefined;
  }

  const mediaImage = getRememeMediaImage(rememe.media);

  return (
    getNonEmptyText(rememe.s3_image_scaled) ??
    getNonEmptyText(rememe.s3_image_original) ??
    getNonEmptyText(rememe.image) ??
    mediaImage ??
    getNonEmptyText(rememe.contract_opensea_data?.imageUrl)
  );
};

async function getRouteLocale(searchParams: RememeRouteProps["searchParams"]) {
  return getRememesRouteLocale(searchParams ? await searchParams : {});
}

export default async function ReMeme({
  params,
  searchParams,
}: RememeRouteProps) {
  const { contract, id } = await params;
  const locale = await getRouteLocale(searchParams);
  if ((await lookupRememe(contract, id)).status === "missing") notFound();

  return (
    <main className={styles["main"]}>
      <RememePage contract={contract} id={id} locale={locale} />
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: RememeRouteProps): Promise<Metadata> {
  const { contract, id } = await params;
  const locale = await getRouteLocale(searchParams);
  const rememesTitle = t(locale, "rememes.title");
  const lookup = await lookupRememe(contract, id);
  if (lookup.status === "missing") notFound();
  let name = `${formatAddress(contract)} #${id}`;
  const rememe = lookup.status === "found" ? lookup.rememe : undefined;
  if (rememe !== undefined) {
    name = getRememeName(rememe) ?? name;
  }

  const collectionName = getRememeCollectionName(rememe);

  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: t(locale, "rememes.detail.documentTitle", { name }),
      description: rememesTitle,
      ogImage: getNftSocialCardImagePath({
        badge: "ReMemes",
        collection: collectionName,
        contract,
        id,
        image: getRememeImage(rememe),
        subtitle: `${collectionName} #${id} | ${rememesTitle}`,
        title: name,
      }),
      ogImageAlt: `${name} ReMeme social card`,
    }),
    { canonicalPath: getRememeDetailCanonicalPath({ contract, id, locale }) }
  );
}
