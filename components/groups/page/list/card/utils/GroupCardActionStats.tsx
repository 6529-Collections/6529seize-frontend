"use client";

import { useContext, useEffect, useState } from "react";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "@/components/auth/Auth";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiAvailableRatingCredit } from "@/generated/models/ApiAvailableRatingCredit";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { GroupCardRateMatter } from "../GroupCard";

export default function GroupCardActionStats({
  matter,
  membersCount,
  loadingMembersCount,
}: {
  readonly matter: GroupCardRateMatter;
  readonly membersCount: number | null;
  readonly loadingMembersCount: boolean;
}) {
  const locale = useBrowserLocale();
  const MATTER_LABEL: Record<GroupCardRateMatter, string> = {
    [ApiRateMatter.Rep]: "REP",
    [ApiRateMatter.Cic]: "NIC",
  };

  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [rater, setRater] = useState<string | null>(null);
  const [raterRepresentative, setRaterRepresentative] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!connectedProfile?.handle) {
      setRater(null);
      setRaterRepresentative(null);
      return;
    }
    if (activeProfileProxy) {
      setRater(activeProfileProxy.created_by.handle);
      setRaterRepresentative(connectedProfile.handle);
      return;
    }
    setRater(connectedProfile.handle);
    setRaterRepresentative(null);
  }, [connectedProfile, activeProfileProxy]);

  const { data: creditLeft, isError } =
    useQuery<ApiAvailableRatingCredit | null>({
      queryKey: [
        QueryKey.IDENTITY_AVAILABLE_CREDIT,
        {
          rater,
          rater_representative: raterRepresentative,
        },
      ],
      queryFn: async () => {
        if (!rater) {
          return null;
        }
        const params: {
          rater: string;
          rater_representative?: string | undefined;
        } = {
          rater,
        };

        if (raterRepresentative) {
          params.rater_representative = raterRepresentative;
        }

        return await commonApiFetch<
          ApiAvailableRatingCredit,
          { rater: string; rater_representative?: string | undefined }
        >({
          endpoint: `ratings/credit`,
          params,
        });
      },
      placeholderData: keepPreviousData,
      enabled: !!rater,
    });

  const getCreditLeft = () => {
    switch (matter) {
      case ApiRateMatter.Rep:
        return creditLeft?.rep_credit ?? null;
      case ApiRateMatter.Cic:
        return creditLeft?.cic_credit ?? null;
      default:
        assertUnreachable(matter);
        return null;
    }
  };

  const credit = getCreditLeft();
  const creditPerMember =
    typeof credit === "number" &&
    typeof membersCount === "number" &&
    credit > 0 &&
    membersCount > 0
      ? credit / membersCount
      : 0;
  const creditPrefix = creditPerMember > 0 ? "±" : "";
  const creditLabel =
    credit === null || membersCount === null
      ? "—"
      : `${creditPrefix}${formatInteger(locale, +creditPerMember.toFixed(0))}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="tw-mt-5 tw-rounded-lg tw-bg-iron-900/60 tw-p-3"
    >
      <p className="tw-m-0 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400">
        {isError
          ? t(locale, "network.groupInspection.errorDescription")
          : tRich(locale, "network.groupInspection.creditSummary", {
              credit: (
                <span
                  key="credit"
                  className="tw-font-medium tw-tabular-nums tw-text-iron-100"
                >
                  {creditLabel}
                </span>
              ),
              matter: MATTER_LABEL[matter],
              count: (
                <span
                  key="count"
                  className="tw-font-medium tw-tabular-nums tw-text-iron-100"
                >
                  {loadingMembersCount ? (
                    <CircleLoader size={CircleLoaderSize.SMALL} />
                  ) : (
                    formatInteger(locale, membersCount)
                  )}
                </span>
              ),
            })}
      </p>
    </div>
  );
}
