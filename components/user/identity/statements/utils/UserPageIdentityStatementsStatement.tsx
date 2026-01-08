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
    <li className="tw-group hover:tw-bg-white/[0.02] tw-rounded-lg tw-px-2 tw-py-2 md:tw-py-1 tw-transition-colors tw-duration-200 tw-ease-out tw-border-b tw-border-white/[0.04] md:tw-border-b-0 last:tw-border-b-0">
      <div className="tw-flex tw-flex-col">
        <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
          <div className="tw-flex tw-items-center tw-gap-x-3">
            <div className="tw-flex-shrink-0 tw-w-[18px] tw-h-[18px] md:tw-w-[20px] md:tw-h-[20px] group-hover:tw-scale-105 tw-transition-transform tw-duration-150 tw-ease-out">
              <SocialStatementIcon statementType={statement.statement_type} />
            </div>
            <span className="tw-text-sm md:tw-text-base tw-font-medium tw-text-iron-200 group-hover:tw-text-iron-100 tw-transition-colors tw-duration-150 tw-ease-out">
              {STATEMENT_META[statement.statement_type].title}
            </span>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            {canOpen && (
              <>
                <a
                  href={statement.statement_value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    isTouchScreen
                      ? "tw-opacity-100"
                      : "tw-opacity-0 group-hover:tw-opacity-100"
                  } tw-p-1.5 tw-bg-transparent tw-cursor-pointer tw-text-xs tw-font-semibold tw-text-iron-400 hover:tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
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
              className={`${
                isTouchScreen
                  ? "tw-opacity-100"
                  : "tw-opacity-0 group-hover:tw-opacity-100"
              } tw-p-1.5 tw-bg-transparent tw-cursor-pointer tw-text-xs tw-font-semibold tw-text-iron-400 hover:tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
              onClick={handleCopy}
              data-tooltip-id={`copy-statement-${statement.statement_type}`}>
              <CopyIcon />
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

        <div className="tw-ml-7">
          <span className="tw-text-sm tw-text-iron-200 tw-break-all tw-tracking-wide group-hover:tw-text-iron-100 tw-cursor-text tw-select-all tw-transition-colors tw-duration-150 tw-ease-out">
            {title === "Copied!" ? (
              <span className="tw-text-primary-400">{title}</span>
            ) : (
              statement.statement_value
            )}
          </span>
        </div>
      </div>
    </li>
  );
}
