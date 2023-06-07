import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import { useRouter } from "next/router";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../../../allowlist-tool.types";

export default function AllowlistToolBuilderItemExcludeTokenIdsOperation({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { operations, setOperations, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
  const [formValues, setFormValues] = useState<{
    tokenIds: string;
  }>({
    tokenIds: "",
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const tokenIds = formValues.tokenIds;
    if (tokenIds.length === 0) {
      setToasts({ messages: ["Token IDs must not be empty"], type: "error" });
      setIsLoading(false);
      return;
    }
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS,
        params: {
          itemId,
          tokenIds: tokenIds,
        },
      }),
    })
      .then((response) => response.json())
      .then((data: AllowlistToolResponse<AllowlistOperation>) => {
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setOperations([...operations, data]);
          setFormValues({
            tokenIds: "",
          });
          onClose();
        }
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
        <div className="tw-flex-1 tw-max-w-[15.25rem]">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Token ID(s)
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="tokenIds"
              required
              autoComplete="off"
              value={formValues.tokenIds}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="tw-bg-primary tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Add operation
          </button>
        </div>
      </div>
    </form>
  );
}
