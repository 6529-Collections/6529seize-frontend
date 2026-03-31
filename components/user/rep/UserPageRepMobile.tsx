"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { buildRepAvatarItems } from "./buildRepAvatarItems";
import { RateMatter } from "@/types/enums";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useMemo, useState } from "react";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";
import UserPageRepModifyModal from "./modify-rep/UserPageRepModifyModal";
import GrantRepDialog from "./new-rep/GrantRepDialog";
import type { RepDirection } from "./UserPageRep.helpers";
import { getCanEditRep, getCanEditNic } from "./UserPageRep.helpers";
import MobileTabCards from "./MobileTabCards";
import MobileRepTabContent from "./MobileRepTabContent";
import MobileIdentityTabContent from "./MobileIdentityTabContent";

type MobileTab = "rep" | "identity";

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
}) {
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

  const cicAvatarItems = useMemo(
    () =>
      buildRepAvatarItems(cicOverview?.contributors.data ?? [], 3, {
        omitHref: true,
      }),
    [cicOverview?.contributors.data]
  );

  return (
    <div>
      <MobileTabCards
        activeTab={activeTab}
        onTabChange={setActiveTab}
        overview={overview}
        cicOverview={cicOverview}
        profile={profile}
        repDirection={repDirection}
        cicAvatarItems={cicAvatarItems}
      />

      <AnimatePresence mode="wait">
        {activeTab === "rep" ? (
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
              onEditCategory={setEditCategory}
            />
          </motion.div>
        ) : (
          <motion.div
            key="identity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <MobileIdentityTabContent
              profile={profile}
              cicOverview={cicOverview}
              initialActivityLogParams={initialActivityLogParams}
              canEditNic={canEditNic}
              canEditStatements={canEditStatements}
              onRateNic={() => setIsNicRateOpen(true)}
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
        tabletModal
        maxWidthClass="md:tw-max-w-md"
      >
        <div className="tw-px-4 sm:tw-px-6">
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
