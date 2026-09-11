import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { ProfileCmsPackageRecord } from "@/lib/profile-cms/builder/api";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";

export default function ProfileCmsRecoveryLink({
  receipt,
  locale,
}: {
  readonly receipt: ProfileCmsPackageRecord["recoveryReceipt"];
  readonly locale: SupportedLocale;
}) {
  const href = resolveCmsUri(receipt?.uri);
  if (!href || !receipt) return null;
  return (
    <div className="tw-mt-2 tw-break-all tw-text-xs">
      <a
        className="tw-inline-flex tw-min-h-10 tw-items-center tw-underline"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {t(locale, "profileCms.builder.publish.signedPublication")}
      </a>
      <p className="tw-font-mono">
        {t(locale, "profileCms.builder.publish.signedPublicationHash", {
          hash: receipt.content_hash,
        })}
      </p>
    </div>
  );
}
