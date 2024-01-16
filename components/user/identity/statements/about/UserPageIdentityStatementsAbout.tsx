import { useEffect, useState } from "react";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import UserPageIdentityStatementsAboutEdit from "./UserPageIdentityStatementsAboutEdit";
import UserPageIdentityStatementsAboutStatement from "./UserPageIdentityStatementsAboutStatement";
import { useAccount } from "wagmi";
import PencilIcon, { PencilIconSize } from "../../../../utils/icons/PencilIcon";
import { amIUser } from "../../../../../helpers/Helpers";

enum AboutStatementView {
  STATEMENT = "STATEMENT",
  EDIT = "EDIT",
}

export default function UserPageIdentityStatementsAbout({
  profile,
  statement,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly statement: CicStatement | null;
}) {
  const { address } = useAccount();

  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);
  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  const [view, setView] = useState<AboutStatementView>(
    AboutStatementView.STATEMENT
  );

  useEffect(() => {
    setView(AboutStatementView.STATEMENT);
  }, [profile, statement, address]);

  const toggleView = () => {
    if (view === AboutStatementView.STATEMENT) {
      setView(AboutStatementView.EDIT);
    } else {
      setView(AboutStatementView.STATEMENT);
    }
  };

  return (
    <div className="tw-col-span-full tw-pb-6 tw-mb-6 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0  tw-border-white/10">
      <div className="tw-max-w-full sm:tw-max-w-prose">
        <div className="tw-inline-flex tw-w-full tw-items-center">
          {isMyProfile && (
            <button
              onClick={toggleView}
              className="tw-bg-transparent tw-border-none tw-text-iron-500 hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out"
            >
              {view === AboutStatementView.STATEMENT && (
                <PencilIcon size={PencilIconSize.SMALL} />
              )}
              {view === AboutStatementView.EDIT && (
                <svg
                  className="tw-h-6 tw-w-6"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          )}
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-50">
            About
          </span>
        </div>
        {view === AboutStatementView.STATEMENT && (
          <UserPageIdentityStatementsAboutStatement statement={statement} />
        )}
        {view === AboutStatementView.EDIT && (
          <UserPageIdentityStatementsAboutEdit
            profile={profile}
            statement={statement}
            onClose={() => setView(AboutStatementView.STATEMENT)}
          />
        )}
      </div>
    </div>
  );
}
