"use client";

import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  CustomTokenPoolParamsToken,
  ResolvedEns,
} from "@/components/allowlist-tool/allowlist-tool.types";
import {
  getRandomObjectId,
  isEthereumAddress,
} from "@/helpers/AllowlistToolHelpers";
import DistributionPlanAddOperationBtn from "@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn";
import CreateCustomSnapshotFormTable from "./CreateCustomSnapshotFormTable";
import { distributionPlanApiPost } from "@/services/distribution-plan-api";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateCustomSnapshotFormAddWalletsModal from "./CreateCustomSnapshotFormAddWalletsModal";

const MAX_CUSTOM_SNAPSHOT_ROWS = 100000;
const CUSTOM_SNAPSHOT_CHUNK_SIZE = 500;

export default function CreateCustomSnapshotForm() {
  const { distributionPlan, setToasts, fetchOperations } = useContext(
    DistributionPlanToolContext
  );
  const [formValues, setFormValues] = useState<{
    name: string;
  }>({
    name: "",
  });
  const [tokens, setTokens] = useState<CustomTokenPoolParamsToken[]>([]);

  const chunkTokens = (
    list: CustomTokenPoolParamsToken[]
  ): CustomTokenPoolParamsToken[][] => {
    const chunks: CustomTokenPoolParamsToken[][] = [];
    for (let i = 0; i < list.length; i += CUSTOM_SNAPSHOT_CHUNK_SIZE) {
      chunks.push(list.slice(i, i + CUSTOM_SNAPSHOT_CHUNK_SIZE));
    }
    return chunks;
  };

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
    const endpoint = `/other/resolve-ens-to-address`;
    const { success, data } = await distributionPlanApiPost<ResolvedEns[]>({
      endpoint,
      body: ens,
    });
    if (!success || !data) {
      return [];
    }
    return data;
  };

  const addCustomTokenPool = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    if (!tokens.length) {
      setToasts({ messages: ["No tokens provided"], type: "error" });
      return null;
    }
    if (tokens.length > MAX_CUSTOM_SNAPSHOT_ROWS) {
      setToasts({
        messages: [
          `You can upload up to ${MAX_CUSTOM_SNAPSHOT_ROWS.toLocaleString()} wallets per batch`,
        ],
        type: "error",
      });
      return null;
    }
    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setToasts({ messages: ["Name is required"], type: "error" });
      return null;
    }

    const ens = tokens.filter((token) => token.owner.endsWith(".eth"));
    setIsLoading(true);
    try {
      const resolvedEns = await resolveEns(ens.map((token) => token.owner));
      if (ens.length !== resolvedEns.length) {
        setToasts({
          messages: ["Some ENS addresses could not be resolved"],
          type: "error",
        });
        return null;
      }
      if (resolvedEns.some((resolved) => !resolved.address)) {
        setToasts({
          messages: ["Some ENS addresses could not be resolved"],
          type: "error",
        });
        return null;
      }

      const resolvedMap = new Map<string, string>();
      resolvedEns.forEach((resolved) => {
        if (resolved.address) {
          resolvedMap.set(resolved.ens, resolved.address.toLowerCase());
        }
      });

      const tokensWithResolvedEns = tokens.map((token) => {
        if (token.owner.endsWith(".eth")) {
          const resolvedAddress = resolvedMap.get(token.owner);
          if (!resolvedAddress) {
            return token;
          }
          return {
            ...token,
            owner: resolvedAddress,
          };
        }
        return token;
      });

      const tokenChunks = chunkTokens(tokensWithResolvedEns);
      const createdSnapshotIds: string[] = [];
      for (let index = 0; index < tokenChunks.length; index += 1) {
        const chunk = tokenChunks[index];
        const snapshotName = `${trimmedName}-${index + 1}`;
        const customTokenPoolId = getRandomObjectId();
        const endpoint = `/allowlists/${distributionPlan.id}/operations`;
        const { success } = await distributionPlanApiPost<AllowlistOperation>({
          endpoint,
          body: {
            code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
            params: {
              id: customTokenPoolId,
              name: snapshotName,
              description: snapshotName,
              tokens: chunk,
            },
          },
        });

        if (!success) {
          setToasts({
            messages: [
              `Failed to create snapshot "${snapshotName}". Please try again.`,
            ],
            type: "error",
          });
          return null;
        }
        createdSnapshotIds.push(customTokenPoolId);
      }

      fetchOperations(distributionPlan.id);
      setFormValues({
        name: "",
      });
      setTokens([]);
      setFileName(null);
      setToasts({
        messages: [
          `Created ${tokenChunks.length} custom snapshot${
            tokenChunks.length > 1 ? "s" : ""
          }.`,
        ],
        type: "success",
      });
      return createdSnapshotIds.at(0) ?? null;
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
    const normalizedWallet = manualWallet.toLowerCase();
    setTokens((prev) => {
      if (prev.length >= MAX_CUSTOM_SNAPSHOT_ROWS) {
        setToasts({
          messages: [
            `You can upload up to ${MAX_CUSTOM_SNAPSHOT_ROWS.toLocaleString()} wallets per batch`,
          ],
          type: "error",
        });
        return prev;
      }
      return [
        {
          owner: normalizedWallet,
        },
        ...prev,
      ];
    });

    setManualWallet(null);
  };

  const addUploadedTokens = (
    uploadedTokens: CustomTokenPoolParamsToken[]
  ): boolean => {
    if (!uploadedTokens.length) {
      setToasts({
        messages: ["No wallets found in the uploaded file"],
        type: "error",
      });
      return false;
    }
    let tokensWereAdded = false;
    setTokens((prev) => {
      if (prev.length + uploadedTokens.length > MAX_CUSTOM_SNAPSHOT_ROWS) {
        setToasts({
          messages: [
            `You can upload up to ${MAX_CUSTOM_SNAPSHOT_ROWS.toLocaleString()} wallets per batch`,
          ],
          type: "error",
        });
        return prev;
      }
      tokensWereAdded = true;
      return [...uploadedTokens, ...prev];
    });
    return tokensWereAdded;
  };

  const [isAddWalletsOpen, setIsAddWalletsOpen] = useState<boolean>(false);

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
          <div>
            <div>
              <button
                onClick={() => setIsAddWalletsOpen(true)}
                type="button"
                className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent tw-px-4 tw-py-3 tw-underline hover:tw-bg-[#232323] tw-rounded-lg tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border-transparent tw-border-solid tw-border-neutral-700 tw-border-2 hover:tw-border-[#232323] tw-transition tw-duration-300 tw-ease-out">
                <svg
                  className="tw-h-5 tw-w-5 tw-mr-2 -tw-ml-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Add wallets</span>
              </button>
            </div>
          </div>
          <div>
            <DistributionPlanAddOperationBtn loading={isLoading}>
              Add custom snapshot
            </DistributionPlanAddOperationBtn>
          </div>
        </div>
      </form>
      {isAddWalletsOpen && (
        <AllowlistToolCommonModalWrapper
          showModal={isAddWalletsOpen}
          onClose={() => setIsAddWalletsOpen(false)}
          title={`Add wallets`}
          modalSize={AllowlistToolModalSize.X_LARGE}
          showTitle={false}>
          <CreateCustomSnapshotFormAddWalletsModal
            fileName={fileName}
            setFileName={setFileName}
            tokens={tokens}
            addUploadedTokens={addUploadedTokens}
            setManualWallet={setManualWallet}
            addManualWallet={addManualWallet}
            onRemoveToken={onRemoveToken}
            onClose={() => setIsAddWalletsOpen(false)}
          />
        </AllowlistToolCommonModalWrapper>
      )}
      <div className="tw-hidden">
        <CreateCustomSnapshotFormTable
          tokens={tokens}
          onRemoveToken={onRemoveToken}
        />
      </div>
    </div>
  );
}
