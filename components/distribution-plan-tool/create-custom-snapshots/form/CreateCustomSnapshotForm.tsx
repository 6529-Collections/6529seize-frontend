"use client";

import {
    AllowlistOperation,
    AllowlistOperationCode,
    CustomTokenPoolParamsToken,
    ResolvedEns,
} from "@/components/allowlist-tool/allowlist-tool.types";
import AllowlistToolCommonModalWrapper, {
    AllowlistToolModalSize,
} from "@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import DistributionPlanAddOperationBtn from "@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import {
    getRandomObjectId,
    isEthereumAddress,
} from "@/helpers/AllowlistToolHelpers";
import { distributionPlanApiPost } from "@/services/distribution-plan-api";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import CreateCustomSnapshotFormAddWalletsModal from "./CreateCustomSnapshotFormAddWalletsModal";
import CreateCustomSnapshotFormTable from "./CreateCustomSnapshotFormTable";

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
  const [uploadState, setUploadState] = useState<{
    processed: number;
    total: number;
  } | null>(null);

  const tokenCount = tokens.length;
  const chunkCount =
    tokenCount > 0
      ? Math.ceil(tokenCount / CUSTOM_SNAPSHOT_CHUNK_SIZE)
      : 0;

  const snapshotSummary = useMemo(() => {
    if (!tokenCount) {
      return null;
    }
    const walletLabel = tokenCount === 1 ? "wallet" : "wallets";
    const snapshotLabel = chunkCount === 1 ? "custom snapshot" : "custom snapshots";
    return `We will split ${tokenCount.toLocaleString()} ${walletLabel} into ${chunkCount.toLocaleString()} ${snapshotLabel} (up to ${CUSTOM_SNAPSHOT_CHUNK_SIZE.toLocaleString()} wallets each).`;
  }, [tokenCount, chunkCount]);

  const resolveEnsMutation = useMutation<ResolvedEns[], Error, string[]>({
    mutationFn: async (ensList) => {
      if (!ensList.length) {
        return [];
      }
      const endpoint = `/other/resolve-ens-to-address`;
      const { success, data } = await distributionPlanApiPost<ResolvedEns[]>({
        endpoint,
        body: ensList,
      });
      if (!success || !data) {
        throw new Error("Failed to resolve ENS addresses");
      }
      return data;
    },
    onError: () => {
      setToasts({
        messages: ["Some ENS addresses could not be resolved"],
        type: "error",
      });
    },
  });

  const createCustomSnapshotsMutation = useMutation<
    { snapshotId: string | null; chunkCount: number },
    Error,
    {
      tokens: CustomTokenPoolParamsToken[];
      trimmedName: string;
      distributionPlanId: string;
    }
  >({
    mutationFn: async ({ tokens: originalTokens, trimmedName, distributionPlanId }) => {
      const ensTokens = originalTokens.filter((token) =>
        token.owner.endsWith(".eth")
      );
      let tokensWithResolvedEns = originalTokens;
      if (ensTokens.length) {
        const resolvedEns = await resolveEnsMutation.mutateAsync(
          ensTokens.map((token) => token.owner)
        );
        if (ensTokens.length !== resolvedEns.length) {
          setToasts({
            messages: ["Some ENS addresses could not be resolved"],
            type: "error",
          });
          throw new Error("ENS resolution count mismatch");
        }
        if (resolvedEns.some((resolved) => !resolved.address)) {
          setToasts({
            messages: ["Some ENS addresses could not be resolved"],
            type: "error",
          });
          throw new Error("ENS resolution missing addresses");
        }

        const resolvedMap = new Map<string, string>();
        for (const resolved of resolvedEns) {
          if (resolved.address) {
            resolvedMap.set(resolved.ens, resolved.address.toLowerCase());
          }
        }

        tokensWithResolvedEns = originalTokens.map((token) => {
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
      }

      const tokenChunks = chunkTokens(tokensWithResolvedEns);
      if (!tokenChunks.length) {
        setToasts({
          messages: ["No valid wallets found after resolving ENS"],
          type: "error",
        });
        throw new Error("No valid wallets after resolving ENS");
      }

      setUploadState({ processed: 0, total: tokenChunks.length });

      const createdSnapshotIds: string[] = [];
      for (let index = 0; index < tokenChunks.length; index += 1) {
        const chunk = tokenChunks[index];
        const snapshotName = `${trimmedName}-${index + 1}`;
        const customTokenPoolId = getRandomObjectId();
        const endpoint = `/allowlists/${distributionPlanId}/operations`;
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
          throw new Error(`Failed to create snapshot "${snapshotName}"`);
        }

        createdSnapshotIds.push(customTokenPoolId);
        setUploadState({
          processed: index + 1,
          total: tokenChunks.length,
        });
      }

      return {
        snapshotId: createdSnapshotIds.at(0) ?? null,
        chunkCount: tokenChunks.length,
      };
    },
    onSuccess: ({ chunkCount }, variables) => {
      fetchOperations(variables.distributionPlanId);
      setFormValues({
        name: "",
      });
      setTokens([]);
      setFileName(null);
      setToasts({
        messages: [
          `Created ${chunkCount} custom snapshot${
            chunkCount > 1 ? "s" : ""
          }.`,
        ],
        type: "success",
      });
    },
    onSettled: () => {
      setUploadState(null);
    },
  });

  const addCustomTokenPool = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    if (createCustomSnapshotsMutation.isPending) {
      return null;
    }
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

    try {
      const result = await createCustomSnapshotsMutation.mutateAsync({
        tokens,
        trimmedName,
        distributionPlanId: distributionPlan.id,
      });
      return result.snapshotId;
    } catch {
      return null;
    }
  };

  const isLoading = createCustomSnapshotsMutation.isPending;

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
    const normalizedWallet = manualWallet.trim().toLowerCase();
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
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
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
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div>
            <div>
              <button
                onClick={() => setIsAddWalletsOpen(true)}
                type="button"
                className="tw-inline-flex tw-items-center tw-whitespace-nowrap tw-justify-center tw-cursor-pointer tw-bg-transparent tw-px-4 tw-py-3 tw-underline hover:tw-bg-[#232323] tw-rounded-lg tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border-transparent tw-border-solid tw-border-iron-700 tw-border-2 hover:tw-border-[#232323] tw-transition tw-duration-300 tw-ease-out">
                <FontAwesomeIcon
                  icon={faPlus}
                  className="tw-h-5 tw-w-5 tw-mr-2 -tw-ml-1"
                />
                <span>Add wallets</span>
              </button>
            </div>
          </div>
          <div>
            <DistributionPlanAddOperationBtn loading={isLoading}>
              {chunkCount > 1
                ? `Add ${chunkCount.toLocaleString()} custom snapshots`
                : "Add custom snapshot"}
            </DistributionPlanAddOperationBtn>
            <div className="tw-mt-3 tw-space-y-2">
              <p className="tw-text-xs tw-text-iron-300">
                Snapshots are limited to {CUSTOM_SNAPSHOT_CHUNK_SIZE.toLocaleString()} wallets. We'll split larger uploads automatically.
              </p>
              {snapshotSummary && (
                <p className="tw-text-xs tw-text-iron-100">{snapshotSummary}</p>
              )}
              {uploadState && uploadState.total > 0 && (
                <div>
                  <div className="tw-h-2 tw-w-60 tw-overflow-hidden tw-rounded-full tw-bg-iron-700">
                    <div
                      className="tw-h-2 tw-rounded-full tw-bg-primary-500 tw-transition-all tw-duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (uploadState.processed / uploadState.total) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="tw-mt-2 tw-text-xs tw-text-iron-200">
                    {uploadState.processed < uploadState.total
                      ? `Creating snapshot ${Math.min(
                          uploadState.processed + 1,
                          uploadState.total
                        )} of ${uploadState.total.toLocaleString()}...`
                      : "Finalizing snapshots..."}
                  </p>
                </div>
              )}
            </div>
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
            chunkSize={CUSTOM_SNAPSHOT_CHUNK_SIZE}
            maxRows={MAX_CUSTOM_SNAPSHOT_ROWS}
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
