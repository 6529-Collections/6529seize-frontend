import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { collectAssetIdentity } from "./collect.adapters";
import { getCollectHref } from "./CollectEntryLink";

export default function CollectAssetReference({
  assetKey,
  locale,
}: {
  readonly assetKey: string;
  readonly locale: SupportedLocale;
}) {
  const identity = collectAssetIdentity(assetKey);
  if (!identity) return <span>{t(locale, "collect.trade.asset")}</span>;
  return (
    <Link
      href={getCollectHref({
        collection: identity.family,
        intent: "specific",
        tokenId: identity.tokenId,
      })}
      className="tw-text-iron-100 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      {t(locale, `collect.collection.${identity.family}`)} #{identity.tokenId}
    </Link>
  );
}
