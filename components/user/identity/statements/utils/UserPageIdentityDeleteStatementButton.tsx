"use client";

import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Tooltip } from "react-tooltip";
import UserPageIdentityDeleteStatementModal from "./UserPageIdentityDeleteStatementModal";

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
    <div className="tw-flex tw-flex-none tw-items-center">
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
            : "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 touch-only:tw-opacity-100"
        } tw-inline-flex tw-h-9 tw-w-9 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-rose-400 tw-transition tw-duration-200 tw-ease-out focus-visible:tw-opacity-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-rose-400 active:tw-scale-95 desktop-hover:hover:tw-bg-rose-500/10 desktop-hover:hover:tw-text-rose-300 motion-reduce:tw-transform-none motion-reduce:tw-transition-none`}
      >
        <TrashIcon
          className="tw-h-4 tw-w-4 tw-flex-shrink-0"
          aria-hidden="true"
        />
        <span className="tw-sr-only">
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
