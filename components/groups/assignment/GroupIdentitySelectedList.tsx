"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserIcon, XMarkIcon } from "@heroicons/react/24/outline";
import pLimit from "p-limit";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatAddress, isValidEthAddress } from "@/helpers/addressFormatting";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { getIdentityQueryKey } from "@/services/api/identity-query";

const PAGE_SIZE = 20;
// Only visible wallets are requested, with a shared cap across both treatments.
const lookupProfile = pLimit(4);

function SelectedWallet({
  identity,
  onRemove,
  mobilePresentation,
}: {
  readonly identity: CommunityMemberMinimal;
  readonly mobilePresentation: boolean;
  readonly onRemove: (wallet: string) => void;
}) {
  const locale = useBrowserLocale();
  const wallet = identity.wallet.trim().toLowerCase();
  const hasProfile = !!identity.handle && !isValidEthAddress(identity.handle);
  const profile = useQuery({
    queryKey: getIdentityQueryKey(wallet),
    queryFn: ({ signal }) =>
      lookupProfile(() => {
        signal.throwIfAborted();
        return commonApiFetch<ApiIdentity>({
          endpoint: `identities/${encodeURIComponent(wallet)}`,
          signal,
        });
      }),
    enabled: !hasProfile,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const data = hasProfile ? identity : profile.data;
  const handle = data?.handle?.trim();
  const display = data?.display?.trim();
  const name =
    (handle && !isValidEthAddress(handle) ? handle : null) ??
    (display && !isValidEthAddress(display) ? display : null);
  const shortWallet = formatAddress(wallet);
  const walletLabel = t(
    locale,
    "waves.create.groups.inlineIdentities.walletLabel",
    { wallet: shortWallet }
  );
  const isLoading = !hasProfile && profile.isPending;
  const failed =
    profile.isError && getStructuredApiErrorStatus(profile.error) !== 404;

  return (
    <li
      className={`tw-flex tw-min-h-14 tw-min-w-0 tw-items-center tw-gap-3 ${mobilePresentation ? "tw-rounded-xl tw-bg-iron-800 tw-px-3 tw-py-2 tw-ring-1 tw-ring-iron-700" : "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-1"}`}
    >
      <ProfileAvatar
        pfpUrl={data?.pfp}
        size={ProfileBadgeSize.SMALL}
        alt=""
        fallbackContent={
          <UserIcon aria-hidden="true" className="tw-size-4 tw-text-iron-400" />
        }
      />
      <div className="tw-min-w-0 tw-flex-1">
        {isLoading ? (
          <output className="tw-text-xs tw-text-iron-400">
            {t(locale, "waves.create.groups.inlineIdentities.loadingProfiles")}
          </output>
        ) : (
          <>
            <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-text-iron-100">
              {name ?? walletLabel}
            </span>
            {name && (
              <span
                title={wallet}
                className="tw-block tw-truncate tw-text-xs tw-text-iron-400"
              >
                {walletLabel}
              </span>
            )}
            {failed && (
              <div>
                <output className="tw-my-1 tw-block tw-text-xs tw-text-iron-400">
                  {t(
                    locale,
                    "waves.create.groups.inlineIdentities.profileError"
                  )}
                </output>
                <Button
                  variant="secondary"
                  size="xs"
                  className="tw-min-h-11"
                  loading={profile.isFetching}
                  onClick={() => {
                    void profile.refetch();
                  }}
                >
                  {t(
                    locale,
                    "waves.create.groups.inlineIdentities.retryProfiles"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(identity.wallet)}
        aria-label={t(
          locale,
          "waves.create.groups.inlineIdentities.removeWallet",
          {
            name: name ?? t(locale, "waves.create.groups.identities"),
            wallet: shortWallet,
          }
        )}
        className={`tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${mobilePresentation ? "tw-relative tw-size-8 tw-rounded-full tw-text-iron-500 after:tw-absolute after:-tw-inset-1.5 after:tw-content-[''] active:tw-bg-iron-700 active:tw-text-iron-50 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-50" : "tw-size-11 tw-rounded-lg tw-text-iron-400 desktop-hover:hover:tw-text-error"}`}
      >
        <XMarkIcon aria-hidden="true" className="tw-size-4" />
      </button>
    </li>
  );
}

export default function GroupIdentitySelectedList({
  identities,
  onRemove,
  mobilePresentation = false,
}: {
  readonly identities: readonly CommunityMemberMinimal[];
  readonly mobilePresentation?: boolean;
  readonly onRemove: (wallet: string) => void;
}) {
  const locale = useBrowserLocale();
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(identities.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  if (page !== currentPage) {
    setPage(currentPage);
  }
  const start = currentPage * PAGE_SIZE;
  const visibleIdentities = identities.slice(start, start + PAGE_SIZE);

  return (
    <div className="tw-w-full tw-min-w-0">
      <ul
        className={`tw-m-0 tw-list-none tw-p-0 ${mobilePresentation ? "tw-space-y-3" : ""}`}
      >
        {visibleIdentities.map((identity) => (
          <SelectedWallet
            key={identity.wallet}
            identity={identity}
            mobilePresentation={mobilePresentation}
            onRemove={onRemove}
          />
        ))}
      </ul>
      {identities.length > PAGE_SIZE && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
          <output className="tw-text-xs tw-text-iron-400">
            {t(locale, "waves.create.groups.inlineIdentities.page", {
              start: formatInteger(locale, start + 1),
              end: formatInteger(
                locale,
                Math.min(start + PAGE_SIZE, identities.length)
              ),
              total: formatInteger(locale, identities.length),
            })}
          </output>
          <div className="tw-flex tw-gap-2">
            <Button
              variant="secondary"
              size="xs"
              className="tw-min-h-11"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              {t(locale, "waves.create.groups.inlineIdentities.previous")}
            </Button>
            <Button
              variant="secondary"
              size="xs"
              className="tw-min-h-11"
              disabled={currentPage === lastPage}
              onClick={() => setPage(currentPage + 1)}
            >
              {t(locale, "waves.create.groups.inlineIdentities.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
