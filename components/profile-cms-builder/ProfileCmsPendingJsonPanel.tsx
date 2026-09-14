import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { BuilderActionButton } from "./ProfileCmsBuilderControls";

export default function ProfileCmsPendingJsonPanel({
  pending,
  busy,
  locale,
  onReview,
  onDiscard,
}: {
  readonly pending: boolean;
  readonly busy: boolean;
  readonly locale: SupportedLocale;
  readonly onReview: () => void;
  readonly onDiscard: () => void;
}) {
  if (!pending) return null;
  return (
    <div className="tw-mt-3">
      <p>{t(locale, "profileCms.builder.json.pending")}</p>
      <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
        <BuilderActionButton
          disabled={busy}
          label={t(locale, "profileCms.builder.json.reviewPending")}
          onClick={onReview}
        />
        <BuilderActionButton
          disabled={busy}
          label={t(locale, "profileCms.builder.json.discardPending")}
          onClick={onDiscard}
        />
      </div>
    </div>
  );
}
