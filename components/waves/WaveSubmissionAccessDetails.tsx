import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import {
  getActiveWaveIdFromUrl,
  getWavePathRoute,
} from "@/helpers/navigation.helpers";
import {
  getCompetitionIdFromPathname,
  isMultiCompetitionEnabled,
} from "@/helpers/competition.helpers";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  useCompetitionDetail,
  useDefaultCompetition,
} from "@/hooks/competitions/useCompetitionQueries";
import { commonApiFetch } from "@/services/api/common-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import WaveGroupScope from "./specs/groups/group/WaveGroupScope";

/** Present one submission audience while preserving private group metadata. */
function SubmissionScope({
  group,
  signatureRequired,
}: {
  readonly group: ApiGroup | null;
  readonly signatureRequired: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <>
      <p className="tw-m-0">{t(locale, "waves.access.submissionScope")}</p>
      {group ? (
        <WaveGroupScope group={group} />
      ) : (
        <p className="tw-m-0">{t(locale, "waves.access.publicScope")}</p>
      )}
      <p className="tw-m-0">{t(locale, "waves.access.independent")}</p>
      {signatureRequired && (
        <p className="tw-m-0">{t(locale, "waves.access.signature")}</p>
      )}
    </>
  );
}

/** Resolve the selected competition on demand without falling back to legacy access. */
function CompetitionSubmissionScope({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId: string;
}) {
  const locale = useBrowserLocale();
  const competitionQuery = useCompetitionDetail({ waveId, competitionId });
  const competition = competitionQuery.data;
  const groupId = competition?.participation.group_id ?? null;
  const groupQuery = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, groupId],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(groupId ?? "")}`,
        signal,
      }),
    enabled: groupId !== null,
    retry: false,
    staleTime: 60_000,
  });
  if (competitionQuery.isPending)
    return <p className="tw-m-0">{t(locale, "waves.access.loading")}</p>;
  if (competitionQuery.isError || !competition)
    return <p className="tw-m-0">{t(locale, "waves.access.unavailable")}</p>;
  const group: ApiGroup | null =
    groupId === null
      ? null
      : {
          id: groupId,
          name: groupQuery.data?.name ?? "",
          is_hidden:
            groupQuery.isError ||
            groupQuery.data?.visible !== true ||
            groupQuery.data.is_private !== false,
          is_direct_message: groupQuery.data?.is_direct_message ?? false,
        };
  return (
    <SubmissionScope
      group={group}
      signatureRequired={competition.participation.signature_required}
    />
  );
}

/**
 * Follow the rules destination's explicit selection or the Wave's current default.
 */
function SelectedSubmissionScope({
  wave,
  competitionId,
}: {
  readonly wave: ApiWave;
  readonly competitionId: string | null;
}) {
  const locale = useBrowserLocale();
  const defaultQuery = useDefaultCompetition(wave.id, !competitionId);
  if (competitionId)
    return (
      <CompetitionSubmissionScope
        waveId={wave.id}
        competitionId={competitionId}
      />
    );
  if (defaultQuery.isPending)
    return <p className="tw-m-0">{t(locale, "waves.access.loading")}</p>;
  if (defaultQuery.isError)
    return <p className="tw-m-0">{t(locale, "waves.access.unavailable")}</p>;
  const defaultId = defaultQuery.data.competition_id;
  return defaultId ? (
    <CompetitionSubmissionScope waveId={wave.id} competitionId={defaultId} />
  ) : (
    <SubmissionScope
      group={wave.participation.scope.group}
      signatureRequired={wave.participation.signature_required}
    />
  );
}

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const competitionId =
    getActiveWaveIdFromUrl({ pathname, searchParams }) === wave.id
      ? (getCompetitionIdFromPathname(pathname) ??
        searchParams.get("competition"))
      : null;
  const rulesParams = new URLSearchParams({ tab: "configuration" });
  if (competitionId) rulesParams.set("competition", competitionId);

  return (
    <div className="tw-space-y-2 tw-text-sm tw-leading-5 tw-text-iron-300">
      {isMultiCompetitionEnabled() ? (
        <div className="tw-space-y-2" aria-live="polite">
          <SelectedSubmissionScope wave={wave} competitionId={competitionId} />
        </div>
      ) : (
        <SubmissionScope
          group={wave.participation.scope.group}
          signatureRequired={wave.participation.signature_required}
        />
      )}
      <Link
        href={`${getWavePathRoute(wave.id)}?${rulesParams}`}
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
