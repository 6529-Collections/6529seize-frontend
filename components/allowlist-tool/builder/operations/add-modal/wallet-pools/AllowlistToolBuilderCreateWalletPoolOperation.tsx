import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import { getRandomObjectId } from "../../../../../../helpers/AllowlistToolHelpers";
import { AllowlistOperationCode } from "../../../../allowlist-tool.types";
import csvParser from "csv-parser";
import AllowlistToolPrimaryBtn from "../../../../common/AllowlistToolPrimaryBtn";

export default function AllowlistToolBuilderCreateWalletPoolOperation({
  addOperation,
  isLoading,
}: {
  addOperation: ({
    code,
    params,
  }: {
    code: AllowlistOperationCode;
    params: any;
  }) => Promise<{ success: boolean }>;
  isLoading: boolean;
}) {
  const { setToasts } = useContext(AllowlistToolBuilderContext);
  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  const [wallets, setWallets] = useState<string[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result;
      const results: string[] = [];

      const parser = csvParser({
        headers: ["wallet"],
        mapHeaders: ({ header }) => header.toLowerCase(),
        skipLines: 1,
        separator: ";",
      })
        .on("data", (row: any) => {
          results.push(row.wallet);
        })
        .on("end", () => {
          setWallets(results);
        })
        .on("error", (err: any) => {
          console.error(err);
        });

      parser.write(data);
      parser.end();
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (wallets.length === 0) {
      setToasts({
        messages: ["Please upload a CSV file with wallets"],
        type: "error",
      });
      return;
    }
    await addOperation({
      code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
      params: {
        id: getRandomObjectId(),
        name: formValues.name,
        description: formValues.description,
        wallets,
      },
    });
  };
  return (
    <form onSubmit={handleSubmit} className="tw-px-4 sm:tw-px-6">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-5">
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Pool name
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Description
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="walletPoolFile"
            className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-h-5 tw-w-5 tw-mr-2 -tw-ml-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 8L12 3M12 3L7 8M12 3V15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Upload a CSV</span>
          </label>
          <input
            required
            id="walletPoolFile"
            type="file"
            accept="text/csv"
            className="tw-hidden"
            onChange={onFileUpload}
          />
        </div>
      </div>

      <div className="tw-mt-6">
        <AllowlistToolPrimaryBtn
          onClick={() => {}}
          loading={isLoading}
          type="submit"
        >
          Add operation
        </AllowlistToolPrimaryBtn>
      </div>
    </form>
  );
}
