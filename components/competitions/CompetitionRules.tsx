"use client";
import { getCompetitionConfigLabel } from "@/helpers/competition-labels.helpers";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate, formatInteger } from "@/i18n/format";
import { WAVE_DISPLAY_METADATA_KEYS } from "@/helpers/waves/wave-metadata.helpers";

export default function CompetitionRules() {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const date = (value: number) =>
    formatDate(locale, value, { dateStyle: "medium", timeStyle: "short" });
  const number = (value: number | null) =>
    value === null
      ? t(locale, "competitions.unlimited")
      : formatInteger(locale, value);
  const customRules = competition.presentation?.find(
    (item) => item.data_key === WAVE_DISPLAY_METADATA_KEYS.customRules
  )?.data_value;
  return (
    <div className="tw-space-y-5 tw-text-sm tw-leading-6 tw-text-iron-300">
      <p>
        {t(locale, "competitions.version", {
          version: competition.config_version,
        })}
      </p>
      <p>{t(locale, "competitions.publishedRules")}</p>
      {customRules && <p className="tw-whitespace-pre-wrap">{customRules}</p>}
      <section>
        <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "competitions.participation")}
        </h3>
        <p>
          {t(locale, "competitions.group", {
            value:
              competition.participation.group_id ??
              t(locale, "competitions.everyone"),
          })}
        </p>
        <p>
          {t(locale, "competitions.signature", {
            value: t(
              locale,
              competition.participation.signature_required
                ? "competitions.requiredSignature"
                : "competitions.optionalSignature"
            ),
          })}
        </p>
        <p>
          {t(locale, "competitions.maxEntries", {
            value: number(
              competition.participation.max_entries_per_participant
            ),
          })}
        </p>
        {competition.participation.starts_at !== null && (
          <p>
            {t(locale, "competitions.starts", {
              date: date(competition.participation.starts_at),
            })}
          </p>
        )}
        {competition.participation.ends_at !== null && (
          <p>
            {t(locale, "competitions.ends", {
              date: date(competition.participation.ends_at),
            })}
          </p>
        )}
        <p>
          {competition.participation.required_media
            .map((media) => getCompetitionConfigLabel(locale, media))
            .join(", ")}
        </p>
        <ul>
          {competition.participation.required_metadata.map((item) => (
            <li key={String(item["name"] ?? "")}>
              {String(item["name"] ?? "")} (
              {getCompetitionConfigLabel(locale, String(item["type"] ?? ""))})
            </li>
          ))}
        </ul>
        {competition.participation.terms && (
          <p className="tw-whitespace-pre-wrap">
            {competition.participation.terms}
          </p>
        )}
      </section>
      <section>
        <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "competitions.voting")}
        </h3>
        <p>
          {t(locale, "competitions.group", {
            value:
              competition.voting.group_id ?? t(locale, "competitions.everyone"),
          })}
        </p>
        <p>
          {t(locale, "competitions.signature", {
            value: t(
              locale,
              competition.voting.signature_required
                ? "competitions.requiredSignature"
                : "competitions.optionalSignature"
            ),
          })}
        </p>
        <p>
          {t(locale, "competitions.maxVotes", {
            value: number(competition.voting.max_votes_per_identity_to_entry),
          })}
        </p>
        <p>
          {getCompetitionConfigLabel(locale, competition.voting.credit_type)} ·{" "}
          {getCompetitionConfigLabel(locale, competition.voting.credit_scope)} ·{" "}
          {competition.voting.credit_category}
        </p>
        <p>
          {t(locale, "competitions.negative", {
            value: t(
              locale,
              competition.voting.forbid_negative_votes
                ? "competitions.forbidden"
                : "competitions.allowed"
            ),
          })}
        </p>
        {competition.voting.starts_at !== null && (
          <p>
            {t(locale, "competitions.starts", {
              date: date(competition.voting.starts_at),
            })}
          </p>
        )}
        {competition.voting.ends_at !== null && (
          <p>
            {t(locale, "competitions.ends", {
              date: date(competition.voting.ends_at),
            })}
          </p>
        )}
        <p>
          {t(locale, "competitions.threshold", {
            value: number(competition.decisions.winning_min_threshold),
          })}
        </p>
        <p>
          {t(locale, "competitions.hold", {
            value: formatInteger(
              locale,
              competition.decisions.winning_threshold_min_duration_ms
            ),
          })}
        </p>
        <p>
          {t(locale, "competitions.lock", {
            value: formatInteger(
              locale,
              competition.decisions.time_lock_ms ?? 0
            ),
          })}
        </p>
      </section>
      <section>
        <p>
          {t(locale, "competitions.maxWinners", {
            value: number(competition.decisions.max_winners),
          })}
        </p>
        {competition.decisions.next_decision_time !== null && (
          <p>
            {t(locale, "competitions.nextDecision", {
              date: date(competition.decisions.next_decision_time),
            })}
          </p>
        )}
      </section>
    </div>
  );
}
