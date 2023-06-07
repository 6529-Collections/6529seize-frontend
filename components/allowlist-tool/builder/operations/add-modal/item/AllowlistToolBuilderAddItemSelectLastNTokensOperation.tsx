import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import { useRouter } from "next/router";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../../../allowlist-tool.types";

export default function AllowlistToolBuilderItemSelectLastNTokensOperation({
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
    count: string;
  }>({
    count: "",
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
    const count = +formValues.count;
    if (count <= 0) {
      setToasts({ messages: ["Count must be greater than 0"], type: "error" });
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
        code: AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS,
        params: {
          itemId,
          count: count,
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
            count: "",
          });
          onClose();
        }
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="tw-px-4 sm:tw-px-6">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-5">
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Count
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="count"
              required
              autoComplete="off"
              value={formValues.count}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
      </div>
      <div className="tw-mt-6 tw-flex tw-justify-end">
        <button
          type="submit"
          className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-w-full sm:tw-w-auto tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Add operation
        </button>
      </div>
    </form>
  );
}
