import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { createPossessionStr } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import UserPageIdentityStatementsAddButton from "../identity/statements/add/UserPageIdentityStatementsAddButton";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";

export default function MobileStatementsTabContent({
  profile,
  canEditStatements,
  statementCount,
}: {
  readonly profile: ApiIdentity;
  readonly canEditStatements: boolean;
  readonly statementCount: number | null;
}) {
  const locale = useBrowserLocale();
  const possessionName = createPossessionStr(profile.handle ?? null);
  const countKey = statementCount === 1 ? "one" : "other";
  const countLabel =
    statementCount === null
      ? "—"
      : t(
          locale,
          `user.profile.identity.mobileTabs.statementCount.${countKey}`,
          { count: formatInteger(locale, statementCount) }
        );

  return (
    <section className="tw-mt-4" aria-labelledby="mobile-id-statements-title">
      <h2 id="mobile-id-statements-title" className="tw-sr-only">
        {t(locale, "user.profile.identity.statements.heading", {
          name: possessionName,
        })}
      </h2>
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06]">
        <p className="tw-mb-0 tw-mt-4 tw-text-xs tw-text-iron-400">
          {countLabel}
        </p>
        <UserPageIdentityStatements
          profile={profile}
          headerAction={
            canEditStatements ? (
              <UserPageIdentityStatementsAddButton
                profile={profile}
                size="xs"
              />
            ) : undefined
          }
        />
      </div>
    </section>
  );
}
