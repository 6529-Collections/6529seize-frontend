"use client";
import { getCompetitionConfigLabel } from "@/helpers/competition-labels.helpers";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import {
  getSelectableIdentityOption,
  type SelectableIdentityOption,
} from "@/components/utils/input/profile-search/getSelectableIdentity";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted as IdentityMode } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import {
  IDENTITY_SUBMISSION_METADATA_KEY,
  isReservedIdentitySubmissionMetadataKey,
} from "@/helpers/waves/identity-submission-metadata";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { getMentionedGroupsFromText } from "@/helpers/waves/drop-group-mentions";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import { useCompetitionSignature } from "@/hooks/competitions/useCompetitionSignature";
import DropEditor, {
  type DropEditorHandles,
} from "@/components/drops/create/DropEditor";
import { CreateDropType } from "@/components/drops/create/types";
import { CreateDropScreenType } from "@/components/drops/create/utils/CreateDropWrapper";
import { CreateDropEmojiPickerLayerProvider } from "@/components/waves/CreateDropEmojiPickerLayerContext";
import { MentionSearchScopeProvider } from "@/components/drops/create/lexical/plugins/mentions/MentionSearchScopeContext";
import { profileAndConsolidationsToProfileMin } from "@/helpers/ProfileHelpers";
import { hasPendingInlineImageUploadDrop } from "@/helpers/waves/inline-image-upload.helpers";
import { getCreateWaveDropRequest } from "@/components/waves/create-wave/services/createWaveDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiCreateCompetitionEntryRequest } from "@/generated/models/ApiCreateCompetitionEntryRequest";
import {
  createCompetitionEntry,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import {
  getCompetitionRoute,
  newCompetitionRequestKey,
  isRejectedCompetitionCommand,
} from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { COMPETITION_BUTTON, COMPETITION_INPUT } from "./CompetitionState";
import { competitionSubmissionReceiptKey } from "@/helpers/competition-submission.helpers";

function getEntryReferences(
  snapshot: NonNullable<ReturnType<DropEditorHandles["getDropSnapshot"]>>,
  isWaveAdmin: boolean
) {
  return {
    mentioned_waves: snapshot.mentioned_waves ?? [],
    mentioned_groups: getMentionedGroupsFromText(
      snapshot.parts.map((part) => part.content ?? "").join("\n"),
      isWaveAdmin
    ),
    ...(snapshot.hide_link_preview !== undefined
      ? { hide_link_preview: snapshot.hide_link_preview }
      : {}),
  };
}

function isSameIdentity(
  selected: SelectableIdentityOption | null,
  own: SelectableIdentityOption | null
) {
  if (!selected || !own) return false;
  return (
    (selected.profileId !== null && selected.profileId === own.profileId) ||
    selected.value.toLowerCase() === own.value.toLowerCase()
  );
}

export default function CompetitionEntryForm({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const { wave, competition } = useCompetition();
  const { connectedProfile, activeProfileProxy, requestAuth } = useAuth();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const router = useRouter();
  const client = useQueryClient();
  const sign = useCompetitionSignature();
  const formId = useId();
  const errorId = `${formId}-error`;
  const termsId = `${formId}-terms`;
  const editor = useRef<DropEditorHandles | null>(null);
  const [title, setTitle] = useState("");
  const [nominee, setNominee] = useState<SelectableIdentityOption | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [acceptedTermsVersion, setAcceptedTermsVersion] = useState<
    number | null
  >(null);
  const terms = acceptedTermsVersion === competition.config_version;
  const [canSubmit, setCanSubmit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const failureDescription = failed ? errorId : undefined;
  const pending = useRef<{
    fingerprint: string;
    request: ApiCreateCompetitionEntryRequest;
  } | null>(null);
  const profile =
    activeProfileProxy?.created_by ??
    (connectedProfile
      ? profileAndConsolidationsToProfileMin({ profile: connectedProfile })
      : null);
  const identitySubmission =
    competition.participation.submission_type === "IDENTITY";
  const identityMode = competition.participation.identity_submission_strategy;
  const selfIdentity = getSelectableIdentityOption(
    profile ? { ...profile, primary_wallet: profile.primary_address } : null
  );
  const selectedIdentity =
    identityMode === IdentityMode.OnlyMyself ? selfIdentity : nominee;
  const nominatesSelf = isSameIdentity(selectedIdentity, selfIdentity);
  const identityValid =
    !identitySubmission ||
    Boolean(
      selectedIdentity &&
      (identityMode === IdentityMode.OnlyMyself ||
        identityMode === IdentityMode.Everyone ||
        (identityMode === IdentityMode.OnlyOthers && !nominatesSelf))
    );
  const requirements = competition.participation.required_metadata
    .map((item) => ({
      name: String(item["name"] ?? ""),
      type: String(item["type"] ?? "STRING"),
    }))
    .filter(
      (item) =>
        !identitySubmission ||
        !isReservedIdentitySubmissionMetadataKey(item.name)
    );
  const metadataValid = requirements.every((item) =>
    metadata[item.name]?.trim()
  );
  const ready =
    canSubmit &&
    metadataValid &&
    identityValid &&
    (!competition.participation.terms || terms) &&
    competition.permissions.submit &&
    competition.lifecycle === ApiCompetitionLifecycle.Published;
  const submit = async () => {
    if (busy || !ready) return;
    const snapshot = editor.current?.getDropSnapshot();
    if (!snapshot || hasPendingInlineImageUploadDrop(snapshot)) return;
    setBusy(true);
    setFailed(false);
    const identity = { waveId: wave.id, competitionId: competition.id };
    try {
      if (!(await requestAuth()).success) return;
      const fingerprint = JSON.stringify(
        [
          snapshot,
          metadata,
          title,
          competition.config_version,
          viewer,
          identitySubmission ? selectedIdentity?.value : null,
        ],
        (_key, value: unknown) =>
          value instanceof File
            ? {
                name: value.name,
                size: value.size,
                modified: value.lastModified,
              }
            : value
      );
      let request =
        pending.current?.fingerprint === fingerprint
          ? pending.current.request
          : null;
      if (!request) {
        const content = await getCreateWaveDropRequest(snapshot);
        const drop = {
          ...content,
          ...getEntryReferences(
            snapshot,
            wave.wave.authenticated_user_eligible_for_admin
          ),
          title: title.trim() || (content.title ?? null),
          metadata: [
            ...content.metadata.filter(
              (item) =>
                (!identitySubmission ||
                  !isReservedIdentitySubmissionMetadataKey(item.data_key)) &&
                !requirements.some(
                  (requirement) => requirement.name === item.data_key
                )
            ),
            ...(identitySubmission && selectedIdentity
              ? [
                  {
                    data_key: IDENTITY_SUBMISSION_METADATA_KEY,
                    data_value: selectedIdentity.value,
                  },
                ]
              : []),
            ...requirements.map((item) => ({
              data_key: item.name,
              data_value: metadata[item.name] ?? "",
            })),
          ],
          wave_id: wave.id,
          drop_type: ApiDropType.Participatory,
          signature: null,
        };
        request = {
          idempotency_key: newCompetitionRequestKey(),
          config_version: competition.config_version,
          drop,
        };
        if (competition.participation.signature_required)
          request.signature = await sign(
            "ENTRY_CREATE",
            { drop, drop_id: null },
            null,
            null
          );
        pending.current = { fingerprint, request };
      }
      const entry = await createCompetitionEntry(identity, request);
      client.setQueryData(
        competitionSubmissionReceiptKey(identity, viewer, entry.id),
        entry
      );
      pending.current = null;
      await invalidateCompetition(client, identity);
      await client.invalidateQueries({
        queryKey: ["DROPS", { waveId: wave.id }],
      });
      onClose();
      router.push(
        `${getCompetitionRoute(wave.id, competition.id)}?entry=${encodeURIComponent(entry.id)}`
      );
    } catch (error) {
      if (isRejectedCompetitionCommand(error)) pending.current = null;
      setFailed(true);
      await invalidateCompetition(client, identity);
    } finally {
      setBusy(false);
    }
  };
  if (!profile)
    return (
      <output className="tw-block tw-text-iron-400">
        {t(locale, "competitions.signIn")}
      </output>
    );
  return (
    <section
      data-competition-command
      className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-p-4"
      aria-labelledby="native-entry-heading"
      aria-describedby={failureDescription}
    >
      <h2 id="native-entry-heading" className="tw-text-lg tw-text-iron-100">
        {t(locale, "competitions.submit")}
      </h2>
      <label
        htmlFor="native-entry-title"
        className="tw-block tw-text-sm tw-text-iron-300"
      >
        {t(locale, "competitions.entryTitle")}
      </label>
      <input
        id="native-entry-title"
        className={COMPETITION_INPUT}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={busy}
      />
      <CreateDropEmojiPickerLayerProvider
        desktopZIndex={10000}
        mobileZIndexClassName="tw-z-[10000]"
      >
        <MentionSearchScopeProvider
          visibilityGroupId={wave.visibility.scope.group?.id ?? null}
        >
          <DropEditor
            ref={editor}
            profile={profile}
            quotedDrop={null}
            type={CreateDropType.DROP}
            loading={busy}
            dropEditorRefreshKey={1}
            showSubmit={false}
            submitOnEnter={false}
            wave={{ name: competition.title, image: wave.picture, id: wave.id }}
            waveId={wave.id}
            forceScreenType={CreateDropScreenType.DESKTOP}
            onSubmitDrop={() => undefined}
            onCanSubmitChange={setCanSubmit}
          />
        </MentionSearchScopeProvider>
      </CreateDropEmojiPickerLayerProvider>
      {identitySubmission && (
        <div className="tw-space-y-2">
          {identityMode === IdentityMode.OnlyMyself ? (
            <p className="tw-text-sm tw-text-iron-300">
              {t(locale, "competitions.selfNomination", {
                identity: selfIdentity?.label ?? "",
              })}
            </p>
          ) : (
            <IdentitySearch
              identity={nominee?.value ?? null}
              selectedDisplayValue={nominee?.label ?? null}
              setIdentity={() => undefined}
              onSelectionChange={setNominee}
              label={t(locale, "competitions.nomination")}
              size={IdentitySearchSize.MD}
              disabled={busy}
              autoFocus={false}
              error={Boolean(nominee && !identityValid)}
              errorMessage={
                identityMode === IdentityMode.OnlyOthers && nominatesSelf
                  ? t(locale, "competitions.nominateOther")
                  : null
              }
            />
          )}
        </div>
      )}
      {requirements.map((item, index) => (
        <label
          key={item.name}
          className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-300"
        >
          <span>
            {item.name.trim() ||
              t(locale, "competitions.metadataFallback", { number: index + 1 })}
          </span>
          <input
            type={item.type === "NUMBER" ? "number" : "text"}
            required
            className={COMPETITION_INPUT}
            value={metadata[item.name] ?? ""}
            aria-invalid={
              metadata[item.name] !== undefined && !metadata[item.name]?.trim()
            }
            aria-describedby={failureDescription}
            onChange={(event) =>
              setMetadata((current) => ({
                ...current,
                [item.name]: event.target.value,
              }))
            }
            disabled={busy}
          />
        </label>
      ))}
      {competition.participation.required_media.length > 0 && (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "competitions.requirements")}:{" "}
          {competition.participation.required_media
            .map((media) => getCompetitionConfigLabel(locale, media))
            .join(", ")}
        </p>
      )}
      {competition.participation.terms && (
        <div className="tw-space-y-3">
          <p
            id={termsId}
            className="tw-max-h-48 tw-overflow-y-auto tw-whitespace-pre-wrap tw-text-sm tw-text-iron-400"
          >
            {competition.participation.terms}
          </p>
          <label className="tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
            <input
              type="checkbox"
              aria-describedby={termsId}
              checked={terms}
              onChange={(event) =>
                setAcceptedTermsVersion(
                  event.target.checked ? competition.config_version : null
                )
              }
              disabled={busy}
            />
            {t(locale, "competitions.terms")}
          </label>
        </div>
      )}
      {failed && (
        <p id={errorId} role="alert" className="tw-text-sm tw-text-red">
          {t(locale, "competitions.failure")}
        </p>
      )}
      {!competition.permissions.submit && (
        <output className="tw-block tw-text-sm tw-text-iron-400">
          {t(locale, "competitions.submitClosed")}
        </output>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={!ready || busy}
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
