import { useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogSocialVerificationPostEdit,
} from "../../../../../../entities/IProfile";
import SocialStatementIcon from "../../../../utils/icons/SocialStatementIcon";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import { truncateMiddle } from "../../../../../../helpers/Helpers";
import { useCopyToClipboard } from "react-use";
import Tippy from "@tippyjs/react";
import CopyIcon from "../../../../../utils/icons/CopyIcon";
import { useRouter } from "next/router";

interface Props {
  log: ProfileActivityLogSocialVerificationPostEdit;
  profile: IProfileAndConsolidations;
}

export default function UserPageIdentityActivityLogSocialMediaVerificationPost(
  props: Props
) {
  const router = useRouter();

  const [title, setTitle] = useState(
    truncateMiddle(props.log.contents.statement.statement_value)
  );

  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopy = () => {
    copyToClipboard(props.log.contents.statement.statement_value);
    setTitle("Copied!");
    setTimeout(() => {
      setTitle(truncateMiddle(props.log.contents.statement.statement_value));
    }, 1000);
  };

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center">
        <div className="tw-mt-1 tw-inline-flex tw-space-x-1.5">
          <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
            {props.profile?.profile?.handle}
          </span>
          <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
            {PROFILE_ACTIVITY_LOG_ACTION_STR[props.log.contents.action]}
          </span>
          <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
            social media verification post
          </span>
          <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-100">
            <SocialStatementIcon
              statementType={props.log.contents.statement.statement_type}
            />
          </div>
          <span className="tw-whitespace-nowrap tw-group tw-inline-flex tw-text-sm tw-font-semibold tw-text-iron-100">
            {title}
            <Tippy
              content="Copy"
              theme="dark"
              placement="top"
              disabled={isTouchScreen}
            >
              <button
                onClick={handleCopy}
                className={`${
                  isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
                } tw-mx-1 tw-h-5 tw-w-5 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
              >
                <CopyIcon />
              </button>
            </Tippy>
          </span>
        </div>
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={props.log} />
      </td>
    </tr>
  );
}
