"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { STATEMENT_GROUP } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import UserPageIdentityStatementsConsolidatedAddresses from "./consolidated-addresses/UserPageIdentityStatementsConsolidatedAddresses";
import UserPageIdentityStatementsContacts from "./contacts/UserPageIdentityStatementsContacts";
import UserPageIdentityAddStatementsHeader from "./header/UserPageIdentityAddStatementsHeader";
import UserPageIdentityStatementsNFTAccounts from "./nft-accounts/UserPageIdentityStatementsNFTAccounts";
import UserPageIdentityStatementsSocialMediaAccounts from "./social-media-accounts/UserPageIdentityStatementsSocialMediaAccounts";
import UserPageIdentityStatementsSocialMediaVerificationPosts from "./social-media-verification-posts/UserPageIdentityStatementsSocialMediaVerificationPosts";
export default function UserPageIdentityStatements({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const user = (params?.["user"] as string)?.toLowerCase();
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<
    CicStatement[]
  >([]);

  const [contacts, setContacts] = useState<CicStatement[]>([]);
  const [nftAccounts, setNftAccounts] = useState<CicStatement[]>([]);
  const [socialMediaVerificationPosts, setSocialMediaVerificationPosts] =
    useState<CicStatement[]>([]);

  const { isLoading, data: statements } = useQuery<CicStatement[]>({
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

  useEffect(() => {
    if (!statements) {
      setNftAccounts([]);
      setSocialMediaAccounts([]);
      setContacts([]);
      setSocialMediaVerificationPosts([]);
      return;
    }
    const sortedStatements = [...statements].sort((a, d) => {
      return new Date(d.crated_at).getTime() - new Date(a.crated_at).getTime();
    });
    setSocialMediaAccounts(
      sortedStatements.filter(
        (s) => s.statement_group === STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT
      )
    );
    setContacts(
      sortedStatements.filter(
        (s) => s.statement_group === STATEMENT_GROUP.CONTACT
      )
    );

    setNftAccounts(
      sortedStatements.filter(
        (s) => s.statement_group === STATEMENT_GROUP.NFT_ACCOUNTS
      )
    );

    setSocialMediaVerificationPosts(
      sortedStatements.filter(
        (s) =>
          s.statement_group === STATEMENT_GROUP.SOCIAL_MEDIA_VERIFICATION_POST
      )
    );
  }, [statements]);

  return (
    <div className="lg:tw-border-t lg:tw-border-x-0 lg:tw-border-b-0 lg:tw-border-solid lg:tw-border-white/10 tw-pt-6 tw-px-6">
      <div>
        <UserPageIdentityAddStatementsHeader
          profile={profile}
        />
        <div className="tw-mt-2 lg:tw-mt-4 tw-scroll-py-3 tw-overflow-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-700 tw-scrollbar-track-transparent desktop-hover:hover:tw-scrollbar-thumb-iron-500">
          <div className="tw-relative tw-pb-6 lg:tw-pb-8 tw-mx-auto tw-grid tw-grid-cols-1 xl:tw-gap-x-8 xl:tw-gap-y-2 lg:tw-mx-0 xl:tw-grid-cols-5">
            <div className="tw-col-span-full tw-space-y-6 md:tw-space-y-8">
              <div className="tw-grid tw-grid-cols-1 tw-gap-y-6">
                <div>
                  <UserPageIdentityStatementsConsolidatedAddresses
                    profile={profile}
                  />
                </div>
                <div>
                  <UserPageIdentityStatementsSocialMediaAccounts
                    statements={socialMediaAccounts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>
                <div>
                  <UserPageIdentityStatementsNFTAccounts
                    statements={nftAccounts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>

                <div>
                  <UserPageIdentityStatementsContacts
                    statements={contacts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>
                <div>
                  <UserPageIdentityStatementsSocialMediaVerificationPosts
                    statements={socialMediaVerificationPosts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>
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
          style={TOOLTIP_STYLES}>
          <ul className="tw-m-0 tw-py-2 tw-pl-4 tw-list-disc tw-text-iron-300 tw-font-normal tw-space-y-1">
            <li>All statements are optional.</li>
            <li>All statements are fully and permanently public.</li>
            <li>
              Seize does not connect to social media accounts or verify posts.
            </li>
            <li>The community will rate the accuracy of statements.</li>
          </ul>
        </Tooltip>
      </div>
    </div>
  );
}
