"use client";

import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import { getRandomColorWithSeed } from "@/helpers/Helpers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import GroupCardView from "./GroupCardView";

export enum CreditDirection {
  ADD = "ADD",
  SUBTRACT = "SUBTRACT",
}

export type GroupCardRateMatter = ApiRateMatter.Rep | ApiRateMatter.Cic;

export default function GroupCard({
  group,
  userPlaceholder,
  titlePlaceholder,
}: {
  readonly group?: ApiGroupFull | undefined;
  readonly userPlaceholder?: string | undefined;
  readonly titlePlaceholder?: string | undefined;
}) {
  const router = useRouter();

  const banner1 =
    group?.created_by.banner1_color ??
    getRandomColorWithSeed(group?.created_by.handle ?? "");
  const banner2 =
    group?.created_by.banner2_color ??
    getRandomColorWithSeed(group?.created_by.handle ?? "");

  const cardLabel =
    group?.name ?? titlePlaceholder ?? "View community group details";
  const cardHref = group ? `/network?page=1&group=${group.id}` : undefined;
  const gradientStyle = {
    background: `linear-gradient(135deg, ${banner1} 0%, ${banner2} 100%)`,
  };

  const onCardLinkKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    if (cardHref) {
      router.push(cardHref);
    }
  };

  return (
    <div className="tw-relative tw-col-span-1">
      <div
        className={`tw-group tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out ${
          cardHref
            ? "tw-cursor-pointer desktop-hover:hover:tw-translate-y-[-1px] desktop-hover:hover:tw-shadow-lg desktop-hover:hover:tw-shadow-black/40"
            : "tw-cursor-default"
        }`}
      >
        {cardHref && (
          <Link
            href={cardHref}
            onKeyDown={onCardLinkKeyDown}
            className="tw-absolute tw-inset-0 tw-z-20 tw-rounded-xl focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500"
            aria-label={`Open ${cardLabel}`}
          />
        )}
        <div className="tw-absolute tw-inset-0 tw-h-1 tw-rounded-t-xl">
          <div
            className="tw-absolute tw-inset-0 tw-opacity-80 tw-transition-opacity tw-duration-300 tw-ease-out desktop-hover:group-hover:tw-opacity-95"
            style={gradientStyle}
          ></div>
          <div className="from-black/25 via-black/10 to-transparent tw-absolute tw-inset-0 tw-bg-gradient-to-b"></div>
        </div>
        <div className="tw-flex tw-flex-1 tw-flex-col tw-rounded-b-xl tw-bg-iron-950">
          <GroupCardView
            group={group}
            userPlaceholder={userPlaceholder}
            titlePlaceholder={titlePlaceholder}
          />
        </div>
      </div>
    </div>
  );
}
