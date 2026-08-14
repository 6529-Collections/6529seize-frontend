"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_GROUP } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { RateMatter } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useContext, useMemo, useState } from "react";
import IdentityGettingStartedCard from "../identity/getting-started/IdentityGettingStartedCard";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";
import UserPageRepModifyModal from "./modify-rep/UserPageRepModifyModal";
import GrantRepDialog from "./new-rep/GrantRepDialog";
import type { RepDirection } from "./UserPageRep.helpers";
import { getCanEditRep, getCanEditNic } from "./UserPageRep.helpers";
import MobileTabCards, { type MobileTab } from "./MobileTabCards";
import MobileRepTabContent from "./MobileRepTabContent";
import MobileNicTabContent from "./MobileNicTabContent";
import MobileStatementsTabContent from "./MobileStatementsTabContent";

const IDENTITY_STATEMENT_GROUPS = new Set<STATEMENT_GROUP>([
  STATEMENT_GROUP.CONTACT,
  STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT,
  STATEMENT_GROUP.NFT_ACCOUNTS,
  STATEMENT_GROUP.SOCIAL_MEDIA_VERIFICATION_POST,
]);

export default function UserPageRepMobile({
  profile,
  overview,
  categories,
  cicOverview,
  repDirection,
  onRepDirectionChange,
  initialActivityLogParams,
  loading,
  visibleCount,
  onShowMore,
  hasNextPage,
  isFetchingNextPage,
  onOpenOverviewContributors,
  onOpenGlobalCategory,
  onOpenCategoryContributors,
}: {
  readonly profile: ApiIdentity;
  readonly overview: ApiRepOverview | null;
  readonly categories: ApiRepCategory[];
  readonly cicOverview: ApiCicOverview | null;
  readonly repDirection: RepDirection;
  readonly onRepDirectionChange: (direction: RepDirection) => void;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly loading: boolean;
  readonly visibleCount: number;
  readonly onShowMore: () => void;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onOpenOverviewContributors: () => void;
  readonly onOpenGlobalCategory: (category: string) => void;
  readonly onOpenCategoryContributors: (category: ApiRepCategory) => void;
}) {
  const params = useParams();
  const user = params["user"]?.toString().toLowerCase() ?? null;
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { address } = useSeizeConnectContext();

  const [activeTab, setActiveTab] = useState<MobileTab>("rep");
  const [isGrantRepOpen, setIsGrantRepOpen] = useState(false);
  const [isNicRateOpen, setIsNicRateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<string | null>(null);

  const canEditRep = useMemo(
    () =>
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
      }),
    [connectedProfile, profile, activeProfileProxy]
  );

  const canEditNic = useMemo(
    () =>
      getCanEditNic({
        connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
        address,
      }),
    [connectedProfile, profile, activeProfileProxy, address]
  );

  const canEditStatements =
    !activeProfileProxy &&
    !!profile.handle &&
    (profile.wallets ?? []).some(
      (w) => w.wallet.toLowerCase() === address?.toLowerCase()
    );

  const { data: statements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, user],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      return await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${user}/cic/statements`,
      });
    },
    enabled: !!user,
  });

  const identityStatementCount = useMemo(() => {
    if (!statements) {
      return null;
    }
    const visibleStatementCount = statements.filter((statement) =>
      IDENTITY_STATEMENT_GROUPS.has(statement.statement_group)
    ).length;
    return (profile.wallets?.length ?? 0) + visibleStatementCount;
  }, [profile.wallets, statements]);

  return (
    <div>
      <IdentityGettingStartedCard profile={profile} className="tw-mb-4" />

      <MobileTabCards
        activeTab={activeTab}
        onTabChange={setActiveTab}
        overview={overview}
        cicOverview={cicOverview}
        profile={profile}
        identityStatementCount={identityStatementCount}
      />

      <AnimatePresence mode="wait">
        {activeTab === "rep" && (
          <motion.div
            key="rep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <MobileRepTabContent
              profile={profile}
              overview={overview}
              categories={categories}
              repDirection={repDirection}
              onRepDirectionChange={onRepDirectionChange}
              initialActivityLogParams={initialActivityLogParams}
              loading={loading}
              canEditRep={canEditRep}
              visibleCount={visibleCount}
              onShowMore={onShowMore}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onGrantRep={() => setIsGrantRepOpen(true)}
              onOpenOverviewContributors={onOpenOverviewContributors}
              onEditCategory={setEditCategory}
              onOpenGlobalCategory={onOpenGlobalCategory}
              onOpenCategoryContributors={onOpenCategoryContributors}
            />
          </motion.div>
        )}

        {activeTab === "nic" && (
          <motion.div
            key="nic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <MobileNicTabContent
              profile={profile}
              cicOverview={cicOverview}
              initialActivityLogParams={initialActivityLogParams}
              canEditNic={canEditNic}
              onRateNic={() => setIsNicRateOpen(true)}
            />
          </motion.div>
        )}

        {activeTab === "statements" && (
          <motion.div
            key="statements"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <MobileStatementsTabContent
              profile={profile}
              canEditStatements={canEditStatements}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <GrantRepDialog
        profile={profile}
        overview={overview}
        isOpen={isGrantRepOpen}
        onClose={() => setIsGrantRepOpen(false)}
      />

      <MobileWrapperDialog
        title="Rate NIC"
        isOpen={isNicRateOpen}
        onClose={() => setIsNicRateOpen(false)}
        noPadding
        tabletModal
        maxWidthClass="md:tw-max-w-md"
        headerClassName="tw-pb-6 tw-pt-4"
      >
        <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
          <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
            <UserPageIdentityHeaderCICRate
              profile={profile}
              isTooltip={false}
              onSuccess={() => setIsNicRateOpen(false)}
              onCancel={() => setIsNicRateOpen(false)}
            />
          </UserPageRateWrapper>
        </div>
      </MobileWrapperDialog>

      {canEditRep && editCategory && (
        <UserPageRepModifyModal
          profile={profile}
          category={editCategory}
          onClose={() => setEditCategory(null)}
        />
      )}
    </div>
  );
}
