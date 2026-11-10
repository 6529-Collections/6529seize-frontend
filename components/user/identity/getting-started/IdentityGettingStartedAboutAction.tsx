"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import UserPageHeaderAboutEdit from "@/components/user/user-page-header/about/UserPageHeaderAboutEdit";
import Button from "@/components/utils/button/Button";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const ABOUT_STATEMENT_TYPE: CicStatement["statement_type"] = STATEMENT_TYPE.BIO;

export default function IdentityGettingStartedAboutAction({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const locale = useBrowserLocale();
  const [isOpen, setIsOpen] = useState(false);
  const identity = profile.handle?.trim().toLowerCase() ?? "";
  const { data, isPending, isError, isFetching, refetch } = useQuery<
    CicStatement[]
  >({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, identity],
    queryFn: () =>
      commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${encodeURIComponent(identity)}/cic/statements`,
      }),
    enabled: !!identity,
  });
  const statement =
    data?.find(
      (item) =>
        item.statement_group === STATEMENT_GROUP.GENERAL &&
        item.statement_type === ABOUT_STATEMENT_TYPE
    ) ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="tw-flex tw-min-h-11 tw-max-w-full tw-cursor-pointer tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60"
      >
        <PencilSquareIcon
          className="tw-size-4 tw-flex-none"
          aria-hidden="true"
        />
        <span>
          {t(
            locale,
            statement
              ? "identityGettingStarted.aboutEdit"
              : "identityGettingStarted.aboutAdd"
          )}
        </span>
        <span className="tw-text-iron-400">
          {t(locale, "identityGettingStarted.optional")}
        </span>
      </button>
      <MobileWrapperDialog
        title={t(locale, "user.profileHeader.edit.aboutTitle")}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tabletModal
        showHeaderCloseButton
        fitVisualViewport
        maxWidthClass="md:tw-max-w-xl"
      >
        <div className="tw-px-4 sm:tw-px-6">
          <p className="tw-mb-4 tw-mt-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "user.profile.identity.statements.add.privacyNotice")}
          </p>
          {isPending ? (
            <p
              role="status"
              className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
            >
              {t(locale, "identityGettingStarted.aboutLoading")}
            </p>
          ) : isError && !data ? (
            <div role="alert">
              <p className="tw-mb-4 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, "identityGettingStarted.aboutLoadError")}
              </p>
              <Button
                variant="secondary"
                loading={isFetching}
                onClick={() => {
                  void refetch();
                }}
              >
                {t(locale, "identityGettingStarted.retry")}
              </Button>
            </div>
          ) : (
            <UserPageHeaderAboutEdit
              key={statement?.id ?? "new-about"}
              profile={profile}
              statement={statement}
              onClose={() => setIsOpen(false)}
              autoFocus
            />
          )}
        </div>
      </MobileWrapperDialog>
    </>
  );
}
