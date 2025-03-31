import { useQuery } from "@tanstack/react-query";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import UserPageIdentityStatementsConsolidatedAddresses from "./consolidated-addresses/UserPageIdentityStatementsConsolidatedAddresses";
import UserPageIdentityAddStatementsHeader from "./header/UserPageIdentityAddStatementsHeader";
import { useRouter } from "next/router";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useEffect, useState } from "react";
import { STATEMENT_GROUP } from "../../../../helpers/Types";
import UserPageIdentityStatementsSocialMediaAccounts from "./social-media-accounts/UserPageIdentityStatementsSocialMediaAccounts";
import UserPageIdentityStatementsContacts from "./contacts/UserPageIdentityStatementsContacts";
import UserPageIdentityStatementsSocialMediaVerificationPosts from "./social-media-verification-posts/UserPageIdentityStatementsSocialMediaVerificationPosts";
import UserPageIdentityStatementsNFTAccounts from "./nft-accounts/UserPageIdentityStatementsNFTAccounts";
import Tippy from "@tippyjs/react";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
export default function UserPageIdentityStatements({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<
    CicStatement[]
  >([]);

  const [contacts, setContacts] = useState<CicStatement[]>([]);
  const [nftAccounts, setNftAccounts] = useState<CicStatement[]>([]);
  const [socialMediaVerificationPosts, setSocialMediaVerificationPosts] =
    useState<CicStatement[]>([]);

  const { isLoading, data: statements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${user}/cic/statements`,
      }),
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
    <div className="tw-mt-6 lg:tw-mt-8">
      <div>
        <UserPageIdentityAddStatementsHeader profile={profile} />
        <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl tw-scroll-py-3 tw-overflow-auto">
          <div className="tw-relative tw-px-4 tw-py-6 lg:tw-p-8 tw-mx-auto tw-grid tw-grid-cols-1 xl:tw-gap-x-8 xl:tw-gap-y-2 lg:tw-mx-0 xl:tw-grid-cols-5">
            <div className="tw-col-span-full tw-space-y-6 md:tw-space-y-8">
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 xl:tw-grid-cols-9">
                <div className="tw-col-span-3">
                  <UserPageIdentityStatementsConsolidatedAddresses
                    profile={profile}
                  />
                </div>
                <div className="tw-col-span-3">
                  <UserPageIdentityStatementsSocialMediaAccounts
                    statements={socialMediaAccounts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>
                <div className="tw-col-span-3">
                  <UserPageIdentityStatementsNFTAccounts
                    statements={nftAccounts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>

                <div className="tw-col-span-3">
                  <UserPageIdentityStatementsContacts
                    statements={contacts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>
                <div className="tw-col-span-3">
                  <UserPageIdentityStatementsSocialMediaVerificationPosts
                    statements={socialMediaVerificationPosts}
                    profile={profile}
                    loading={isLoading}
                  />
                </div>
                <div className="tw-absolute tw-right-2 lg:tw-right-4 tw-top-2 xl:tw-top-4">
                  <Tippy
                    content={
                      <ul className="tw-pl-4 tw-list-disc tw-text-iron-300 tw-font-normal tw-space-y-1">
                        <li>All statements are optional.</li>
                        <li>
                          All statements are fully and permanently public.
                        </li>
                        <li>
                          Seize does not connect to social media accounts or
                          verify posts.
                        </li>
                        <li>
                          The community will rate the accuracy of statements.
                        </li>
                      </ul>
                    }
                    theme="dark"
                    placement="top">
                    <div
                      tabIndex={0}
                      className="tw-rounded-full tw-h-10 tw-w-10 tw-inline-flex tw-items-center tw-justify-center focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400">
                      <svg
                        className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </Tippy>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
