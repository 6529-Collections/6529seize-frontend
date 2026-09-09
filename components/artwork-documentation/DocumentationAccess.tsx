"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import IdentitySearch from "@/components/utils/input/identity/IdentitySearch";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  getDocumentationGrants,
  grantDocumentationAccess,
  revokeDocumentationAccess,
} from "@/services/api/artwork-documentation-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { MODULE_IDS } from "@/lib/artwork-documentation/registry";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationAccess({
  context,
}: {
  readonly context: ApiArtworkDocumentationContext;
}) {
  const { msg } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [selection, setSelection] = useState<SelectableIdentityOption | null>(
    null
  );
  const artist = context.owner_profile_id === connectedProfile?.id;
  const [modules, setModules] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [role, setRole] = useState("curatorial");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "grants",
      actorKey
    ),
    queryFn: ({ signal }) => getDocumentationGrants(context.id, signal),
    enabled: context.capabilities.manage_assignments,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  if (!context.capabilities.manage_assignments) return null;
  const run = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError(false);
    try {
      await operation();
      await query.refetch();
      setSelection(null);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const grantParticipant = () =>
    grantDocumentationAccess(context.id, {
      subject_profile_id: selection?.profileId,
      capabilities: {
        read_context: true,
        edit_modules: artist ? modules : [],
        read_archival_files: artist
          ? evidence.includes("archival")
          : role === "technical",
        read_rights_evidence: artist
          ? evidence.includes("rights")
          : role === "rights",
        read_source_receipts: artist && evidence.includes("sources"),
        read_contact: artist && evidence.includes("contact"),
        confirm_as_artist: false,
        review_lanes: artist ? [] : [role],
        manage_assignments: false,
        manage_context: false,
      },
    });
  return (
    <section className={`${panelClass} tw-space-y-4`}>
      <h3 className="tw-text-lg tw-font-semibold">{msg("assign")}</h3>
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
      {query.data?.data
        .filter((grant) => grant.revoked_at === null)
        .map((grant) => (
          <div
            key={grant.id}
            className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3"
          >
            <GrantedParticipant profileId={grant.subject_profile_id} />
            <DocumentationButton
              secondary
              disabled={busy}
              onClick={() => {
                void run(() => revokeDocumentationAccess(context.id, grant.id));
              }}
            >
              {msg("revoke")}
            </DocumentationButton>
          </div>
        ))}
      <IdentitySearch
        identity={selection?.value ?? null}
        selectedDisplayValue={selection?.label}
        label={msg("participant")}
        setIdentity={(identity) => {
          if (!identity) setSelection(null);
        }}
        onSelectionChange={setSelection}
        disabled={busy}
      />
      {artist ? (
        <fieldset className="tw-space-y-3">
          <legend className="tw-mb-3 tw-text-sm tw-font-medium">
            {msg("editorPermissions")}
          </legend>
          <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
            {MODULE_IDS.map((id) => (
              <label
                key={id}
                className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-iron-300"
              >
                <input
                  type="checkbox"
                  className="tw-h-5 tw-w-5 tw-accent-primary-400"
                  checked={modules.includes(id)}
                  onChange={(event) =>
                    setModules(
                      event.target.checked
                        ? [...modules, id]
                        : modules.filter((item) => item !== id)
                    )
                  }
                />
                {msg(`module.${id}`)}
              </label>
            ))}
          </div>
          <p className="tw-text-xs tw-text-iron-400">
            {msg("evidencePermissions")}
          </p>
          {["archival", "rights", "sources", "contact"].map((id) => (
            <label
              key={id}
              className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-iron-300"
            >
              <input
                type="checkbox"
                className="tw-h-5 tw-w-5 tw-accent-primary-400"
                checked={evidence.includes(id)}
                onChange={(event) =>
                  setEvidence(
                    event.target.checked
                      ? [...evidence, id]
                      : evidence.filter((item) => item !== id)
                  )
                }
              />
              {msg(`evidence.${id}`)}
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="tw-block tw-text-sm tw-text-iron-300">
          {msg("role")}
          <select
            className={`${inputClass} tw-mt-2`}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {["curatorial", "technical", "rights"].map((option) => (
              <option key={option} value={option}>
                {documentationOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
      )}
      <DocumentationButton
        disabled={
          busy || !selection?.profileId || (artist && modules.length === 0)
        }
        onClick={() => {
          void run(grantParticipant);
        }}
      >
        {msg("assign")}
      </DocumentationButton>
    </section>
  );
}

function GrantedParticipant({ profileId }: { readonly profileId: string }) {
  const { msg } = useDocumentationMessages();
  const profile = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: profileId }),
    retry: false,
    staleTime: 60_000,
  });
  return (
    <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
      {profile.data?.pfp && (
        <Image
          src={profile.data.pfp}
          alt=""
          width={28}
          height={28}
          unoptimized
          className="tw-h-7 tw-w-7 tw-rounded-full tw-object-cover"
        />
      )}
      <span>{profile.data?.handle ?? msg("participant")}</span>
    </span>
  );
}
