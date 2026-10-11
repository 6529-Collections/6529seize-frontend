"use client";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import type { ReactNode } from "react";
import {
  TrophyIcon,
  UserGroupIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { getCompetitionConfigLabel } from "@/helpers/competition-labels.helpers";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate, formatInteger, formatNumber } from "@/i18n/format";
import { Time } from "@/helpers/time";
import CompetitionOverview from "./CompetitionOverview";
import CompetitionAccess from "./CompetitionAccess";
import WaveApprovalThresholds from "@/components/waves/specs/WaveApprovalThresholds";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateCompetition } from "@/services/api/competitions-api";

function RuleRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] tw-gap-4 tw-py-3">
      <dt className="tw-text-iron-400">{label}</dt>
      <dd className="tw-m-0 tw-min-w-0 tw-text-right tw-font-medium tw-text-iron-100 [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

function RulesSection({
  title,
  icon,
  children,
  className = "",
}: {
  readonly title: string;
  readonly icon: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <section
      className={`tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 ${className}`}
    >
      <div className="tw-flex tw-items-center tw-gap-2.5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3.5 sm:tw-px-5">
        <span className="tw-text-iron-400">{icon}</span>
        <h2 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
          {title}
        </h2>
      </div>
      <dl className="tw-m-0 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800/60 tw-px-4 tw-py-1 tw-text-xs tw-leading-5 sm:tw-px-5">
        {children}
      </dl>
    </section>
  );
}

