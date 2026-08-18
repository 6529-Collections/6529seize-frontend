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
    <section className="tw-mt-4" aria-labelledby="mobile-id-statements-title">
      <h2 id="mobile-id-statements-title" className="tw-sr-only">
        {t(locale, "user.profile.identity.statements.heading", {
          name: possessionName,
        })}
      </h2>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0f1014]">
        <UserPageIdentityStatements
          profile={profile}
          headerAction={
            canEditStatements ? (
              <UserPageIdentityStatementsAddButton
                profile={profile}
                size="sm"
              />
            ) : undefined
          }
        />
      </div>
    </section>
  );
}
