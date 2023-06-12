import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import csvParser from "csv-parser";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import AllowlistToolPrimaryBtn from "../../common/AllowlistToolPrimaryBtn";

export default function AllowlistToolBuilderWalletPoolsAdd() {
  const router = useRouter();
  const { operations, addNewOperation, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
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
          setToasts({ messages: [err.message], type: "error" });
        });

      parser.write(data);
      parser.end();
    };
    reader.readAsText(file);
  };
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addWalletPool = async () => {
    setIsLoading(true);
    if (wallets.length === 0) {
      setToasts({
        messages: ["Please upload a CSV file with wallets"],
        type: "error",
      });
      setIsLoading(false);
      return;
    }
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: AllowlistOperationCode.CREATE_WALLET_POOL,
          params: {
            id: getRandomObjectId(),
            name: formValues.name,
            description: formValues.description,
            wallets,
          },
        }),
      });
      const data: AllowlistToolResponse<AllowlistOperation> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }
      addNewOperation(data);
      setFormValues({
        name: "",
        description: "",
      });
      setWallets([]);
    } catch (error) {
      setToasts({
        messages: ["Something went wrong, please try again"],
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addWalletPool();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
        <div className="tw-flex-1  tw-max-w-[15.25rem]">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Pool name
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-flex-1 tw-max-w-[15.25rem]">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Description
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="walletPoolFile"
            className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            Upload a CSV
          </label>
          <input
            id="walletPoolFile"
            type="file"
            accept="text/csv"
            className="tw-hidden"
            onChange={onFileUpload}
          />
        </div>
        <div>
          <AllowlistToolPrimaryBtn
            onClick={() => {}}
            type="submit"
            loading={isLoading}
          >
            Add wallet pool
          </AllowlistToolPrimaryBtn>
        </div>
      </div>
    </form>
  );
}
