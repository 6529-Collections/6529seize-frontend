"use client";

import { CicStatement } from "../../../../../entities/IProfile";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
import CopyIcon from "../../../../utils/icons/CopyIcon";
import OutsideLinkIcon from "../../../../utils/icons/OutsideLinkIcon";
import UserPageIdentityDeleteStatementButton from "./UserPageIdentityDeleteStatementButton";
import { STATEMENT_META } from "../../../../../helpers/Types";

interface UserPageIdentityStatementsStatementTooltipProps {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly onCopy: () => void;
  readonly title: string;
}

export default function UserPageIdentityStatementsStatementTooltip({
  statement,
  profile,
  canEdit,
  onCopy,
  title,
}: UserPageIdentityStatementsStatementTooltipProps) {
  const canOpen = STATEMENT_META[statement.statement_type].canOpenStatement;

  return (
    <div className="tw-p-3 tw-border tw-border-solid tw-border-white/10 tw-rounded-lg">
      {/* Action buttons only */}
      <div className="tw-flex tw-items-center tw-space-x-2">
        {canOpen && (
          <a
            href={statement.statement_value}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-flex tw-items-center tw-space-x-1.5 tw-px-3 tw-py-2 tw-rounded-md tw-bg-iron-700 hover:tw-bg-iron-600 tw-text-xs tw-text-iron-200 hover:tw-text-white tw-transition tw-duration-200 tw-font-medium"
          >
            <OutsideLinkIcon />
            <span>Open</span>
          </a>
        )}

        <button
          onClick={onCopy}
          className="tw-flex tw-items-center tw-space-x-1.5 tw-px-3 tw-py-2 tw-rounded-md tw-bg-iron-700 hover:tw-bg-iron-600 tw-text-xs tw-text-iron-200 hover:tw-text-white tw-transition tw-duration-200 tw-font-medium"
        >
          <CopyIcon />
          <span>Copy</span>
        </button>

        {canEdit && (
          <UserPageIdentityDeleteStatementButton
            statement={statement}
            profile={profile}
          />
        )}
      </div>
    </div>
  );
}
