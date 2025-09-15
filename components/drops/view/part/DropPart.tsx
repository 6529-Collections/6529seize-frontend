"use client";

import { ReactNode, memo, useRef } from "react";
import { ApiDropMentionedUser } from "../../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../../generated/models/ApiDropReferencedNFT";
import DropPfp from "../../create/utils/DropPfp";
import DropAuthor from "../../create/utils/author/DropAuthor";
import Link from "next/link";
import { ProfileMinWithoutSubs } from "../../../../helpers/ProfileTypes";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { useRouter } from "next/navigation";
import DropPartContent from "./DropPartContent";

export enum DropPartSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

interface DropPartPropsMedia {
  readonly mimeType: string;
  readonly mediaSrc: string;
}

interface DropPartPropsWave {
  readonly id: string | null;
  readonly name: string;
  readonly image: string | null;
}

interface DropPartProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly dropTitle: string | null;
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly partContent: string | null;
  readonly partMedias: DropPartPropsMedia[];
  readonly createdAt: number;
  readonly wave: DropPartPropsWave | null;
  readonly size?: DropPartSize;
  readonly totalPartsCount?: number;
  readonly currentPartCount?: number;
  readonly smallMenuIsShown: boolean;
  readonly components?: {
    readonly authorFollow?: ReactNode;
  };
  readonly onNextPart?: () => void;
  readonly onPrevPart?: () => void;
  readonly onContentClick?: () => void;
}

const DropPart = memo(
  ({
    profile,
    mentionedUsers,
    referencedNfts,
    partContent,
    partMedias,
    dropTitle,
    createdAt,
    wave,
    size = DropPartSize.MEDIUM,
    totalPartsCount,
    currentPartCount,
    components,
    smallMenuIsShown,
    onNextPart,
    onPrevPart,
    onContentClick,
  }: DropPartProps) => {
    const router = useRouter();
    const isStorm = totalPartsCount && totalPartsCount > 1;
    const showPrevButton = currentPartCount && currentPartCount > 1;
    const showNextButton =
      currentPartCount && totalPartsCount && currentPartCount < totalPartsCount;
    const containerRef = useRef<HTMLDivElement>(null);

    const onQuoteClick = (drop: ApiDrop) => {
      router.push(
        `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}`,
        { scroll: false }
      );
    };

    return (
      <div
        ref={containerRef}
        className="tw-relative tw-overflow-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out">
        <div className="tw-pt-2 tw-flex tw-gap-x-3 tw-h-full tw-relative">
          <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
            <div className={`${smallMenuIsShown && ""} tw-flex tw-gap-x-3`}>
              <DropPfp pfpUrl={profile.pfp} size={size} />
              <div
                className={`tw-w-full tw-flex tw-flex-col ${
                  wave?.id ? "tw-justify-between" : "tw-justify-center"
                } ${
                  size === DropPartSize.SMALL && !wave?.id
                    ? "tw-h-8"
                    : "tw-h-10"
                }`}>
                <DropAuthor profile={profile} timestamp={createdAt} size={size}>
                  {components?.authorFollow}
                </DropAuthor>
                <div className="tw-mt-1 tw-inline-flex tw-items-center tw-justify-between">
                  {wave?.id && (
                    <Link
                      onClick={(e) => e.stopPropagation()}
                      href={`/my-stream?wave=${wave.id}`}
                      className="tw-mb-0 tw-pb-0 tw-no-underline tw-text-xs tw-text-iron-400 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out">
                      <span>{wave.name}</span>
                    </Link>
                  )}
                  {isStorm && (
                    <div className="tw-inline-flex tw-relative">
                      <svg
                        className="tw-h-4 tw-w-4 tw-mr-2 tw-text-[#FEDF89]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="tw-text-xs tw-text-iron-50">
                        {currentPartCount} /{" "}
                        <span className="tw-text-iron-400">
                          {totalPartsCount}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              onClick={(e) => {
                if (onContentClick) {
                  const selection = window.getSelection();
                  if (selection?.toString().length) {
                    return;
                  }

                  e.stopPropagation();
                  onContentClick();
                }
              }}
              className={`${onContentClick && "tw-cursor-pointer"} tw-h-full ${
                size === DropPartSize.SMALL ? "tw-ml-[40px]" : "tw-ml-[54px]"
              }`}>
              {dropTitle && (
                <p className="tw-font-semibold tw-text-iron-100 tw-text-md tw-mb-0">
                  {dropTitle}
                </p>
              )}
              <div className="tw-w-full tw-inline-flex tw-justify-between tw-space-x-2">
                {onPrevPart && isStorm && (
                  <button
                    disabled={!showPrevButton}
                    className={`${
                      showPrevButton
                        ? "tw-text-iron-300 hover:tw-text-primary-400"
                        : "tw-text-iron-700 tw-cursor-default"
                    } tw-bg-transparent tw-rounded-lg tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevPart();
                    }}>
                    <svg
                      className="tw-size-5 tw-flex-shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5 8.25 12l7.5-7.5"
                      />
                    </svg>
                  </button>
                )}
                <DropPartContent
                  mentionedUsers={mentionedUsers}
                  referencedNfts={referencedNfts}
                  partContent={partContent}
                  onQuoteClick={onQuoteClick}
                  partMedias={partMedias}
                  currentPartCount={currentPartCount ?? 0}
                />
                {onNextPart && isStorm && (
                  <button
                    className={`${
                      showNextButton
                        ? "tw-text-iron-300 hover:tw-text-primary-400"
                        : "tw-text-iron-700 tw-cursor-default"
                    } tw-bg-transparent tw-rounded-lg tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
                    disabled={!showNextButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNextPart();
                    }}>
                    <svg
                      className="tw-size-5 tw-flex-shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DropPart.displayName = "DropPart";
export default DropPart;
