"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageIdentityStatementsConsolidatedAddresses from "./consolidated-addresses/UserPageIdentityStatementsConsolidatedAddresses";
import UserPageIdentityStatementsContacts from "./contacts/UserPageIdentityStatementsContacts";
import UserPageIdentityAddStatementsHeader from "./header/UserPageIdentityAddStatementsHeader";
import UserPageIdentityStatementsNFTAccounts from "./nft-accounts/UserPageIdentityStatementsNFTAccounts";
import UserPageIdentityStatementsSocialMediaAccounts from "./social-media-accounts/UserPageIdentityStatementsSocialMediaAccounts";
import UserPageIdentityStatementsSocialMediaVerificationPosts from "./social-media-verification-posts/UserPageIdentityStatementsSocialMediaVerificationPosts";
export default function UserPageIdentityStatements({
  profile,
  headerAction,
}: {
  readonly profile: ApiIdentity;
  readonly headerAction?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const params = useParams();
  const user = (params?.["user"] as string)?.toLowerCase();

  const {
    isLoading,
    isFetching,
    isError,
    data: statements,
    refetch,
  } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, user],
    queryFn: async () => {
      if (!user) {
        throw new Error(
          "UserPageIdentityStatements attempted to fetch without a user param"
        );
      }

      return await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${user}/cic/statements`,
      });
    },
    enabled: !!user,
  });

  const groupedStatements = useMemo(() => {
    const sortedStatements = [...(statements ?? [])].sort((a, d) => {
      return new Date(d.crated_at).getTime() - new Date(a.crated_at).getTime();
    });

    return {
      socialMediaAccounts: sortedStatements.filter(
        (s) => s.statement_group === STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT
      ),
      contacts: sortedStatements.filter(
        (s) => s.statement_group === STATEMENT_GROUP.CONTACT
      ),
      nftAccounts: sortedStatements
        .filter((s) => s.statement_group === STATEMENT_GROUP.NFT_ACCOUNTS)
        .sort((first, second) => {
          const firstIsCustom =
            first.statement_type === (STATEMENT_TYPE.LINK as string);
          const secondIsCustom =
            second.statement_type === (STATEMENT_TYPE.LINK as string);
          return Number(firstIsCustom) - Number(secondIsCustom);
        }),
      socialMediaVerificationPosts: sortedStatements.filter(
        (s) =>
          s.statement_group === STATEMENT_GROUP.SOCIAL_MEDIA_VERIFICATION_POST
      ),
    };
  }, [statements]);

  const shouldShowStatementGroup = (group: CicStatement[]) =>
    isLoading || group.length > 0;

  return (
    <div className="tw-px-4 tw-pt-4 lg:tw-border-x-0 lg:tw-border-b-0 lg:tw-border-t lg:tw-border-solid lg:tw-border-white/10 lg:tw-px-6 lg:tw-pt-6">
      <div>
        <UserPageIdentityAddStatementsHeader profile={profile} />
        <div className="tw-scroll-py-3 tw-overflow-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-500 lg:tw-mt-4">
          <div className="tw-relative tw-mx-auto tw-grid tw-grid-cols-1 tw-pb-6 lg:tw-mx-0 lg:tw-pb-8 xl:tw-grid-cols-5 xl:tw-gap-x-8 xl:tw-gap-y-2">
            <div className="tw-col-span-full tw-space-y-6 md:tw-space-y-8">
              <div className="tw-grid tw-grid-cols-1 tw-gap-y-6">
                <div>
                  <UserPageIdentityStatementsConsolidatedAddresses
                    profile={profile}
                    headerAction={headerAction}
                  />
                </div>
                {isError && (
                  <div
                    role="alert"
                    className="tw-rounded-lg tw-border tw-border-solid tw-border-red/30 tw-bg-red/10 tw-p-4"
                  >
                    <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
                      {t(locale, "user.profile.identity.statements.loadError")}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isFetching}
                      className="tw-mt-3"
                      onClick={() => void refetch()}
                    >
                      {t(locale, "user.profile.identity.statements.retry")}
                    </Button>
                  </div>
                )}
                {!isError &&
                  shouldShowStatementGroup(
                    groupedStatements.socialMediaAccounts
                  ) && (
                    <div>
                      <UserPageIdentityStatementsSocialMediaAccounts
                        statements={groupedStatements.socialMediaAccounts}
                        profile={profile}
                        loading={isLoading}
                      />
                    </div>
                  )}
                {!isError &&
                  shouldShowStatementGroup(groupedStatements.nftAccounts) && (
                    <div>
                      <UserPageIdentityStatementsNFTAccounts
                        statements={groupedStatements.nftAccounts}
                        profile={profile}
                        loading={isLoading}
                      />
                    </div>
                  )}

                {!isError &&
                  shouldShowStatementGroup(groupedStatements.contacts) && (
                    <div>
                      <UserPageIdentityStatementsContacts
                        statements={groupedStatements.contacts}
                        profile={profile}
                        loading={isLoading}
                      />
                    </div>
                  )}
                {!isError &&
                  shouldShowStatementGroup(
                    groupedStatements.socialMediaVerificationPosts
                  ) && (
                    <div>
                      <UserPageIdentityStatementsSocialMediaVerificationPosts
                        statements={
                          groupedStatements.socialMediaVerificationPosts
                        }
                        profile={profile}
                        loading={isLoading}
                      />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
        <Tooltip
          id="statements-help"
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
          className="!tw-w-72 !tw-max-w-[calc(100vw-11rem)] tw-whitespace-normal tw-text-left tw-leading-4 lg:!tw-max-w-none"
        >
          <ul className="tw-m-0 tw-list-disc tw-space-y-1 tw-py-2 tw-pl-4 tw-font-normal tw-text-iron-300">
            <li>{t(locale, "user.profile.identity.statements.optional")}</li>
            <li>
              {t(locale, "user.profile.identity.statements.permanentlyPublic")}
            </li>
            <li>
              {t(locale, "user.profile.identity.statements.noVerification")}
            </li>
            <li>
              {t(locale, "user.profile.identity.statements.communityRates")}
            </li>
          </ul>
        </Tooltip>
      </div>
    </div>
  );
}
