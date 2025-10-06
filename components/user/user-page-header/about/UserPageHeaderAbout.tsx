"use client";

import { CicStatement } from "@/entities/IProfile";
import { useEffect, useState } from "react";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import UserPageHeaderAboutStatement from "./UserPageHeaderAboutStatement";
import UserPageHeaderAboutEdit from "./UserPageHeaderAboutEdit";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

enum AboutStatementView {
  STATEMENT = "STATEMENT",
  EDIT = "EDIT",
}

export default function UserPageHeaderAbout({
  profile,
  statement,
  canEdit,
}: {
  readonly profile: ApiIdentity;
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
    <div>
      {view === AboutStatementView.STATEMENT && (
        <div className="tw-max-w-full lg:tw-max-w-prose tw-mt-4">
          <button
            onClick={onEditClick}
            disabled={!canEdit}
            type="button"
            aria-label={
              statement ? "Edit About statement" : "Add About statement"
            }
            className="tw-flex tw-items-center tw-gap-x-2 tw-text-iron-500 hover:tw-text-iron-200 tw-text-left tw-group tw-bg-transparent tw-border-none tw-m-0 tw-p-0 tw-relative tw-transition tw-duration-300 tw-ease-out">
            <UserPageHeaderAboutStatement statement={statement} />
            {canEdit && (
              <div
                className={`${
                  statement ? "group-hover:tw-block tw-hidden" : "tw-block"
                }  tw-text-iron-400`}>
                <PencilIcon />
              </div>
            )}
          </button>
        </div>
      )}

      {view === AboutStatementView.EDIT && (
        <div className="tw-max-w-full tw-mt-4">
          <UserPageHeaderAboutEdit
            profile={profile}
            statement={statement}
            onClose={() => setView(AboutStatementView.STATEMENT)}
          />
        </div>
      )}
    </div>
  );
}
