"use client";

import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import OutsideLinkIcon from "@/components/utils/icons/OutsideLinkIcon";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_META } from "@/helpers/Types";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import UserPageIdentityDeleteStatementButton from "./UserPageIdentityDeleteStatementButton";

export default function UserPageIdentityStatementsStatement({
  statement,
  profile,
  canEdit,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
}) {
  const [title, setTitle] = useState(statement.statement_value);
  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopy = () => {
    copyToClipboard(title);
    setTitle("Copied!");
    setTimeout(() => {
      setTitle(statement.statement_value);
    }, 1000);
  };

  const canOpen = STATEMENT_META[statement.statement_type].canOpenStatement;
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return (
    <li className="tw-group hover:tw-bg-white/[0.02] tw-rounded-lg tw-px-2 tw-py-4 tw-transition-colors tw-duration-200 tw-ease-out tw-border-b tw-border-solid tw-border-white/[0.06] tw-border-t-0 tw-border-x-0 last:tw-border-b-0">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-flex tw-items-center tw-gap-3.5 tw-min-w-0">
          <div className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-flex tw-items-center tw-justify-center">
            <SocialStatementIcon statementType={statement.statement_type} />
          </div>
          <div className="tw-min-w-0">
            <div className="tw-text-[10px] tw-font-semibold tw-text-iron-500 tw-uppercase tw-tracking-wider">
              {STATEMENT_META[statement.statement_type].title}
            </div>
            <div className="tw-text-sm tw-font-medium tw-text-white tw-break-all tw-mt-1">
              {title === "Copied!" ? (
                <span className="tw-text-primary-400">{title}</span>
              ) : (
                statement.statement_value
              )}
            </div>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-1 tw-flex-shrink-0">
          {canOpen && (
            <>
              <a
                href={statement.statement_value}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-p-1 tw-bg-transparent tw-cursor-pointer tw-text-iron-500 hover:tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                data-tooltip-id={`open-statement-${statement.statement_type}`}>
                <OutsideLinkIcon />
              </a>
              {!isTouchScreen && (
                <Tooltip
                  id={`open-statement-${statement.statement_type}`}
                  place="top"
                  positionStrategy="fixed"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}>
                  <span className="tw-text-xs">Open</span>
                </Tooltip>
              )}
            </>
          )}
          <button
            aria-label="Copy"
            className="tw-p-1 tw-bg-transparent tw-cursor-pointer tw-text-iron-500 hover:tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
            onClick={handleCopy}
            data-tooltip-id={`copy-statement-${statement.statement_type}`}>
            <div className="tw-h-4 tw-w-4 [&>svg]:tw-w-full [&>svg]:tw-h-full">
              <CopyIcon />
            </div>
          </button>
          {!isTouchScreen && (
            <Tooltip
              id={`copy-statement-${statement.statement_type}`}
              place="top"
              positionStrategy="fixed"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}>
              <span className="tw-text-xs">Copy</span>
            </Tooltip>
          )}
          {canEdit && (
            <UserPageIdentityDeleteStatementButton
              statement={statement}
              profile={profile}
            />
          )}
        </div>
      </div>
    </li>
  );
}
