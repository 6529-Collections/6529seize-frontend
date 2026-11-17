import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import {
  getActiveWaveIdFromUrl,
  getWavePathRoute,
} from "@/helpers/navigation.helpers";
import { getCompetitionIdFromPathname } from "@/helpers/competition.helpers";
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
  isClosed,
}: {
  readonly group: ApiGroup | null;
  readonly signatureRequired: boolean;
  readonly isClosed: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <>
      <dl className="tw-m-0 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-items-center tw-gap-x-2">
        <dt className="tw-text-iron-400">
          {t(locale, "waves.access.submissionScope")}
        </dt>
        <dd className="tw-m-0 tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-justify-end tw-font-medium tw-text-iron-100">
          {group ? (
            <WaveGroupScope group={group} />
          ) : (
            t(locale, "waves.access.publicGroup")
          )}
        </dd>
      </dl>
      {!isClosed && (
        <div className="tw-space-y-2 tw-text-iron-400">
          {!group && (
            <p className="tw-m-0">{t(locale, "waves.access.otherRules")}</p>
          )}
          <p className="tw-m-0">{t(locale, "waves.access.independent")}</p>
          {signatureRequired && (
            <p className="tw-m-0">{t(locale, "waves.access.signature")}</p>
          )}
        </div>
      )}
    </>
  );
}

/** Resolve the selected competition on demand without falling back to legacy access. */
function CompetitionSubmissionScope({
  waveId,
  competitionId,
  isClosed,
}: {
  readonly waveId: string;
  readonly competitionId: string;
  readonly isClosed: boolean;
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
  if (groupId !== null && groupQuery.isPending)
    return <p className="tw-m-0">{t(locale, "waves.access.loading")}</p>;
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
      isClosed={isClosed}
    />
  );
}

/**
 * Follow the rules destination's explicit selection or the Wave's current default.
 */
function SelectedSubmissionScope({
  wave,
  competitionId,
  isClosed,
}: {
  readonly wave: ApiWave;
  readonly competitionId: string | null;
  readonly isClosed: boolean;
}) {
  const locale = useBrowserLocale();
  const defaultQuery = useDefaultCompetition(wave.id, !competitionId);
  if (competitionId)
    return (
      <CompetitionSubmissionScope
        waveId={wave.id}
        competitionId={competitionId}
        isClosed={isClosed}
      />
    );
  if (defaultQuery.isPending)
    return <p className="tw-m-0">{t(locale, "waves.access.loading")}</p>;
  if (defaultQuery.isError)
    return <p className="tw-m-0">{t(locale, "waves.access.unavailable")}</p>;
  const defaultId = defaultQuery.data.competition_id;
  return defaultId ? (
    <CompetitionSubmissionScope
      waveId={wave.id}
      competitionId={defaultId}
      isClosed={isClosed}
    />
  ) : (
    <SubmissionScope
      group={wave.participation.scope.group}
      signatureRequired={wave.participation.signature_required}
      isClosed={isClosed}
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
  isClosed = false,
}: {
  readonly wave: ApiWave;
  readonly onViewRules?: (() => void) | undefined;
  readonly isClosed?: boolean;
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
    <div className="tw-space-y-3 tw-text-sm tw-leading-5 tw-text-iron-300">
      <div className="tw-space-y-2" aria-live="polite">
        <SelectedSubmissionScope
          wave={wave}
          competitionId={competitionId}
          isClosed={isClosed}
        />
      </div>
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-1">
        <Link
          href={`${getWavePathRoute(wave.id)}?${rulesParams}`}
          prefetch={false}
          onNavigate={(event) => {
            if (onViewRules) {
              event.preventDefault();
              onViewRules();
            }
          }}
          className="tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-font-medium tw-text-primary-400 tw-no-underline tw-underline-offset-2 hover:tw-text-primary-300 hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "waves.access.viewRules")}
          <ArrowRightIcon
            aria-hidden="true"
            className="tw-size-4 tw-shrink-0"
          />
        </Link>
      </div>
    </div>
  );
}
