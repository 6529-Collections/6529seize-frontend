import { useEffect, useState } from "react";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import CopyIcon from "../../../../utils/icons/CopyIcon";
import SocialStatementIcon from "../../../utils/icons/SocialStatementIcon";
import UserPageIdentityDeleteStatementButton from "./UserPageIdentityDeleteStatementButton";
import { useCopyToClipboard } from "react-use";
import Tippy from "@tippyjs/react";
import OutsideLinkIcon from "../../../../utils/icons/OutsideLinkIcon";
import { CAN_OPEN_STATEMENT } from "../../../../../helpers/Types";
import { useRouter } from "next/router";

export default function UserPageIdentityStatementsStatement({
  statement,
  profile,
  isMyProfile,
}: {
  readonly statement: CicStatement;
  readonly profile: IProfileAndConsolidations;
  readonly isMyProfile: boolean;
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

  const handleOpen = () => {
    window.open(statement.statement_value, "_blank");
  };

  const canOpen = CAN_OPEN_STATEMENT[statement.statement_type];
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <li className="hover:tw-bg-iron-800 tw-group -tw-ml-1 tw-inline-flex tw-h-8 tw-px-1.5 tw-rounded-lg tw-items-center tw-text-sm tw-font-medium tw-text-neutral-200 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out">
      <div className="tw-inline-flex tw-mr-2 tw-items-center tw-space-x-3">
        <div className="tw-flex-shrink-0 tw-cursor-pointer tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
          <SocialStatementIcon statementType={statement.statement_type} />
        </div>
        <div className="tw-flex tw-items-center">
          <span>{title}</span>
        </div>
      </div>
      {canOpen && (
        <Tippy
          content="Open"
          theme="dark"
          placement="top"
          disabled={isTouchScreen}
        >
          <button
            className={`${
              isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
            } tw-p-2  tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
            onClick={handleOpen}
          >
            <OutsideLinkIcon />
          </button>
        </Tippy>
      )}
      <Tippy
        content="Copy"
        theme="dark"
        placement="top"
        disabled={isTouchScreen}
      >
        <button
          className={`${
            isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
          } tw-p-2 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
          onClick={handleCopy}
        >
          <CopyIcon />
        </button>
      </Tippy>
      {isMyProfile && (
        <UserPageIdentityDeleteStatementButton
          statement={statement}
          profile={profile}
        />
      )}
    </li>
  );
}