export default function CompetitionRules() {
  const { competition, hub, wave } = useCompetition();
  const legacy = hub.legacy_primary_competition_id === competition.id;
  const client = useQueryClient();
  const locale = useBrowserLocale();
  const now = Time.currentMillis();
  const date = (value: number) =>
    formatDate(locale, value, { dateStyle: "medium", timeStyle: "short" });
  const number = (value: number | null) =>
    value === null
      ? t(locale, "competitions.unlimited")
      : formatInteger(locale, value);
  const duration = (value: number | null) => {
    if (value === null || value === 0)
      return t(locale, "competitions.rulesLabel.none");
    const unit = [
      { name: "day", ms: 86_400_000 },
      { name: "hour", ms: 3_600_000 },
      { name: "minute", ms: 60_000 },
      { name: "second", ms: 1_000 },
    ].find((candidate) => value % candidate.ms === 0);
    return unit
      ? formatNumber(locale, value / unit.ms, {
          style: "unit",
          unit: unit.name,
          unitDisplay: "long",
        })
      : t(locale, "competitions.rulesLabel.milliseconds", {
          value: formatInteger(locale, value),
        });
  };
  const period = (start: number | null, end: number | null) => (
    <>
      {start !== null && (
        <RuleRow
          label={t(
            locale,
            start <= now
              ? "competitions.rulesLabel.started"
              : "competitions.rulesLabel.starts"
          )}
        >
          {date(start)}
        </RuleRow>
      )}
      {end !== null && (
        <RuleRow
          label={t(
            locale,
            end <= now
              ? "competitions.rulesLabel.ended"
              : "competitions.rulesLabel.ends"
          )}
        >
          {date(end)}
        </RuleRow>
      )}
    </>
  );
  const signature = (required: boolean) =>
    t(
      locale,
      required
        ? "competitions.requiredSignature"
        : "competitions.optionalSignature"
    );
  const participation = competition.participation;
  const voting = competition.voting;
  const decisions = competition.decisions;
  return (
    <div className="tw-space-y-4 tw-@container/rules">
      <CompetitionOverview />
      <div className="tw-grid tw-auto-rows-min tw-grid-cols-1 tw-items-start tw-gap-4 @[44rem]/rules:tw-grid-cols-2">
        <RulesSection
          title={t(locale, "competitions.participation")}
          icon={<UserGroupIcon className="tw-size-4" aria-hidden="true" />}
        >
          <RuleRow label={t(locale, "competitions.rulesLabel.access")}>
            <CompetitionAccess type="participation" />
          </RuleRow>
          <RuleRow label={t(locale, "competitions.rulesLabel.signature")}>
            {signature(participation.signature_required)}
          </RuleRow>
          <RuleRow label={t(locale, "competitions.rulesLabel.maxEntries")}>
            {number(participation.max_entries_per_participant)}
          </RuleRow>
          {period(participation.starts_at, participation.ends_at)}
          {participation.required_media.length > 0 && (
            <RuleRow label={t(locale, "competitions.rulesLabel.media")}>
              {participation.required_media
                .map((media) => getCompetitionConfigLabel(locale, media))
                .join(", ")}
            </RuleRow>
          )}
          {participation.required_metadata.length > 0 && (
            <RuleRow label={t(locale, "competitions.rulesLabel.metadata")}>
              <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
                {participation.required_metadata.map((item, index) => (
                  <li key={String(item["name"] ?? index)}>
                    {String(item["name"] ?? "")} (
                    {getCompetitionConfigLabel(
                      locale,
                      String(item["type"] ?? "")
                    )}
                    )
                  </li>
                ))}
              </ul>
            </RuleRow>
          )}
          {participation.terms && (
            <div className="tw-py-3">
              <dt className="tw-text-iron-400">
                {t(locale, "competitions.rulesLabel.terms")}
              </dt>
              <dd className="tw-m-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-iron-200">
                {participation.terms}
              </dd>
            </div>
          )}
        </RulesSection>
        <RulesSection
          title={t(locale, "competitions.voting")}
          icon={<ScaleIcon className="tw-size-4" aria-hidden="true" />}
          className="@[44rem]/rules:tw-col-start-2 @[44rem]/rules:tw-row-span-2 @[44rem]/rules:tw-row-start-1"
        >
          <RuleRow label={t(locale, "competitions.rulesLabel.access")}>
            <CompetitionAccess type="voting" />
          </RuleRow>
          <RuleRow label={t(locale, "competitions.rulesLabel.credit")}>
            {getCompetitionConfigLabel(locale, voting.credit_type)}
          </RuleRow>
          <RuleRow label={t(locale, "competitions.rulesLabel.scope")}>
            {getCompetitionConfigLabel(locale, voting.credit_scope)}
          </RuleRow>
          {voting.credit_category && (
            <RuleRow label={t(locale, "competitions.rulesLabel.category")}>
              {voting.credit_category}
            </RuleRow>
          )}
          <RuleRow label={t(locale, "competitions.rulesLabel.signature")}>
            {signature(voting.signature_required)}
          </RuleRow>
          <RuleRow label={t(locale, "competitions.rulesLabel.maxVotes")}>
            {number(voting.max_votes_per_identity_to_entry)}
          </RuleRow>
          <RuleRow label={t(locale, "competitions.rulesLabel.negative")}>
            {t(
              locale,
              voting.forbid_negative_votes
                ? "competitions.forbidden"
                : "competitions.allowed"
            )}
          </RuleRow>
          <RuleRow label={t(locale, "competitions.rulesLabel.lock")}>
            {duration(decisions.time_lock_ms)}
          </RuleRow>
          {period(voting.starts_at, voting.ends_at)}
        </RulesSection>
        <RulesSection
          title={t(locale, "competitions.decisions")}
          icon={<TrophyIcon className="tw-size-4" aria-hidden="true" />}
        >
          <RuleRow label={t(locale, "competitions.rulesLabel.maxWinners")}>
            {number(decisions.max_winners)}
          </RuleRow>
          {competition.type === ApiCompetitionType.Approve &&
            (legacy ? (
              <div className="tw-py-3">
                <dt className="tw-sr-only">
                  {t(locale, "competitions.decisions")}
                </dt>
                <dd className="tw-m-0">
                  <WaveApprovalThresholds
                    wave={wave}
                    display="configuration"
                    onSaved={() => {
                      void invalidateCompetition(client, {
                        waveId: competition.wave_id,
                        competitionId: competition.id,
                      });
                    }}
                  />
                </dd>
              </div>
            ) : (
              <>
                <RuleRow label={t(locale, "competitions.rulesLabel.threshold")}>
                  {number(decisions.winning_min_threshold)}
                </RuleRow>
                <RuleRow label={t(locale, "competitions.rulesLabel.hold")}>
                  {decisions.winning_threshold_min_duration_ms
                    ? duration(decisions.winning_threshold_min_duration_ms)
                    : t(locale, "competitions.rulesLabel.immediate")}
                </RuleRow>
              </>
            ))}
          {decisions.next_decision_time !== null && (
            <RuleRow label={t(locale, "competitions.rulesLabel.nextDecision")}>
              {date(decisions.next_decision_time)}
            </RuleRow>
          )}
        </RulesSection>
      </div>
    </div>
  );
}
