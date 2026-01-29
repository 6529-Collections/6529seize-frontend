"use client";

import type { CicStatement } from "@/entities/IProfile";
import { useEffect, useState } from "react";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import UserPageHeaderAboutStatement from "./UserPageHeaderAboutStatement";
import UserPageHeaderAboutEdit from "./UserPageHeaderAboutEdit";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

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
        <div className="tw-max-w-3xl">
          <div className="tw-flex tw-items-start tw-gap-2">
            {canEdit ? (
              <button
                type="button"
                onClick={onEditClick}
                aria-label={
                  statement ? "Edit About statement" : "Add About statement"
                }
                className="tw-flex-1 tw-text-left tw-bg-transparent tw-border-none tw-p-0"
              >
                <UserPageHeaderAboutStatement statement={statement} />
              </button>
            ) : (
              <UserPageHeaderAboutStatement statement={statement} />
            )}
            {canEdit && (
              <button
                type="button"
                onClick={onEditClick}
                aria-label={
                  statement ? "Edit About statement" : "Add About statement"
                }
                className="tw-shrink-0 tw-bg-transparent tw-border-none tw-p-0 tw-text-iron-400 hover:tw-text-iron-200 tw-transition tw-duration-200">
                <PencilIcon />
              </button>
            )}
          </div>
        </div>
      )}

      {view === AboutStatementView.EDIT && (
        <div>
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
