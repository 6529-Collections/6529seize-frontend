import { useState } from "react";
import { CommonSelectItem } from "../../../../utils/select/CommonSelect";
import DropListItemDiscussionInputWrapper from "./DropListItemDiscussionInputWrapper";
import CommonTabs from "../../../../utils/select/tabs/CommonTabs";
import DropListItemDiscussionItems from "./DropListItemDiscussionItems";

enum DropListItemDiscussionType {
  ALL = "ALL",
  DISCUSS = "DISCUSS",
  REP = "REP",
}

export default function DropListItemDiscussion() {
  const [discussionType, setDiscussionType] =
    useState<DropListItemDiscussionType>(DropListItemDiscussionType.ALL);
  const items: CommonSelectItem<DropListItemDiscussionType>[] = [
    {
      label: "All",
      mobileLabel: "All",
      value: DropListItemDiscussionType.ALL,
      key: "all",
    },
    {
      label: "Discuss",
      mobileLabel: "Discuss",
      value: DropListItemDiscussionType.DISCUSS,
      key: "discuss",
    },
    {
      label: "Rep",
      mobileLabel: "Rep",
      value: DropListItemDiscussionType.REP,
      key: "rep",
    },
  ];
  return (
    <div className="tw-w-full tw-py-5 tw-px-4 sm:tw-px-5 tw-border-t tw-border-solid tw-border-b-0 tw-border-x-0 tw-border-iron-700">
      <DropListItemDiscussionInputWrapper />
      <div className="tw-pt-4 tw-pl-12 tw-space-y-4">
        <nav className="tw-flex">
          <button
            type="button"
            className="tw-bg-iron-700 tw-text-iron-100 tw-rounded-lg tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-border-iron-800 tw-transition tw-duration-300 tw-ease-out"
          >
            All
          </button>
          <button
            type="button"
            className="tw-bg-iron-900 hover:tw-bg-iron-900 tw-rounded-lg tw-text-iron-500 hover:tw-text-iron-100 tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-border-iron-900 tw-transition tw-duration-300 tw-ease-out"
          >
            Discuss
          </button>
          <button
            type="button"
            className="tw-bg-iron-900 hover:tw-bg-iron-900 tw-rounded-lg tw-text-iron-500 hover:tw-text-iron-100 tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-border-iron-900 tw-transition tw-duration-300 tw-ease-out"
          >
            Rep
          </button>
        </nav>

        {/*  <CommonTabs
          items={items}
          activeItem={discussionType}
          filterLabel="Discussion"
          setSelected={setDiscussionType}
        /> */}
        <DropListItemDiscussionItems />
      </div>
    </div>
  );
}
