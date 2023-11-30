import { useState } from "react";
import DiscordIcon from "../../../utils/icons/DiscordIcon";
import TelegramIcon from "../../../utils/icons/TelegramIcon";
import WeChatIcon from "../../../utils/icons/WeChatIcon";
import UserPageIdentityAddStatementsContactItems from "./UserPageIdentityAddStatementsContactItems";
import UserPageIdentityAddStatementsContactHeader from "./UserPageIdentityAddStatementsContactHeader";
import {
  CONTACT_STATEMENT_TYPE,
  CONTACT_STATEMENT_TYPES,
  STATEMENT_TYPE,
} from "../../../../../helpers/Types";
import UserPageIdentityAddStatementsContactInput from "./UserPageIdentityAddStatementsContactInput";
import { on } from "events";

export default function UserPageIdentityAddStatementsContact({
  onClose,
}: {
  onClose: () => void;
}) {
  const [contactType, setContactType] = useState<CONTACT_STATEMENT_TYPE>(
    STATEMENT_TYPE.DISCORD
  );

  const [contactValue, setContactValue] = useState<string>("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(contactType, contactValue);
    setContactValue("");
  };

  return (
    <>
      <UserPageIdentityAddStatementsContactHeader onClose={onClose} />

      <UserPageIdentityAddStatementsContactItems
        activeType={contactType}
        setContactType={setContactType}
      />
      <div className="tw-mt-4">
        <form onSubmit={onSubmit}>
          <UserPageIdentityAddStatementsContactInput
            activeType={contactType}
            value={contactValue}
            onChange={setContactValue}
          />

          <div className="tw-mt-8">
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
              <button
                onClick={onClose}
                type="button"
                className="tw-cursor-pointer tw-bg-neutral-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-neutral-600 tw-rounded-lg hover:tw-bg-neutral-800 hover:tw-border-neutral-700 tw-transition tw-duration-300 tw-ease-out"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
