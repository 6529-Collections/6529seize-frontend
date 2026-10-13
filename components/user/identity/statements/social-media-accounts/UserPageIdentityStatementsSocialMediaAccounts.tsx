import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityStatementsStatementsList from "../utils/UserPageIdentityStatementsStatementsList";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function UserPageIdentityStatementsSocialMediaAccounts({
  statements,
  profile,
  loading,
}: {
  readonly statements: CicStatement[];
  readonly profile: ApiIdentity;
  readonly loading: boolean;
}) {
  const locale = useBrowserLocale();

  return (
    <div>
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        {t(locale, "user.profile.identity.statements.socialMediaAccounts")}
      </span>
      <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-300">
        {t(locale, "user.profile.identity.statements.socialAccountsDisclaimer")}
      </p>
      <UserPageIdentityStatementsStatementsList
        statements={statements}
        profile={profile}
        noItemsMessage={t(
          locale,
          "user.profile.identity.statements.noSocialMediaAccounts"
        )}
        loading={loading}
      />
    </div>
  );
}
