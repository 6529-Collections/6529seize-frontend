import { useQuery } from "@tanstack/react-query";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import DiscordIcon from "../../utils/icons/DiscordIcon";

import TelegramIcon from "../../utils/icons/TelegramIcon";

import WeChatIcon from "../../utils/icons/WeChatIcon";
import UserPageIdentityStatementsConsolidatedAddresses from "./consolidated-addresses/UserPageIdentityStatementsConsolidatedAddresses";
import UserPageIdentityAddStatementsHeader from "./header/UserPageIdentityAddStatementsHeader";
import { useRouter } from "next/router";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useEffect, useState } from "react";
import { STATEMENT_GROUP } from "../../../../helpers/Types";
import UserPageIdentityStatementsSocialMediaAccounts from "./social-media-accounts/UserPageIdentityStatementsSocialMediaAccounts";
import UserPageIdentityStatementsContacts from "./contacts/UserPageIdentityStatementsContacts";
import UserPageIdentityStatementsSocialMediaVerificationPosts from "./social-media-verification-posts/UserPageIdentityStatementsSocialMediaVerificationPosts";


export default function UserPageIdentityStatements({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<
    CicStatement[]
  >([]);

  const [contacts, setContacts] = useState<CicStatement[]>([]);
  const [socialMediaVerificationPosts, setSocialMediaVerificationPosts] =
    useState<CicStatement[]>([]);

  const {
    isLoading,
    isError,
    data: statements,
    error,
  } = useQuery<CicStatement[]>({
    queryKey: ["user-cic-statements", user],
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
    <div className="tw-mt-10">
      <div className="tw-bg-neutral-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
        <UserPageIdentityAddStatementsHeader profile={profile} />
        <div className="tw-p-8 tw-mx-auto tw-grid tw-max-w-2xl tw-grid-cols-1 tw-gap-x-8 tw-gap-y-16 tw-sm:gap-y-20 tw-lg:mx-0 lg:tw-max-w-none lg:tw-grid-cols-3">
          <div className="tw-col-span-2 tw-space-y-5">
            <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
              <UserPageIdentityStatementsConsolidatedAddresses
                profile={profile}
              />
              <UserPageIdentityStatementsSocialMediaAccounts
                statements={socialMediaAccounts}
                profile={profile}
              />
            </div>

            <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
              <UserPageIdentityStatementsContacts
                statements={contacts}
                profile={profile}
              />
              <UserPageIdentityStatementsSocialMediaVerificationPosts
                statements={socialMediaVerificationPosts}
                profile={profile}
              />
            </div>
          </div>

          <div className="tw-col-span-1 tw-ml-auto">
            <ul className="tw-list-disc tw-text-neutral-500 tw-text-sm tw-font-normal tw-space-y-1">
              <li>All statements are optional.</li>
              <li>All statements are fully and permanently public.</li>
              <li>
                Seize does not connect to social media accounts or verify posts.
              </li>
              <li>The community will rate the accuracy of statements.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
