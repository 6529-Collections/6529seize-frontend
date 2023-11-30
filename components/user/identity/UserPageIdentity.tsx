import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityAddStatements from "./statements/UserPageIdentityAddStatements";
import UserPageIdentityAddStatementsContact from "./statements/contact/UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./statements/social-media/UserPageIdentityAddStatementsSocialMediaAccount";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityCICRatings from "./UserPageIdentityCICRatings";
import UserPageIdentityActivityLog from "./UserPageIdentityActivityLog";
import UserPageIdentityAddStatementsSocialMediaPostsHeader from "./statements/social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPostsHeader";
import UserPageIdentityAddStatementsSocialMediaPostsInput from "./statements/social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPostsInput";

export default function UserPageIdentity({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements profile={profile} />

      {/* <div className="tw-hidden">
        <UserPageIdentityAddStatementsSocialMediaAccount />
      </div>
      <div className="tw-hidden">
        <UserPageIdentityAddStatementsContact />
      </div> */}

      <div className="tw-relative tw-z-10" role="dialog">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
            <div className="tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-neutral-900 tw-text-left tw-shadow-xl tw-transition-all sm:tw-w-full tw-p-6 sm:tw-max-w-lg">
              <UserPageIdentityAddStatementsSocialMediaPostsHeader />
              <UserPageIdentityAddStatementsSocialMediaPostsInput />
            </div>
          </div>
        </div>
      </div>

      <div className="tw-mt-10 tw-grid tw-grid-cols-2 tw-gap-x-10">
        <div>
          <UserPageIdentityCICRatings />
        </div>
        <div>
          <UserPageIdentityActivityLog />
        </div>
      </div>
    </div>
  );
}
