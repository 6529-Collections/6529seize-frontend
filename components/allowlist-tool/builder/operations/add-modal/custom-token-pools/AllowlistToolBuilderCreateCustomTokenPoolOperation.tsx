import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import AllowlistToolSelectMenu, {
  AllowlistToolSelectMenuOption,
} from "../../../../common/select-menu/AllowlistToolSelectMenu";
import { getRandomObjectId } from "../../../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  CustomTokenPoolParamsToken,
  Mutable,
} from "../../../../allowlist-tool.types";
import csvParser from "csv-parser";

export default function AllowlistToolBuilderCreateCustomTokenPoolOperation({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const { operations, setOperations } = useContext(AllowlistToolBuilderContext);
  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  const [tokens, setTokens] = useState<CustomTokenPoolParamsToken[]>([]);

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
      const results: CustomTokenPoolParamsToken[] = [];

      const parser = csvParser({
        headers: ["owner", "tokenid", "since"],
        mapHeaders: ({ header }) => header.toLowerCase(),
        skipLines: 1,
        separator: ";",
      })
        .on("data", (row: any) => {
          const token: Mutable<CustomTokenPoolParamsToken, "id" | "since"> = {
            owner: row.owner,
          };
          if (row.tokenid) {
            token.id = row.tokenid;
          }

          if (row.since) {
            token.since = row.since;
          }
          results.push(token);
        })
        .on("end", () => {
          setTokens(results);
        })
        .on("error", (err: any) => {
          console.error(err);
        });

      parser.write(data);
      parser.end();
    };
    reader.readAsText(file);
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);
    if (tokens.length === 0) {
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
        code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
        params: {
          id: getRandomObjectId(),
          name: formValues.name,
          description: formValues.description,
          tokens: tokens,
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
            name: "",
            description: "",
          });
          setTokens([]);
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="fileInput"
            className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            Upload a file
          </label>
          <input
            id="fileInput"
            type="file"
            accept="text/csv"
            className="tw-hidden"
            onChange={onFileUpload}
          />
        </div>

        <div>
          <button
            type="submit"
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
          >
            Add operation
          </button>
        </div>
      </div>
    </form>
  );
}
