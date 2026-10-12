"use client";

import { useState } from "react";
import IdentitySearch from "@/components/utils/input/identity/IdentitySearch";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import { useAuth } from "@/components/auth/Auth";
import { commonApiFetch } from "@/services/api/common-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function MemeCollaboratorPicker({
  collaborators,
  onChange,
}: {
  readonly collaborators: ApiMemeCollaboratorProfile[];
  readonly onChange: (profiles: ApiMemeCollaboratorProfile[]) => void;
}) {
  const { connectedProfile } = useAuth();
  const locale = useBrowserLocale();
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(false);
  const select = async (option: SelectableIdentityOption | null) => {
    if (!option || resolving) return;
    setResolving(true);
    setError(false);
    try {
      const profile = await commonApiFetch<ApiIdentity>({
        endpoint: `identities/${encodeURIComponent(option.profileId ?? option.value)}`,
      });
      if (
        !profile.id ||
        !profile.handle ||
        profile.id === connectedProfile?.id ||
        collaborators.some((item) => item.id === profile.id) ||
        collaborators.length >= 20
      ) {
        setError(true);
        return;
      }
      onChange([
        ...collaborators,
        {
          id: profile.id,
          handle: profile.handle,
          display: profile.handle,
          pfp: profile.pfp,
        },
      ]);
    } catch {
      setError(true);
    } finally {
      setResolving(false);
    }
  };
  return (
    <div className="tw-space-y-3">
      <IdentitySearch
        key={collaborators.length}
        identity={null}
        setIdentity={() => undefined}
        onSelectionChange={(option) => {
          void select(option);
        }}
        label={t(locale, "memes.collaborations.search")}
        disabled={resolving || collaborators.length >= 20}
      />
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "memes.collaborations.hint")}
      </p>
      {error && (
        <p role="alert" className="tw-text-sm tw-text-rose-300">
          {t(locale, "memes.collaborations.invalid")}
        </p>
      )}
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
        {collaborators.map((profile) => (
          <li
            key={profile.id}
            className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-800 tw-pl-3"
          >
            <span className="tw-text-sm tw-text-iron-100">
              @{profile.handle}
            </span>
            <button
              type="button"
              className="tw-min-h-10 tw-min-w-10 tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              aria-label={t(locale, "memes.collaborations.remove", {
                handle: profile.handle,
              })}
              onClick={() =>
                onChange(collaborators.filter((item) => item.id !== profile.id))
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
