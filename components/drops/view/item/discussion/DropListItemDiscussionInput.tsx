import { useContext } from "react";
import PrimaryButton from "../../../../utils/buttons/PrimaryButton";
import { AuthContext } from "../../../../auth/Auth";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import DropPfp from "../../../create/utils/DropPfp";

export default function DropListItemDiscussionInput({
  profile,
}: {
  readonly profile: IProfileAndConsolidations | null;
}) {
  const { setToast } = useContext(AuthContext);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setToast({
      message: "Not implemented yet!",
      type: "warning",
    });
  };

  return (
    <div>
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
        <DropPfp pfpUrl={profile?.profile?.pfp_url} />
        <form
          className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3"
          onSubmit={onSubmit}
        >
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
            <PrimaryButton type="submit">Send</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
