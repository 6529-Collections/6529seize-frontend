import { useState } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import { ProfileActivityLogType } from "../../../../../entities/IProfile";
import DropListItemDiscussionInputWrapper from "./DropListItemDiscussionInputWrapper";
import DropListItemDiscussionItems from "./DropListItemDiscussionItems";
import DropListItemDiscussionFilter from "./filter/DropListItemDiscussionFilter";

export type DropItemDiscussionFilterType =
  | ProfileActivityLogType.DROP_COMMENT
  | ProfileActivityLogType.DROP_REP_EDIT
  | null;

export default function DropListItemDiscussion({
  drop,
  initialFilter,
  animating,
}: {
  readonly drop: DropFull;
  readonly initialFilter: DropItemDiscussionFilterType;
  readonly animating: boolean;
}) {
  const [filter, setFilter] =
    useState<DropItemDiscussionFilterType>(initialFilter);

  return (
    <div className="tw-w-full tw-py-5 tw-px-4 sm:tw-px-5 tw-border-t tw-border-solid tw-border-b-0 tw-border-x-0 tw-border-iron-700">
      <DropListItemDiscussionInputWrapper drop={drop} />
      <div className="tw-pt-4 sm:tw-pl-12 tw-space-y-4">
        <DropListItemDiscussionFilter
          activeFilter={filter}
          setFilter={setFilter}
        />
        <DropListItemDiscussionItems
          drop={drop}
          filter={filter}
          animating={animating}
        />
      </div>
    </div>
  );
}
