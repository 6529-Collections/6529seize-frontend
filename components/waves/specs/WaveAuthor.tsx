import Link from "next/link";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";

export default function WaveAuthor({ wave }: { readonly wave: ApiWave }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <Link
        href={`/${wave.author.handle}`}
        className="tw-flex tw-items-center tw-gap-x-1.5 tw-text-iron-50 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-underline"
      >
        {wave.author.pfp ? (
          <img
            className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800"
            src={getScaledImageUri(wave.author.pfp, ImageScale.W_AUTO_H_50)}
            alt={`${wave.author.handle}`}
          />
        ) : (
          <div className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800" />
        )}
        <UserProfileTooltipWrapper
          user={wave.author.handle ?? wave.author.id}
          placement="left"
        >
          <span className="tw-text-sm tw-font-medium">
            {wave.author.handle}
          </span>
        </UserProfileTooltipWrapper>
      </Link>
    </div>
  );
}
