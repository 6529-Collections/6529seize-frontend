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
          <div className="tw-px-4 tw-py-6 lg:tw-p-8 tw-mx-auto tw-grid tw-grid-cols-1 xl:tw-gap-x-8 tw-gap-y-6 xl:tw-gap-y-2 lg:tw-mx-0 xl:tw-grid-cols-5">
            <div className="tw-col-span-full tw-pb-6 tw-mb-6 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0  tw-border-white/10">
              <div className="tw-max-w-full sm:tw-max-w-prose">
                <span className="tw-block tw-text-base tw-font-medium tw-text-iron-50">
                  About me
                </span>
                <p className="tw-mb-0 tw-mt-2 tw-text-iron-400 tw-text-base tw-font-normal">
                  Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                  Eveniet quis consequatur autem quas corrupti numquam tenetur
                  tempora. Possimus, commodi. Praesentium!
                </p>
              </div>
            </div>

            <div className="tw-col-span-3 tw-space-y-6 md:tw-space-y-8">
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-6 md:tw-grid-cols-2">
                <UserPageIdentityStatementsConsolidatedAddresses
                  profile={profile}
                />
                <UserPageIdentityStatementsSocialMediaAccounts
                  statements={socialMediaAccounts}
                  profile={profile}
                  loading={isLoading}
                />
              </div>

              <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-6 md:tw-grid-cols-2">
                <UserPageIdentityStatementsContacts
                  statements={contacts}
                  profile={profile}
                  loading={isLoading}
                />
                <UserPageIdentityStatementsSocialMediaVerificationPosts
                  statements={socialMediaVerificationPosts}
                  profile={profile}
                  loading={isLoading}
                />
              </div>
            </div>

            <div className="tw-col-span-2 xl:tw-ml-auto">
              <ul className="tw-pl-4 xl:tw-pl-10 2xl:px-0 tw-list-disc tw-text-iron-500 tw-text-sm tw-font-normal tw-space-y-1">
                <li>All statements are optional.</li>
                <li>All statements are fully and permanently public.</li>
                <li>
                  Seize does not connect to social media accounts or verify
                  posts.
                </li>
                <li>The community will rate the accuracy of statements.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
