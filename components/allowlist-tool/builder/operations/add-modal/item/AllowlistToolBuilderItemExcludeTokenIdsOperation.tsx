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
  const { operations, setOperations } = useContext(AllowlistToolBuilderContext);
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
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);
    const tokenIds = formValues.tokenIds;
    if (tokenIds.length === 0) {
      setErrors(["No tokens provided"]);
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
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
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
    <form onSubmit={handleSubmit} className="tw-px-4 sm:tw-px-6">
      <div className="tw-grid tw-grid-cols-1 tw-4 tw-pt-5">
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Token ID(s)
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="tokenIds"
              required
              autoComplete="off"
              value={formValues.tokenIds}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
