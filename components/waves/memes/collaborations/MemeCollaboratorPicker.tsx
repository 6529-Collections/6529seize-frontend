"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import IdentitySearch from "@/components/utils/input/identity/IdentitySearch";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import { useAuth } from "@/components/auth/Auth";
import { commonApiFetch } from "@/services/api/common-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import {
  ChevronDownIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const EMPTY_PROFILE_IDS: readonly string[] = [];

export function MemeCollaboratorPicker({
  collaborators,
  onChange,
  excludedIds = EMPTY_PROFILE_IDS,
  declinedIds = EMPTY_PROFILE_IDS,
  occupiedCount = excludedIds.length,
  disabled = false,
  compact = false,
}: {
  readonly excludedIds?: readonly string[];
  readonly declinedIds?: readonly string[];
  readonly occupiedCount?: number;
  readonly disabled?: boolean;
  readonly compact?: boolean;
  readonly collaborators: ApiMemeCollaboratorProfile[];
  readonly onChange: (profiles: ApiMemeCollaboratorProfile[]) => void;
}) {
  const { connectedProfile } = useAuth();
  const locale = useBrowserLocale();
  const [expanded, setExpanded] = useState(collaborators.length > 0);
  const contentId = useId();
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<
    "unavailable" | "self" | "duplicate" | "declined" | "limit" | null
  >(null);
  const select = async (option: SelectableIdentityOption | null) => {
    if (!option || resolving || disabled) return;
    setResolving(true);
    setError(null);
    try {
      const profile = await commonApiFetch<ApiIdentity>({
        endpoint: `identities/${encodeURIComponent(option.profileId ?? option.value)}`,
      });
      if (!profile.id || !profile.handle) {
        setError("unavailable");
        return;
      }
      let problem: typeof error = null;
      if (profile.id === connectedProfile?.id) problem = "self";
      else if (declinedIds.includes(profile.id)) problem = "declined";
      else if (
        collaborators.some((item) => item.id === profile.id) ||
        excludedIds.includes(profile.id)
      )
        problem = "duplicate";
      else if (collaborators.length + occupiedCount >= 5) problem = "limit";
      if (problem) {
        setError(problem);
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
      setError("unavailable");
    } finally {
      setResolving(false);
    }
  };
  return (
    <div className="tailwind-scope tw-space-y-3">
      <Button
        variant="secondary"
        size={compact ? "md" : "lg"}
        aria-expanded={expanded}
        aria-controls={contentId}
        disabled={disabled || resolving}
        onClick={() => setExpanded((value) => !value)}
      >
        {collaborators.length ? (
          <span>
            {t(locale, "memes.collaborations.selected", {
              count: collaborators.length,
            })}
          </span>
        ) : (
          <>
            <PlusIcon
              aria-hidden="true"
              className="-tw-ml-2 tw-size-4 tw-shrink-0"
            />
            <span>{t(locale, "memes.collaborations.add")}</span>
          </>
        )}
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-4 ${expanded ? "tw-rotate-180" : ""}`}
        />
      </Button>
      <div id={contentId} hidden={!expanded} className="tw-space-y-3">
        <IdentitySearch
          key={collaborators.length}
          identity={null}
          setIdentity={() => undefined}
          onSelectionChange={(option) => {
            void select(option);
          }}
          label={t(locale, "memes.collaborations.search")}
          searchingLabel={t(locale, "memes.collaborations.searching")}
          searchErrorLabel={t(locale, "memes.collaborations.searchError")}
          iconPositionClassName="tw-top-6 -tw-translate-y-1/2"
          inputClassName="tw-h-12 tw-leading-5"
          disabled={
            disabled || resolving || collaborators.length + occupiedCount >= 5
          }
        />
        {!!collaborators.length && (
          <ul
            aria-label={t(locale, "memes.collaborations.title")}
            className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0"
          >
            {collaborators.map((profile) => (
              <li
                key={profile.id}
                className="tw-flex tw-max-w-full tw-items-center tw-gap-2 tw-rounded-full tw-bg-iron-900/70 tw-py-0 tw-pl-1.5 tw-pr-1 tw-ring-1 tw-ring-inset tw-ring-white/10"
              >
                <span className="tw-flex tw-shrink-0 tw-overflow-hidden tw-rounded-full">
                  <ProfileAvatar
                    pfpUrl={profile.pfp}
                    size={ProfileBadgeSize.SMALL}
                    alt=""
                    fallbackContent={<span aria-hidden="true">@</span>}
                  />
                </span>
                <span className="tw-max-w-48 tw-truncate tw-text-sm tw-font-medium tw-text-iron-100">
                  @{profile.handle}
                </span>
                <button
                  type="button"
                  disabled={disabled || resolving}
                  className="tw-flex tw-min-h-11 tw-min-w-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 hover:tw-text-error focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
                  aria-label={t(locale, "memes.collaborations.remove", {
                    handle: profile.handle,
                  })}
                  onClick={() =>
                    onChange(
                      collaborators.filter((item) => item.id !== profile.id)
                    )
                  }
                >
                  <XMarkIcon aria-hidden="true" className="tw-size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
            {t(locale, `memes.collaborations.error.${error}`)}
          </p>
        )}
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {t(locale, "memes.collaborations.capacity", {
            count: occupiedCount + collaborators.length,
          })}
        </p>
        <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-300">
          {t(locale, "memes.collaborations.hint")}
        </p>
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "memes.collaborations.mintHint")}
        </p>
      </div>
    </div>
  );
}
