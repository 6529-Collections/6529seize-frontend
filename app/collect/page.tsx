import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import CollectPageClient from "@/components/collect/CollectPageClient";
import { collectLocation } from "@/components/collect/collect-navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "collect.title"),
  description: t(DEFAULT_LOCALE, "collect.description"),
});

type CollectSearchParams = Record<string, string | string[] | undefined>;

function legacyCollectionDestination(
  params: CollectSearchParams
): `/${string}` | null {
  const intent = params["intent"];
  if (intent !== undefined && intent !== "explore" && intent !== "specific") {
    return null;
  }

  const token = params["token"] ?? params["q"];
  const tokenId =
    intent !== "explore" &&
    typeof token === "string" &&
    token === token.trim() &&
    /^(0|[1-9]\d{0,77})$/.test(token)
      ? token
      : null;
  if (tokenId === null && intent === undefined) {
    return null;
  }

  const tokenSuffix = tokenId === null ? "" : `/${tokenId}`;
  if (params["collection"] === "gradients") {
    return `/6529-gradient${tokenSuffix}`;
  }
  if (params["collection"] === "pebbles") {
    return tokenId === null
      ? "/nextgen/collection/pebbles"
      : `/nextgen/token/${tokenId}`;
  }
  return `/the-memes${tokenSuffix}`;
}

/** Match the planner's collection while keeping valid artwork links intact. */
function iosCollectionDestination(params: CollectSearchParams): `/${string}` {
  const query = new URLSearchParams();
  for (const key of ["collection", "intent", "definition"] as const) {
    const value = params[key];
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue !== undefined) query.set(key, firstValue);
  }
  const { collection } = collectLocation(query.toString());
  return (
    legacyCollectionDestination({ ...params, collection, intent: "specific" }) ??
    "/the-memes"
  );
}

export default async function CollectPage({
  searchParams,
}: {
  readonly searchParams: Promise<CollectSearchParams>;
}) {
  const params = await searchParams;
  const destination = legacyCollectionDestination(params);
  if (destination !== null) {
    redirect(destination);
  }

  return (
    <Suspense
      fallback={
        <div role="status" className="tw-p-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "collect.loading")}
        </div>
      }
    >
      <NftPurchasingGate redirectTo={iosCollectionDestination(params)}>
        <CollectPageClient />
      </NftPurchasingGate>
    </Suspense>
  );
}
