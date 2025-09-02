"use client";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import { CicStatement } from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import UserPageIdentityDeleteStatementModal from "./UserPageIdentityDeleteStatementModal";
export default function UserPageIdentityDeleteStatementButton({
  statement,
  profile,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
}) {
  const [isDeleteStatementOpen, setIsDeleteStatementOpen] =
    useState<boolean>(false);
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  const tooltipId = `delete-statement-${statement.statement_group}-${statement.statement_type}`;
  const showTooltip = !isTouchScreen && !isDeleteStatementOpen;

  return (
    <div>
      <button
        onClick={() => setIsDeleteStatementOpen(true)}
        type="button"
        aria-label="Delete statement"
        data-tooltip-id={showTooltip ? tooltipId : undefined}
        className={`${
          isTouchScreen
            ? "tw-opacity-100"
            : "tw-opacity-0 group-hover:tw-opacity-100"
        } tw-p-1.5 tw-bg-transparent tw-cursor-pointer tw-text-xs tw-font-semibold tw-text-rose-500 desktop-hover:hover:tw-text-rose-400 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}>
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-scale-110"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      {showTooltip && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "4px 8px",
          }}>
          <span className="tw-text-xs">Delete</span>
        </Tooltip>
      )}
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
  );
}
