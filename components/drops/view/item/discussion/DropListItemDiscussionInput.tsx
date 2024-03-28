import PrimaryButton from "../../../../utils/buttons/PrimaryButton";

export default function DropListItemDiscussionInput() {
  return (
    <div>
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
        <div className="tw-w-10">img</div>
        <div className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3">
          <div className="tw-w-full">
            <input
              type="text"
              placeholder="Write a comment"
              // value={title ?? ""}
              // onChange={(e) => onTitle(e.target.value)}
              maxLength={250}
              className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-text-md tw-leading-6 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
          <div className="tw-self-end">
            <PrimaryButton>Send</PrimaryButton>
          </div>
        </div>
      </div>

      
    </div>
  );
}
