import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { useEffect, useState } from "react";
import PencilIcon, { PencilIconSize } from "../../../utils/icons/PencilIcon";
import UserPageHeaderAboutStatement from "./UserPageHeaderAboutStatement";
import UserPageHeaderAboutEdit from "./UserPageHeaderAboutEdit";

enum AboutStatementView {
  STATEMENT = "STATEMENT",
  EDIT = "EDIT",
}

export default function UserPageHeaderAbout({
  profile,
  statement,
  canEdit,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly statement: CicStatement | null;
  readonly canEdit: boolean;
}) {
  const [view, setView] = useState<AboutStatementView>(
    AboutStatementView.STATEMENT
  );

  useEffect(() => {
    setView(AboutStatementView.STATEMENT);
  }, [profile, statement, canEdit]);

  const toggleView = () => {
    if (view === AboutStatementView.STATEMENT) {
      setView(AboutStatementView.EDIT);
    } else {
      setView(AboutStatementView.STATEMENT);
    }
  };

  const onEditClick = () => {
    if (view === AboutStatementView.STATEMENT) {
      toggleView();
    }
  };

  return (
    <div className="tw-col-span-full tw-pb-5 tw-mb-5 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0  tw-border-iron-800">
      <div className="tw-max-w-full lg:tw-max-w-prose tw-mt-4">
        {view === AboutStatementView.STATEMENT && (
          <button
            onClick={onEditClick}
            disabled={!canEdit}
            className={`${
              canEdit ? "hover:tw-text-neutral-400" : ""
            } tw-text-left tw-group tw-bg-transparent tw-border-none tw-m-0 tw-p-0 tw-relative tw-transition tw-duration-300 tw-ease-out`}
          >
            <UserPageHeaderAboutStatement statement={statement} />
            {canEdit && (
              <div className="group-hover:tw-block tw-hidden tw-absolute tw-inset-0 tw-text-neutral-400">
                <div className="tw-absolute tw-top-1.5 -tw-left-5 sm:-tw-left-6">
                  <PencilIcon />
                </div>
              </div>
            )}
          </button>
        )}

        {view === AboutStatementView.EDIT && (
          <UserPageHeaderAboutEdit
            profile={profile}
            statement={statement}
            onClose={() => setView(AboutStatementView.STATEMENT)}
          />
        )}
      </div>
    </div>
  );
}
