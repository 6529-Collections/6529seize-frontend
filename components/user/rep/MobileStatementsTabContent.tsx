import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { createPossessionStr } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageIdentityStatementsAddButton from "../identity/statements/add/UserPageIdentityStatementsAddButton";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";

export default function MobileStatementsTabContent({
  profile,
  canEditStatements,
}: {
  readonly profile: ApiIdentity;
  readonly canEditStatements: boolean;
}) {
  const locale = useBrowserLocale();
  const possessionName = createPossessionStr(profile.handle ?? null);

  return (
    <section className="tw-mt-5" aria-labelledby="mobile-id-statements-title">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-min-w-0">
          <h2
            id="mobile-id-statements-title"
            className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "user.profile.identity.statements.heading", {
              name: possessionName,
            })}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(locale, "user.profile.identity.statements.description")}
          </p>
        </div>
        {canEditStatements && (
          <UserPageIdentityStatementsAddButton profile={profile} size="sm" />
        )}
      </div>

      <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0f1014]">
        <UserPageIdentityStatements profile={profile} />
      </div>
    </section>
  );
}
