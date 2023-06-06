import { useContext, useEffect, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../pages/allowlist-tool/[id]";
import { AllowlistOperationCode } from "../../../allowlist-tool.types";
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
  const { operationDescriptions } = useContext(AllowlistToolBuilderContext);
  const operations = validOperations.reduce<AllowlistToolSelectMenuOption[]>(
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

  return (
    <div className="tw-mt-5">
      <AllowlistToolSelectMenu
        label="Select operation"
        placeholder="Select"
        options={operations}
        selectedOption={selectedOperation}
        setSelectedOption={setSelectedOperation}
      />
      {selectedOperationCode && (
        <>
          {(() => {
            switch (selectedOperationCode) {
              case AllowlistOperationCode.CREATE_ALLOWLIST:
                return null;
              case AllowlistOperationCode.GET_COLLECTION_TRANSFERS:
                return (
                  <AllowlistToolBuilderGetCollectionTransfersOperation
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.CREATE_TOKEN_POOL:
                return (
                  <AllowlistToolBuilderCreateTokenPoolOperation
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL:
                return (
                  <AllowlistToolBuilderCreateCustomTokenPoolOperation
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.CREATE_WALLET_POOL:
                return (
                  <AllowlistToolBuilderCreateWalletPoolOperation
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.ADD_PHASE:
                return (
                  <AllowlistToolBuilderAddPhaseOperation onClose={onClose} />
                );
              case AllowlistOperationCode.ADD_COMPONENT:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderAddComponentOperation
                      phaseId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderComponentAddSpotsToAllItemWalletsOperation
                      componentId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.ADD_ITEM:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderComponentAddItemOperation
                      componentId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderItemExcludeTokenIdsOperation
                      itemId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderItemSelectTokenIdsOperation
                      itemId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderItemRemoveFirstNTokensOperation
                      itemId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderItemRemoveLastNTokensOperation
                      itemId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderItemSelectFirstNTokensOperation
                      itemId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              case AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS:
                return (
                  targetItemId && (
                    <AllowlistToolBuilderItemSelectLastNTokensOperation
                      itemId={targetItemId}
                      onClose={onClose}
                    />
                  )
                );
              default:
                assertUnreachable(selectedOperationCode);
                return null;
            }
          })()}
        </>
      )}
    </div>
  );
}
