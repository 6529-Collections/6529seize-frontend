import { useContext, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  CustomTokenPoolParamsToken,
  Mutable,
} from "../../../allowlist-tool/allowlist-tool.types";
import csvParser from "csv-parser";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import AllowlistToolAnimationWrapper from "../../../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import AllowlistToolAnimationHeightOpacity from "../../../allowlist-tool/common/animation/AllowlistToolAnimationHeightOpacity";
import DistributionPlanAddOperationBtn from "../../common/DistributionPlanAddOperationBtn";
import CreateCustomSnapshotFormUpload from "./CreateCustomSnapshotFormUpload";

export default function CreateCustomSnapshotForm() {
  const { distributionPlan, setToasts, addOperations } = useContext(
    DistributionPlanToolContext
  );
  const [formValues, setFormValues] = useState<{
    name: string;
  }>({
    name: "",
  });
  const [tokens, setTokens] = useState<CustomTokenPoolParamsToken[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const addCustomTokenPool = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    setIsLoading(true);
    console.log(tokens)
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
            description: formValues.name,
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
    <form onSubmit={handleSubmit}>
      <div className="tw-flex tw-gap-x-4 tw-items-end">
        <div className="tw-w-80">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Name
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="name"
              required
              autoComplete="off"
              value={formValues.name}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>

        <CreateCustomSnapshotFormUpload
          fileName={fileName}
          setFileName={setFileName}
          setTokens={setTokens}
        />

        <div>
          <DistributionPlanAddOperationBtn loading={isLoading}>
            Add custom snapshot
          </DistributionPlanAddOperationBtn>
        </div>
      </div>
    </form>
  );
}
