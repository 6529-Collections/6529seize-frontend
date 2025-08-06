"use client";

import { useEffect, useState } from "react";
import { CicStatement } from "../../../../../entities/IProfile";
import CopyIcon from "../../../../utils/icons/CopyIcon";
import SocialStatementIcon from "../../../utils/icons/SocialStatementIcon";
import UserPageIdentityDeleteStatementButton from "./UserPageIdentityDeleteStatementButton";
import { useCopyToClipboard } from "react-use";
import { Tooltip } from "react-tooltip";
import OutsideLinkIcon from "../../../../utils/icons/OutsideLinkIcon";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
import { useRouter } from "next/router";
import { STATEMENT_META } from "../../../../../helpers/Types";

export default function UserPageIdentityStatementsStatement({
  statement,
  profile,
  canEdit,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
}) {
  const router = useRouter();
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
  }, [router.isReady]);

  return (
    <li className="tw-mb-3">
      {/* Card/Badge Design */}
      <div className="tw-bg-iron-800 hover:tw-bg-iron-800 tw-border tw-border-iron-700 desktop-hover:hover:tw-border-iron-600 tw-rounded-lg tw-p-3 tw-transition-all tw-duration-200">
        {/* Header with Platform Icon + Name */}
        <div className="tw-flex tw-items-center tw-space-x-2 tw-mb-2">
          <div className="tw-w-5 tw-h-5 tw-flex-shrink-0">
            <SocialStatementIcon statementType={statement.statement_type} />
          </div>
          <span className="tw-text-xs tw-font-medium tw-text-iron-400 tw-uppercase tracking-wide">
            {STATEMENT_META[statement.statement_type].title}
          </span>
        </div>

        {/* Social Link with Actions */}
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-4">
          <div className="tw-text-sm tw-text-iron-200 tw-break-all tw-leading-relaxed tw-flex-1">
            {statement.statement_value}
          </div>
          
          {/* Action Icons */}
          <div className="tw-flex tw-items-center tw-gap-x-2 tw-flex-shrink-0 tw-self-start">
            {canOpen && (
              <a
                href={statement.statement_value}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-rounded-full tw-text-iron-400 hover:tw-text-iron-200 desktop-hover:hover:tw-bg-iron-700 tw-transition-all tw-duration-200"
                aria-label="Open link"
                data-tooltip-id={`open-${statement.statement_type}-${statement.id}`}
              >
                <OutsideLinkIcon />
              </a>
            )}

            <button
              onClick={handleCopy}
              className="tw-rounded-full tw-bg-transparent tw-border-0 tw-text-iron-400 hover:tw-text-iron-200 desktop-hover:hover:tw-bg-iron-700 tw-transition-all tw-duration-200"
              aria-label="Copy link"
              data-tooltip-id={`copy-${statement.statement_type}-${statement.id}`}
            >
              <CopyIcon />
            </button>

            {canEdit && (
              <div>
                <UserPageIdentityDeleteStatementButton
                  statement={statement}
                  profile={profile}
                />
              </div>
            )}
          </div>
        </div>

        {/* Simple Tooltips for Actions */}
        {!isTouchScreen && (
          <>
            {canOpen && (
              <Tooltip
                id={`open-${statement.statement_type}-${statement.id}`}
                place="top"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                  fontSize: "12px",
                }}
              >
                Open
              </Tooltip>
            )}
            <Tooltip
              id={`copy-${statement.statement_type}-${statement.id}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                fontSize: "12px",
              }}
            >
              {title === "Copied!" ? "Copied!" : "Copy"}
            </Tooltip>
          </>
        )}
      </div>
    </li>
  );
}
