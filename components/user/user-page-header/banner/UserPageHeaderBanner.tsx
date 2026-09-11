"use client";

import { useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  getBannerColorValue,
  getBannerImageUrl,
} from "@/helpers/profile-banner.helpers";
import UserPageHeaderEditBanner from "./UserPageHeaderEditBanner";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderBanner({
  profile,
  defaultBanner1,
  defaultBanner2,
  canEdit,
  profileLabel,
}: {
  readonly profile: ApiIdentity;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly canEdit: boolean;
  readonly profileLabel: string;
}) {
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const bannerImageUrl = getBannerImageUrl(profile.banner1);
  const scaledBannerUrl = bannerImageUrl
    ? getScaledImageUri(bannerImageUrl, ImageScale.AUTOx800)
    : null;
  const banner1Color = getBannerColorValue(profile.banner1) ?? defaultBanner1;
  const banner2Color = getBannerColorValue(profile.banner2) ?? defaultBanner2;

  return (
    <div className="tw-group tw-relative tw-z-10 tw-h-28 tw-w-full tw-overflow-hidden sm:tw-h-40 md:tw-h-52">
      {scaledBannerUrl ? (
        <div
          className="tw-absolute tw-inset-0 md:tw-opacity-80"
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
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-ring-1 tw-ring-inset tw-ring-white/5 md:tw-hidden" />
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-black/80 tw-via-black/30 tw-to-transparent md:tw-hidden" />
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-hidden tw-h-44 tw-bg-gradient-to-t tw-from-black tw-via-black/50 tw-to-transparent md:tw-block" />
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-hidden tw-h-20 tw-bg-gradient-to-b tw-from-black/20 tw-to-transparent md:tw-block" />

      {canEdit && (
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="tw-absolute tw-inset-0 tw-z-10 tw-hidden tw-h-full tw-w-full tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 sm:tw-block"
          aria-label={getUserProfileHeaderMessage(
            "user.profileHeader.banner.edit",
            { name: profileLabel }
          )}
        >
          <div className="tw-absolute tw-inset-0 tw-bg-black/30 tw-opacity-0 tw-transition-opacity tw-duration-300 tw-ease-out group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 touch-only:tw-bg-transparent touch-only:tw-opacity-100 motion-reduce:tw-transition-none">
            <div
              aria-hidden="true"
              className="tw-absolute tw-right-4 tw-top-4 touch-only:tw-flex touch-only:tw-size-9 touch-only:tw-items-center touch-only:tw-justify-center touch-only:tw-rounded-full touch-only:tw-border touch-only:tw-border-solid touch-only:tw-border-iron-800/60 touch-only:tw-bg-iron-950 touch-only:tw-shadow-md"
            >
              <PencilIcon />
            </div>
          </div>
        </button>
      )}
      {isEditOpen && (
        <UserPageHeaderEditBanner
          profile={profile}
          defaultBanner1={defaultBanner1}
          defaultBanner2={defaultBanner2}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}
