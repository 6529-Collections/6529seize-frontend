import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
  AllowlistCustomTokenPool,
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  CustomTokenPoolParamsToken,
  Mutable,
} from "../../allowlist-tool/allowlist-tool.types";
import csvParser from "csv-parser";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";

export default function CreateCustomSnapshots() {
  const {
    step,
    distributionPlan,
    setToasts,
    operations,
    addOperations,
    setStep,
  } = useContext(DistributionPlanToolContext);
  useEffect(() => {
    if (!distributionPlan) setStep(DistributionPlanToolStep.CREATE_PLAN);
  }, [distributionPlan, setStep]);

  const [customSnapshots, setCustomSnapshots] = useState<
    AllowlistCustomTokenPool[]
  >([]);

  useEffect(() => {
    if (!distributionPlan) return;
    const customSnapshotOperations = operations.filter(
      (o) => o.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
    );
    setCustomSnapshots(
      customSnapshotOperations.map<AllowlistCustomTokenPool>((o) => ({
        id: o.params.id,
        allowlistId: distributionPlan.id,
        name: o.params.name,
        description: o.params.description,
        walletsCount: new Set(o.params.tokens.map((t: any) => t.owner)).size,
        tokensCount: o.params.tokens.length,
      }))
    );
  }, [operations, distributionPlan]);

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

  const [fileName, setFileName] = useState<string | null>(null);
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
          setFileName(file.name);
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
  const addCustomTokenPool = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    setIsLoading(true);
    try {
      if (tokens.length === 0) {
        setToasts({ messages: ["No tokens provided"], type: "error" });
        setIsLoading(false);
        return null;
      }
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/operations`;
      const customTokenPoolId = getRandomObjectId();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
          params: {
            id: customTokenPoolId,
            name: formValues.name,
            description: formValues.description,
            tokens: tokens,
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
        return null;
      }
      addOperations([structuredClone(data)]);
      setFormValues({
        name: "",
        description: "",
      });
      setTokens([]);
      setFileName(null);
      return customTokenPoolId;
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addCustomTokenPool();
  };

  return (
    <div>
      {customSnapshots.length > 0 &&
        customSnapshots.map((customSnapshot) => (
          <div key={customSnapshot.id}>{customSnapshot.name}-{customSnapshot.walletsCount}-{customSnapshot.tokensCount}</div>
        ))}
      <div className="tw-mt-5">
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
                  required
                  autoComplete="off"
                  value={formValues.name}
                  onChange={handleChange}
                  className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
                  required
                  autoComplete="off"
                  value={formValues.description}
                  onChange={handleChange}
                  className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="fileInput"
                className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
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
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Upload a CSV</span>
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
                className={`tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out`}
              >
                Add custom token pool
              </button>
            </div>
          </div>
        </form>
        <div className="tw-mt-8 tw-w-full">
          <button
            onClick={() =>
              setStep(DistributionPlanToolStep.CREATE_PHASES)
            }
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Create Phases
          </button>
        </div>
      </div>
    </div>
  );
}
