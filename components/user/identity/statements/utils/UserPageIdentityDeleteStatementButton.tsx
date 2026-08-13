"use client";

import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useState } from "react";
import { Tooltip } from "react-tooltip";
import UserPageIdentityDeleteStatementModal from "./UserPageIdentityDeleteStatementModal";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
export default function UserPageIdentityDeleteStatementButton({
  statement,
  profile,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
}) {
  const locale = useBrowserLocale();
  const [isDeleteStatementOpen, setIsDeleteStatementOpen] =
    useState<boolean>(false);
  const isTouchScreen = useIsTouchDevice();
  const tooltipId = `delete-statement-${statement.statement_group}-${statement.statement_type}`;
  const showTooltip = !isTouchScreen && !isDeleteStatementOpen;

  return (
    <div className="tw-flex tw-flex-1 lg:tw-flex-none">
      <button
        onClick={() => setIsDeleteStatementOpen(true)}
        type="button"
        aria-label={t(
          locale,
          "user.profile.identity.statements.deleteStatement"
        )}
        {...(showTooltip ? { "data-tooltip-id": tooltipId } : null)}
        className={`${
          isTouchScreen
            ? "tw-opacity-100"
            : "tw-opacity-0 group-hover:tw-opacity-100"
        } tw-inline-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-rose-500/20 tw-bg-rose-500/5 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-rose-400 tw-transition-colors desktop-hover:hover:tw-bg-rose-500/10 desktop-hover:hover:tw-text-rose-300 focus-visible:tw-opacity-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-rose-400 lg:tw-min-h-0 lg:tw-w-auto lg:tw-rounded-none lg:tw-border-0 lg:tw-bg-transparent lg:tw-p-0 lg:tw-text-rose-500`}
      >
        <svg
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-scale-110"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="lg:tw-sr-only">
          {t(locale, "user.profile.identity.statements.deleteStatement")}
        </span>
      </button>
      {showTooltip && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
        >
          <span className="tw-text-xs">
            {t(locale, "user.profile.identity.statements.deleteStatement")}
          </span>
        </Tooltip>
      )}
      <UserPageIdentityDeleteStatementModal
        statement={statement}
        profile={profile}
        isOpen={isDeleteStatementOpen}
        onClose={() => setIsDeleteStatementOpen(false)}
      />
    </div>
  );
}
