"use client";

import type { CicStatement } from "@/entities/IProfile";
import { useState } from "react";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import UserPageHeaderAboutStatement from "./UserPageHeaderAboutStatement";
import UserPageHeaderAboutEdit from "./UserPageHeaderAboutEdit";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

enum AboutStatementView {
  STATEMENT = "STATEMENT",
  EDIT = "EDIT",
}

function UserPageHeaderAboutContent({
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
  const editActionLabel = getUserProfileHeaderMessage(
    statement ? "user.profileHeader.about.edit" : "user.profileHeader.about.add"
  );

  return (
    <div className="tw-max-w-4xl">
      <div
        className={
          canEdit
            ? "tw-flex tw-min-h-8 tw-items-center tw-justify-between tw-gap-3"
            : ""
        }
      >
        <h2
          className={
            canEdit
              ? "tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-300"
              : "tw-sr-only"
          }
        >
          {getUserProfileHeaderMessage("user.profileHeader.about.label")}
        </h2>
        {view === AboutStatementView.STATEMENT && canEdit && statement ? (
          <button
            type="button"
            onClick={onEditClick}
            aria-label={editActionLabel}
            className="tw-inline-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-200 motion-reduce:tw-transition-none"
          >
            <span aria-hidden="true">
              <PencilIcon />
            </span>
          </button>
        ) : null}
      </div>

      {view === AboutStatementView.STATEMENT && (
        <div className={canEdit ? "tw-mt-2" : ""}>
          {canEdit && !statement ? (
            <button
              type="button"
              onClick={onEditClick}
              aria-label={editActionLabel}
              className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-dashed tw-border-white/10 tw-bg-white/[0.025] tw-px-3 tw-py-2 tw-text-left tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.05] motion-reduce:tw-transition-none"
            >
              <UserPageHeaderAboutStatement statement={statement} />
            </button>
          ) : (
            <UserPageHeaderAboutStatement statement={statement} />
          )}
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

export default function UserPageHeaderAbout({
  profile,
  statement,
  canEdit,
}: {
  readonly profile: ApiIdentity;
  readonly statement: CicStatement | null;
  readonly canEdit: boolean;
}) {
  const resetKey = [
    profile.id,
    profile.handle,
    profile.query,
    statement?.id,
    statement?.statement_value,
    canEdit ? "editable" : "readonly",
  ]
    .map((value) => `${value ?? ""}`)
    .join(":");

  return (
    <div id="profile-about" className="tw-scroll-mt-24">
      <UserPageHeaderAboutContent
        key={resetKey}
        profile={profile}
        statement={statement}
        canEdit={canEdit}
      />
    </div>
  );
}
