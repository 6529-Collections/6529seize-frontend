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
    <div className="tw-col-span-full tw-pb-6 tw-mb-6 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0  tw-border-iron-800">
      <div className="tw-max-w-full sm:tw-max-w-prose">
        <div>
          {isMyProfile && (
            <>
              {view === AboutStatementView.STATEMENT && (
                <button
                  onClick={toggleView}
                  className="tw-p-0 tw-group tw-bg-transparent tw-inline-flex tw-items-center tw-border-none tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-block tw-text-base tw-font-medium tw-text-iron-50 group-hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
                    About
                  </span>
                  <div className="tw-p-2 -tw-mt-0.5">
                    <PencilIcon size={PencilIconSize.SMALL} />
                  </div>
                </button>
              )}

              {view === AboutStatementView.EDIT && (
                <button
                  onClick={toggleView}
                  className="tw-p-0 tw-group tw-bg-transparent tw-inline-flex tw-items-center tw-border-none tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-block tw-text-base tw-font-medium tw-text-iron-50 group-hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
                    About
                  </span>
                  <div className="tw-p-2 -tw-mt-0.5">
                    <svg
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6"
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
                  </div>
                </button>
              )}
            </>
          )}
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
