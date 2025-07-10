"use client";

import { useEffect, useState } from "react";
import { CicStatement } from "../../../../../entities/IProfile";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import UserPageIdentityDeleteStatementModal from "./UserPageIdentityDeleteStatementModal";
import Tippy from "@tippyjs/react";
import { useRouter } from "next/router";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
export default function UserPageIdentityDeleteStatementButton({
  statement,
  profile,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
}) {
  const router = useRouter();
  const [isDeleteStatementOpen, setIsDeleteStatementOpen] =
    useState<boolean>(false);
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);
  return (
    <Tippy
      content="Delete"
      theme="dark"
      placement="top"
      disabled={isTouchScreen ?? isDeleteStatementOpen}>
      <div>
        <button
          onClick={() => setIsDeleteStatementOpen(true)}
          type="button"
          aria-label="Delete statement"
          className={`${
            isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
          } tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-white tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}>
          <svg
            className="tw-flex-shrink-0 tw-w-6 tw-h-6 tw-text-red tw-transition tw-duration-300 tw-ease-out hover:tw-scale-110"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <span className="tw-sr-only">Delete statement</span>
          </svg>
        </button>
        <CommonAnimationWrapper mode="sync" initial={true}>
          {isDeleteStatementOpen && (
            <CommonAnimationOpacity
              key="modal"
              elementClasses="tw-absolute tw-z-10"
              elementRole="dialog"
              onClicked={(e) => e.stopPropagation()}>
              <UserPageIdentityDeleteStatementModal
                statement={statement}
                profile={profile}
                onClose={() => setIsDeleteStatementOpen(false)}
              />
            </CommonAnimationOpacity>
          )}
        </CommonAnimationWrapper>
      </div>
    </Tippy>
  );
}
