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
    <li className="hover:tw-bg-iron-800 tw-group -tw-ml-1 tw-inline-flex tw-h-8 tw-px-1.5 tw-rounded-lg tw-items-center tw-text-sm sm:tw-text-md tw-font-medium tw-text-neutral-200 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out">
      <div className="tw-inline-flex tw-items-center tw-space-x-3">
        <div className="tw-flex-shrink-0 tw-cursor-pointer tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
          <SocialStatementIcon statementType={statement.statement_type} />
        </div>
        <span>{title}</span>
      </div>
      {canOpen && (
        <>
          <a
            href={statement.statement_value}
            target="_blank"
            rel="noopener noreferrer"
            className={`${
              isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
            } tw-p-2 tw-bg-transparent tw-cursor-pointer tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
            data-tooltip-id={`open-statement-${statement.statement_type}`}
          >
            <OutsideLinkIcon />
          </a>
          {!isTouchScreen && (
            <Tooltip
              id={`open-statement-${statement.statement_type}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}
            >
              Open
            </Tooltip>
          )}
        </>
      )}
      <>
        <button
          aria-label="Copy"
          className={`${
            isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
          } tw-p-2 tw-bg-transparent tw-cursor-pointer tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
          onClick={handleCopy}
          data-tooltip-id={`copy-statement-${statement.statement_type}`}
        >
          <CopyIcon />
        </button>
        {!isTouchScreen && (
          <Tooltip
            id={`copy-statement-${statement.statement_type}`}
            place="top"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            Copy
          </Tooltip>
        )}
      </>
      {canEdit && (
        <UserPageIdentityDeleteStatementButton
          statement={statement}
          profile={profile}
        />
      )}
    </li>
  );
}
