"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { fetchCollectRules } from "@/services/api/collect-rules-api";
import { useQuery } from "@tanstack/react-query";
import CollectRuleCard from "./CollectRuleCard";

export default function CollectRulesPanel({
  onOperation,
}: {
  readonly onOperation: (operation: ApiMarketOperation) => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, isAuthenticated } = useAuth();
  const rules = useQuery({
    queryKey: [QueryKey.COLLECT_RULES, connectedProfile?.id],
    queryFn: ({ signal }) => fetchCollectRules(signal),
    enabled: isAuthenticated === true && Boolean(connectedProfile?.id),
    refetchInterval: 15000,
  });
  const profileRules = rules.data?.rules.filter(
    (rule) => rule.definition.profile_id === connectedProfile?.id
  );
  if (!isAuthenticated) return null;
  return (
    <section className="tw-mx-auto tw-max-w-7xl tw-space-y-5 tw-px-4 tw-pb-12 sm:tw-px-6 lg:tw-px-8">
      <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-100">
        {t(locale, "collect.rules.manage")}
      </h2>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "collect.rules.mode")}
      </p>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "collect.rules.planningLimits")}
      </p>
      {rules.isPending && (
        <p role="status" className="tw-text-sm tw-text-iron-300">
          {t(locale, "collect.loading")}
        </p>
      )}
      {rules.isError && (
        <div role="alert">
          <p className="tw-text-sm tw-text-iron-300">
            {t(locale, "collect.rules.error")}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              void rules.refetch();
            }}
          >
            {t(locale, "collect.retry")}
          </Button>
        </div>
      )}
      {profileRules?.map((rule) => (
        <CollectRuleCard
          key={rule.id}
          rule={rule}
          onUpdated={() => {
            void rules.refetch();
          }}
          onOperation={onOperation}
        />
      ))}
      {profileRules?.length === 0 && (
        <p className="tw-text-sm tw-text-iron-300">
          {t(locale, "collect.rules.empty")}
        </p>
      )}
      {rules.data?.complete === false && (
        <p className="tw-text-xs tw-text-iron-400">
          {t(locale, "collect.rules.limited")}
        </p>
      )}
    </section>
  );
}
