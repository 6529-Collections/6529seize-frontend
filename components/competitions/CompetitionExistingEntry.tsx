"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sha256 } from "js-sha256";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useAuth } from "@/components/auth/Auth";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiCreateCompetitionEntryRequest } from "@/generated/models/ApiCreateCompetitionEntryRequest";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  competitionEndpoint,
  competitionScope,
  createCompetitionEntry,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import { canonicalCompetitionJson } from "@/services/wallet-signatures/competition-signature";
import { useCompetitionSignature } from "@/hooks/competitions/useCompetitionSignature";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import {
  getCompetitionRoute,
  newCompetitionRequestKey,
  isRejectedCompetitionCommand,
} from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CompetitionEntryContent from "./CompetitionEntryContent";
import {
  CompetitionState,
  COMPETITION_BUTTON,
  COMPETITION_INPUT,
} from "./CompetitionState";

export default function CompetitionExistingEntry({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const { competition } = useCompetition();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const { requestAuth } = useAuth();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const router = useRouter();
  const client = useQueryClient();
  const sign = useCompetitionSignature();
  const [dropId, setDropId] = useState("");
  const [selected, setSelected] = useState("");
  const [acceptedTermsVersion, setTermsVersion] = useState<number | null>(null);
  const terms = acceptedTermsVersion === competition.config_version;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef<{
    fingerprint: string;
    body: ApiCreateCompetitionEntryRequest;
  } | null>(null);
  const candidate = useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "candidate",
      selected,
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiCreateDropRequest>({
        endpoint: `${competitionEndpoint(identity)}/entry-content-candidate/${encodeURIComponent(selected)}`,
        signal,
        errorMode: "structured",
      }),
    enabled: Boolean(selected && viewer),
    retry: false,
    staleTime: 0,
  });
  const submit = async () => {
    if (
      !candidate.data ||
      busy ||
      !competition.permissions.submit ||
      (competition.participation.terms && !terms)
    )
      return;
    setBusy(true);
    setFailed(false);
    try {
      if (!(await requestAuth()).success) return;
      const hash = sha256(canonicalCompetitionJson(candidate.data));
      const fingerprint = `${viewer ?? "anonymous"}:${competition.config_version}:${selected}:${hash}`;
      let body =
        pending.current?.fingerprint === fingerprint
          ? pending.current.body
          : null;
      if (!body) {
        body = {
          idempotency_key: newCompetitionRequestKey(),
          config_version: competition.config_version,
          drop_id: selected,
        };
        if (competition.participation.signature_required) {
          body.drop_content_hash = hash;
          body.signature = await sign(
            "ENTRY_CREATE",
            { drop: null, drop_id: selected, drop_content_hash: hash },
            null,
            selected
          );
        }
        pending.current = { fingerprint, body };
      }
      const entry = await createCompetitionEntry(identity, body);
      await invalidateCompetition(client, identity);
      onClose();
      router.push(
        `${getCompetitionRoute(identity.waveId, identity.competitionId)}?entry=${encodeURIComponent(entry.id)}`
      );
    } catch (error) {
      if (isRejectedCompetitionCommand(error)) pending.current = null;
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  let preview = <CompetitionState />;
  if (candidate.isError)
    preview = (
      <CompetitionState
        error
        retry={() => {
          void candidate.refetch();
        }}
      />
    );
  else if (candidate.data)
    preview = (
      <CompetitionEntryContent content={candidate.data} dropId={selected} />
    );
  return (
    <section className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4">
      <h2 className="tw-text-lg tw-text-iron-100">
        {t(locale, "competitions.existing")}
      </h2>
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "competitions.existingHint")}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSelected(dropId.trim());
          setTermsVersion(null);
        }}
        className="tw-flex tw-flex-wrap tw-gap-2"
      >
        <label
          className="tw-w-full tw-text-sm tw-text-iron-200"
          htmlFor="competition-existing-drop"
        >
          {t(locale, "competitions.dropId")}
        </label>
        <input
          id="competition-existing-drop"
          className={`${COMPETITION_INPUT} tw-flex-1`}
          value={dropId}
          onChange={(event) => setDropId(event.target.value)}
          disabled={busy}
          required
        />
        <button
          type="submit"
          className={COMPETITION_BUTTON}
          disabled={busy || !dropId.trim()}
        >
          {t(locale, "competitions.previewEntry")}
        </button>
      </form>
      {selected && preview}
      {competition.participation.terms && (
        <label className="tw-block tw-space-y-3 tw-text-sm tw-text-iron-300">
          <p className="tw-whitespace-pre-wrap">
            {competition.participation.terms}
          </p>
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) =>
              setTermsVersion(
                event.target.checked ? competition.config_version : null
              )
            }
            disabled={busy}
          />{" "}
          {t(locale, "competitions.terms")}
        </label>
      )}
      {failed && (
        <p role="alert" className="tw-text-red">
          {t(locale, "competitions.failure")}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={
            busy ||
            !candidate.data ||
            !competition.permissions.submit ||
            Boolean(competition.participation.terms && !terms)
          }
          onClick={() => {
            void submit();
          }}
        >
          {t(locale, busy ? "competitions.saving" : "competitions.submit")}
        </button>
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={busy}
          onClick={onClose}
        >
          {t(locale, "competitions.cancelEdit")}
        </button>
      </div>
    </section>
  );
}
