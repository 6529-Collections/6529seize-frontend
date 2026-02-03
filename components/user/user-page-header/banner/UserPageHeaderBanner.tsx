"use client";

import { useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  getBannerColorValue,
  getBannerImageUrl,
} from "@/helpers/profile-banner.helpers";
import UserPageHeaderEditBanner from "./UserPageHeaderEditBanner";

export default function UserPageHeaderBanner({
  profile,
  defaultBanner1,
  defaultBanner2,
  canEdit,
}: {
  readonly profile: ApiIdentity;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly canEdit: boolean;
}) {
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const bannerImageUrl = getBannerImageUrl(profile.banner1);
  const scaledBannerUrl = bannerImageUrl
    ? getScaledImageUri(bannerImageUrl, ImageScale.AUTOx1080)
    : null;
  const banner1Color = getBannerColorValue(profile.banner1) ?? defaultBanner1;
  const banner2Color = getBannerColorValue(profile.banner2) ?? defaultBanner2;

  return (
    <div className="tw-group tw-relative tw-z-10 tw-h-32 tw-w-full tw-overflow-hidden sm:tw-h-48">
      {scaledBannerUrl ? (
        <div
          className="tw-absolute tw-inset-0"
          style={{
            backgroundImage: `url(${scaledBannerUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div
          className="tw-absolute tw-inset-0"
          style={{
            background: `linear-gradient(45deg, ${banner1Color} 0%, ${banner2Color} 100%)`,
          }}
        />
      )}
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-ring-1 tw-ring-inset tw-ring-white/5" />

      {canEdit && (
        <button
          onClick={() => setIsEditOpen(true)}
          className="tw-absolute tw-inset-0 tw-z-10 tw-h-full tw-w-full tw-border-none tw-bg-transparent tw-p-0"
          aria-label="Edit banner"
        >
          <div className="edit-profile tw-absolute tw-inset-0 tw-bg-black/30">
            <div className="tw-absolute tw-bottom-4 tw-right-4">
              <PencilIcon />
            </div>
          </div>
        </button>
      )}
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageHeaderEditBanner
              profile={profile}
              defaultBanner1={defaultBanner1}
              defaultBanner2={defaultBanner2}
              onClose={() => setIsEditOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
