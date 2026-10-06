import Link from "next/link";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import WaveGroupScope from "./specs/groups/group/WaveGroupScope";

/**
 * Show safe submission-group details only after the locked action is opened.
 * Normal activation can use the current tab; copied links retain a rules URL.
 */
export default function WaveSubmissionAccessDetails({
  wave,
  onViewRules,
}: {
  readonly wave: ApiWave;
  readonly onViewRules?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const group = wave.participation.scope.group;

  return (
    <div className="tw-space-y-2 tw-text-sm tw-leading-5 tw-text-iron-300">
      <p className="tw-m-0">{t(locale, "waves.access.submissionScope")}</p>
      {group ? (
        <WaveGroupScope group={group} />
      ) : (
        <p className="tw-m-0">{t(locale, "waves.access.publicScope")}</p>
      )}
      <p className="tw-m-0">{t(locale, "waves.access.independent")}</p>
      {wave.participation.signature_required && (
        <p className="tw-m-0">{t(locale, "waves.access.signature")}</p>
      )}
      <Link
        href={`${getWavePathRoute(wave.id)}?tab=configuration`}
        prefetch={false}
        onNavigate={(event) => {
          if (onViewRules) {
            event.preventDefault();
            onViewRules();
          }
        }}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-text-primary-400 tw-underline tw-underline-offset-2 hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "waves.access.viewRules")}
      </Link>
    </div>
  );
}
