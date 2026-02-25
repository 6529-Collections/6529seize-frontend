"use client";

import { useEffect, useState } from "react";

import PencilIcon from "@/components/utils/icons/PencilIcon";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

import UserPageHeaderAboutEdit from "./UserPageHeaderAboutEdit";
import UserPageHeaderAboutStatement from "./UserPageHeaderAboutStatement";

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
          <div
            className={`tw-inline-flex tw-items-start tw-gap-2${
              canEdit ? " tw-group" : ""
            }`}
          >
            {canEdit ? (
              <button
                type="button"
                onClick={onEditClick}
                aria-label={
                  statement ? "Edit About statement" : "Add About statement"
                }
                className="tw-flex-1 tw-border-none tw-bg-transparent tw-p-0 tw-text-left"
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
                className="tw-pointer-events-none tw-shrink-0 tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-400 tw-opacity-0 tw-transition tw-duration-200 group-focus-within:tw-pointer-events-auto group-focus-within:tw-opacity-100 group-hover:tw-pointer-events-auto group-hover:tw-opacity-100 hover:tw-text-iron-200"
              >
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
