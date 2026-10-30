import Link from "next/link";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const safeId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 200 &&
  /^[a-zA-Z0-9_:-]+$/.test(value);

export default function ModerationOriginalPostLink({
  dropId,
  waveId,
  deleted,
  evidenceRetained,
}: {
  readonly dropId: string;
  readonly waveId: unknown;
  readonly deleted: boolean;
  readonly evidenceRetained?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  if (deleted) {
    return (
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          locale,
          evidenceRetained
            ? "contentModeration.originalPost.deletedHelp"
            : "contentModeration.originalPost.deletedWithoutEvidence"
        )}
      </p>
    );
  }
  const href =
    safeId(dropId) && safeId(waveId)
      ? getWaveRoute({
          waveId,
          extraParams: { drop: dropId },
          isDirectMessage: false,
          isApp: false,
        })
      : null;
  return (
    <div className="tw-mt-4 tw-space-y-2">
      {href ? (
        <Link
          href={href}
          prefetch={false}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(locale, "contentModeration.originalPost.open")}
        </Link>
      ) : (
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {t(locale, "contentModeration.originalPost.unavailable")}
        </p>
      )}
    </div>
  );
}
