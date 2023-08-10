import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  CustomTokenPoolParamsToken,
  ResolvedEns,
} from "../../../allowlist-tool/allowlist-tool.types";
import {
  getRandomObjectId,
  isEthereumAddress,
} from "../../../../helpers/AllowlistToolHelpers";
import DistributionPlanAddOperationBtn from "../../common/DistributionPlanAddOperationBtn";
import CreateCustomSnapshotFormUpload from "./CreateCustomSnapshotFormUpload";
import CreateCustomSnapshotFormTable from "./CreateCustomSnapshotFormTable";

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

  const onRemoveToken = (index: number) => {
    setTokens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const resolveEns = async (ens: string[]): Promise<ResolvedEns[]> => {
    if (!ens.length) return [];
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/other/resolve-ens-to-address`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ens),
      });
      const data: AllowlistToolResponse<ResolvedEns[]> = await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return [];
      }
      return data;
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomTokenPool = async (): Promise<string | null> => {
    const ens = tokens.filter((token) => token.owner.endsWith(".eth"));
    const resolvedEns = await resolveEns(ens.map((token) => token.owner));
    if (ens.length !== resolvedEns.length) {
      setToasts({
        messages: ["Some ENS addresses could not be resolved"],
        type: "error",
      });
      return null;
    }
    if (resolvedEns.some((ens) => !ens.address)) {
      setToasts({
        messages: ["Some ENS addresses could not be resolved"],
        type: "error",
      });
      return null;
    }

    const tokensWithResolvedEns = tokens.map((token) => {
      if (token.owner.endsWith(".eth")) {
        const resolved = resolvedEns.find(
          (resolved) => resolved.ens === token.owner
        );
        if (resolved) {
          return {
            ...token,
            owner: resolved.address,
          };
        }
      }
      return token;
    });
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
            description: formValues.name,
            tokens: tokensWithResolvedEns,
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

  const [manualWallet, setManualWallet] = useState<string | null>(null);
  const [isCorrectManualWallet, setIsCorrectManualWallet] =
    useState<boolean>(false);

  useEffect(() => {
    if (manualWallet) {
      const isCorrect =
        isEthereumAddress(manualWallet) ||
        (manualWallet.length > 5 && manualWallet.endsWith(".eth"));
      setIsCorrectManualWallet(isCorrect);
      return;
    }
    setIsCorrectManualWallet(false);
  }, [manualWallet]);

  const addManualWallet = () => {
    if (!manualWallet?.length || !isCorrectManualWallet) {
      setToasts({
        messages: ["Invalid wallet address"],
        type: "error",
      });
      return;
    }
    setTokens((prev) => [
      {
        owner: manualWallet.toLowerCase(),
      },
      ...prev,
    ]);

    setManualWallet(null);
  };

  const addUploadedTokens = (tokens: CustomTokenPoolParamsToken[]) => {
    setTokens((prev) => [...tokens, ...prev]);
  };

  return (
    <div>
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
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 hover:tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>

          <div className="tw-w-80">
            <div className="tw-flex tw-justify-between tw-items-center">
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                Wallet no
              </label>
              <CreateCustomSnapshotFormUpload
                fileName={fileName}
                setFileName={setFileName}
                setTokens={addUploadedTokens}
              />
            </div>
            <div className="tw-relative tw-mt-2">
              <input
                type="text"
                name="owner"
                autoComplete="off"
                value={manualWallet || ""}
                onChange={(e) => setManualWallet(e.target.value ?? "")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40
              hover:tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
              <div className="tw-absolute tw-inset-y-0 tw-top-1 tw-right-0 tw-pr-2">
                <button
                  onClick={addManualWallet}
                  type="button"
                  className="tw-cursor-pointer tw-bg-neutral-800 hover:tw-bg-neutral-800/80 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          <div className="tw-ml-auto">
            <DistributionPlanAddOperationBtn loading={isLoading}>
              Add custom snapshot
            </DistributionPlanAddOperationBtn>
          </div>
        </div>
      </form>
      <CreateCustomSnapshotFormTable
        tokens={tokens}
        onRemoveToken={onRemoveToken}
      />
    </div>
  );
}
