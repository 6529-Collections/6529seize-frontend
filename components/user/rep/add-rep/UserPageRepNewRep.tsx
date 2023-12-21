import { useState } from "react";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageRepNewRepModal from "./UserPageRepNewRepModal";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";

export default function UserPageRepNewRep({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [repSearch, setRepSearch] = useState<string>("");

  const handleRepSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setRepSearch(newValue);
  };

  const [isAddNewRepModalOpen, setIsAddNewRepModalOpen] =
    useState<boolean>(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!repSearch) return;
    setIsAddNewRepModalOpen(true);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="tw-max-w-xs tw-mt-4">
        <label
          htmlFor="search-rep"
          className="tw-block tw-text-sm tw-font-normal tw-text-iron-400"
        >
          Add rep
        </label>
        <div className="tw-relative tw-mt-1.5">
          <svg
            className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id="search-rep"
            name="search-rep"
            type="text"
            required
            autoComplete="off"
            value={repSearch}
            onChange={handleRepSearchChange}
            className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 tw-text-iron-300 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none  focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-transition tw-duration-300 tw-ease-out"
            placeholder="Search"
          />
        </div>
      </form>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isAddNewRepModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageRepNewRepModal
              profile={profile}
              repName={repSearch}
              onClose={() => setIsAddNewRepModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
