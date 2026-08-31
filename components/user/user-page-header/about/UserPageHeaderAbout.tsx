"use client";

import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useState } from "react";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import UserPageHeaderAboutStatement from "./UserPageHeaderAboutStatement";
import UserPageHeaderAboutEdit from "./UserPageHeaderAboutEdit";
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
  const [draftValue, setDraftValue] = useState(
    statement?.statement_value ?? ""
  );
  const [editorErrorMsg, setEditorErrorMsg] = useState<string | null>(null);
  const isDesktopAboutEditor = useMediaQuery("(min-width: 768px)");

  const closeEditor = () => {
    setView(AboutStatementView.STATEMENT);
    setDraftValue(statement?.statement_value ?? "");
    setEditorErrorMsg(null);
  };

  const onEditClick = () => {
    if (view === AboutStatementView.STATEMENT) {
      setDraftValue(statement?.statement_value ?? "");
      setEditorErrorMsg(null);
      setView(AboutStatementView.EDIT);
    }
  };
  const editActionLabel = getUserProfileHeaderMessage(
    statement ? "user.profileHeader.about.edit" : "user.profileHeader.about.add"
  );

  return (
    <>
      {view === AboutStatementView.STATEMENT && statement && (
        <div className="tw-max-w-2xl">
          <div
            className={[
              "tw-inline-flex tw-items-start tw-gap-2 touch-only:tw-gap-0",
              canEdit ? "tw-group" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <UserPageHeaderAboutStatement statement={statement} />
            {canEdit && statement && (
              <button
                type="button"
                onClick={onEditClick}
                aria-label={editActionLabel}
                className="tw-pointer-events-none tw-hidden tw-shrink-0 tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-400 tw-opacity-0 tw-transition tw-duration-200 focus-visible:tw-rounded-lg focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:group-hover:tw-pointer-events-auto desktop-hover:group-hover:tw-opacity-100 desktop-hover:hover:tw-text-iron-200 touch-only:tw-pointer-events-auto touch-only:tw-size-11 touch-only:tw-opacity-100 sm:tw-block sm:group-focus-within:tw-pointer-events-auto sm:group-focus-within:tw-opacity-100"
              >
                <span
                  aria-hidden="true"
                  className="tw-flex tw-size-full tw-items-center tw-justify-center"
                >
                  <PencilIcon size={PencilIconSize.SMALL} />
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {view === AboutStatementView.STATEMENT && canEdit && !statement && (
        <div className="tw-hidden tw-max-w-2xl sm:tw-block">
          <button
            type="button"
            onClick={onEditClick}
            aria-label={editActionLabel}
            className="tw-group tw-border-none tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            <UserPageHeaderAboutStatement statement={statement} />
          </button>
        </div>
      )}

      {view === AboutStatementView.EDIT && isDesktopAboutEditor && (
        <UserPageHeaderAboutEdit
          profile={profile}
          statement={statement}
          onClose={closeEditor}
          value={draftValue}
          onValueChange={setDraftValue}
          errorMsg={editorErrorMsg}
          onErrorMsgChange={setEditorErrorMsg}
          autoFocus
        />
      )}

      {view === AboutStatementView.EDIT && !isDesktopAboutEditor && (
        <>
          {statement && (
            <div className="tw-max-w-2xl">
              <UserPageHeaderAboutStatement statement={statement} />
            </div>
          )}
          <MobileWrapperDialog
            title={getUserProfileHeaderMessage(
              "user.profileHeader.edit.aboutTitle"
            )}
            isOpen
            onClose={closeEditor}
            tabletModal
            showHeaderCloseButton
            showHeaderDivider
          >
            <div className="tw-px-4 sm:tw-px-6">
              <UserPageHeaderAboutEdit
                profile={profile}
                statement={statement}
                onClose={closeEditor}
                value={draftValue}
                onValueChange={setDraftValue}
                errorMsg={editorErrorMsg}
                onErrorMsgChange={setEditorErrorMsg}
              />
            </div>
          </MobileWrapperDialog>
        </>
      )}
    </>
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
