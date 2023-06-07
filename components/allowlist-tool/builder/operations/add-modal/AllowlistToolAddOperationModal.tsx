import { useContext, useEffect, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../pages/allowlist-tool/[id]";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../../allowlist-tool.types";
import AllowlistToolSelectMenu, {
  AllowlistToolSelectMenuOption,
} from "../../../common/select-menu/AllowlistToolSelectMenu";
import AllowlistToolBuilderComponentAddSpotsToAllItemWalletsOperation from "./component/AllowlistToolBuilderAddComponentAddSpotsToAllItemWalletsOperation";
import AllowlistToolBuilderComponentAddItemOperation from "./component/AllowlistToolBuilderAddComponentAddItemOperation";
import AllowlistToolBuilderItemExcludeTokenIdsOperation from "./item/AllowlistToolBuilderItemExcludeTokenIdsOperation";
import AllowlistToolBuilderItemSelectTokenIdsOperation from "./item/AllowlistToolBuilderAddItemSelectTokenIdsOperation";
import AllowlistToolBuilderItemRemoveFirstNTokensOperation from "./item/AllowlistToolBuilderAddItemRemoveFirstNTokensOperation";
import AllowlistToolBuilderItemRemoveLastNTokensOperation from "./item/AllowlistToolBuilderAddItemRemoveLastNTokensOperation";
import AllowlistToolBuilderItemSelectFirstNTokensOperation from "./item/AllowlistToolBuilderAddItemSelectFirstNTokensOperation";
import AllowlistToolBuilderItemSelectLastNTokensOperation from "./item/AllowlistToolBuilderAddItemSelectLastNTokensOperation";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import AllowlistToolBuilderGetCollectionTransfersOperation from "./transfer-pools/AllowlistToolBuilderGetCollectionTransfersOperation";
import AllowlistToolBuilderCreateTokenPoolOperation from "./token-pools/AllowlistToolBuilderCreateTokenPoolOperation";
import AllowlistToolBuilderCreateCustomTokenPoolOperation from "./custom-token-pools/AllowlistToolBuilderCreateCustomTokenPoolOperation";
import AllowlistToolBuilderCreateWalletPoolOperation from "./wallet-pools/AllowlistToolBuilderCreateWalletPoolOperation";
import AllowlistToolBuilderAddPhaseOperation from "./phases/AllowlistToolBuilderAddPhaseOperation";
import AllowlistToolBuilderAddComponentOperation from "../phase/AllowlistToolBuilderAddComponentOperation";
import { useRouter } from "next/router";
import { on } from "events";
import { AnimatePresence, motion } from "framer-motion";

export default function AllowlistToolAddOperationModal({
  targetItemId,
  validOperations,
  defaultOperation,
  onClose,
}: {
  targetItemId: string | null;
  validOperations: AllowlistOperationCode[];
  defaultOperation: AllowlistOperationCode | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { operationDescriptions, setToasts, setOperations, operations } =
    useContext(AllowlistToolBuilderContext);
  const options = validOperations.reduce<AllowlistToolSelectMenuOption[]>(
    (acc, operation) => {
      const operationDescription = operationDescriptions.find(
        (o) => o.code === operation
      );
      if (operationDescription) {
        acc.push({
          title: operationDescription.title,
          subTitle: null,
          value: operation,
        });
      }
      return acc;
    },
    []
  );

  const [selectedOperation, setSelectedOperation] =
    useState<AllowlistToolSelectMenuOption | null>(null);

  const [selectedOperationCode, setSelectedOperationCode] =
    useState<AllowlistOperationCode | null>(null);

  useEffect(() => {
    if (selectedOperation) {
      setSelectedOperationCode(
        selectedOperation.value as AllowlistOperationCode
      );
    }
  }, [selectedOperation]);

  if (!selectedOperation && defaultOperation) {
    const operationDescription = operationDescriptions.find(
      (o) => o.code === defaultOperation
    );
    if (operationDescription) {
      setSelectedOperation({
        title: operationDescription.title,
        subTitle: null,
        value: defaultOperation,
      });
    }
  }

  const [isLoading, setIsLoading] = useState(false);
  const addOperation = async ({
    code,
    params,
  }: {
    code: AllowlistOperationCode;
    params: any;
  }): Promise<{ success: boolean }> => {
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`;
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          params,
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
        return { success: false };
      }
      setOperations([...operations, data]);
      onClose();
      return { success: true };
    } catch (error) {
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tw-mt-5">
      <div className="tw-px-4 sm:tw-px-6">
        <AllowlistToolSelectMenu
          label="Select operation"
          placeholder="Select"
          options={options}
          selectedOption={selectedOperation}
          setSelectedOption={setSelectedOperation}
        />
      </div>
      <AnimatePresence>
        {selectedOperationCode && (
          <motion.div
            // layout
            // layoutRoot
            // key={selectedOperationCode}
            // initial="initial"
            // animate="animate"
            // exit="exit"
            // variants={{
            //   initial: { height: "0", transition: { duration: 0.3 } },
            //   animate: { height: "auto", transition: { duration: 0.3 } },
            //   exit: { height: "0", transition: { duration: 0.3 } },
            // }}
          >
            <div className="tw-mt-5 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-800">
              <AnimatePresence>
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {(() => {
                    switch (selectedOperationCode) {
                      case AllowlistOperationCode.CREATE_ALLOWLIST:
                        return null;
                      case AllowlistOperationCode.GET_COLLECTION_TRANSFERS:
                        return (
                          <AllowlistToolBuilderGetCollectionTransfersOperation
                            isLoading={isLoading}
                            addOperation={addOperation}
                          />
                        );
                      case AllowlistOperationCode.CREATE_TOKEN_POOL:
                        return (
                          <AllowlistToolBuilderCreateTokenPoolOperation
                            isLoading={isLoading}
                            addOperation={addOperation}
                          />
                        );
                      case AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL:
                        return (
                          <AllowlistToolBuilderCreateCustomTokenPoolOperation
                            isLoading={isLoading}
                            addOperation={addOperation}
                          />
                        );
                      case AllowlistOperationCode.CREATE_WALLET_POOL:
                        return (
                          <AllowlistToolBuilderCreateWalletPoolOperation
                            isLoading={isLoading}
                            addOperation={addOperation}
                          />
                        );
                      case AllowlistOperationCode.ADD_PHASE:
                        return (
                          <AllowlistToolBuilderAddPhaseOperation
                            isLoading={isLoading}
                            addOperation={addOperation}
                          />
                        );
                      case AllowlistOperationCode.ADD_COMPONENT:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderAddComponentOperation
                              phaseId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderComponentAddSpotsToAllItemWalletsOperation
                              componentId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.ADD_ITEM:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderComponentAddItemOperation
                              componentId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderItemExcludeTokenIdsOperation
                              itemId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderItemSelectTokenIdsOperation
                              itemId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderItemRemoveFirstNTokensOperation
                              itemId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderItemRemoveLastNTokensOperation
                              itemId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderItemSelectFirstNTokensOperation
                              itemId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      case AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS:
                        return (
                          targetItemId && (
                            <AllowlistToolBuilderItemSelectLastNTokensOperation
                              itemId={targetItemId}
                              isLoading={isLoading}
                              addOperation={addOperation}
                            />
                          )
                        );
                      default:
                        assertUnreachable(selectedOperationCode);
                        return null;
                    }
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
