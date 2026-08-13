import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import UserPageIdentityAddStatementsSelect from "./UserPageIdentityAddStatementsSelect";
import UserPageIdentityAddStatementsContact from "./contact/UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./social-media/UserPageIdentityAddStatementsSocialMediaAccount";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityAddStatementsSocialMediaPosts from "./social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPosts";
import { STATEMENT_ADD_VIEW } from "./UserPageIdentityAddStatements";
import UserPageIdentityAddStatementsNFTAccounts from "./nft-accounts/UserPageIdentityAddStatementsNFTAccounts";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function UserPageIdentityAddStatementsViews({
  profile,
  activeView,
  setActiveView,
  onBack,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly activeView: STATEMENT_ADD_VIEW;
  readonly setActiveView: (view: STATEMENT_ADD_VIEW) => void;
  readonly onBack: () => void;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();

  const detailContent = (() => {
    switch (activeView) {
      case STATEMENT_ADD_VIEW.SELECT:
        return (
          <UserPageIdentityAddStatementsSelect onViewChange={setActiveView} />
        );
      case STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT:
        return (
          <UserPageIdentityAddStatementsSocialMediaAccount
            profile={profile}
            onClose={onClose}
          />
        );
      case STATEMENT_ADD_VIEW.NFT_ACCOUNT:
        return (
          <UserPageIdentityAddStatementsNFTAccounts
            onClose={onClose}
            profile={profile}
          />
        );
      case STATEMENT_ADD_VIEW.CONTACT:
        return (
          <UserPageIdentityAddStatementsContact
            profile={profile}
            onClose={onClose}
          />
        );
      case STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST:
        return (
          <UserPageIdentityAddStatementsSocialMediaPosts
            profile={profile}
            onClose={onClose}
          />
        );
      default:
        return assertUnreachable(activeView);
    }
  })();

  if (activeView === STATEMENT_ADD_VIEW.SELECT) {
    return detailContent;
  }

  return (
    <div className="tw-px-4 sm:tw-px-6">
      <button
        type="button"
        onClick={onBack}
        className="tw-mb-5 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <ArrowLeftIcon className="tw-h-5 tw-w-5" aria-hidden="true" />
        {t(locale, "user.profile.identity.statements.backToTypes")}
      </button>
      {detailContent}
    </div>
  );
}
