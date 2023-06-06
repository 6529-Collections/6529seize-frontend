import { useContext, useState } from "react";
import {
  AllowlistOperationCode,
  AllowlistOperationDescription,
} from "../../../../allowlist-tool.types";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import AllowlistToolBuilderAddModalSelectOperation from "../AllowlistToolBuilderAddModalSelectOperation";
import AllowlistToolBuilderAddItemExcludeTokenIdsOperation from "./AllowlistToolBuilderAddItemExcludeTokenIdsOperation";
import AllowlistToolBuilderAddItemSelectTokenIdsOperation from "./AllowlistToolBuilderAddItemSelectTokenIdsOperation";
import AllowlistToolBuilderAddItemRemoveFirstNTokensOperation from "./AllowlistToolBuilderAddItemRemoveFirstNTokensOperation";
import AllowlistToolBuilderAddItemRemoveLastNTokensOperation from "./AllowlistToolBuilderAddItemRemoveLastNTokensOperation";
import AllowlistToolBuilderAddItemSelectFirstNTokensOperation from "./AllowlistToolBuilderAddItemSelectFirstNTokensOperation";
import AllowlistToolBuilderAddItemSelectLastNTokensOperation from "./AllowlistToolBuilderAddItemSelectLastNTokensOperation";

export default function AllowlistToolBuilderAddItemOperationModal({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const validOperations: AllowlistOperationCode[] = [
    AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS,
    AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS,
    AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS,
    AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS,
    AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS,
    AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS,
  ];
  const { operationDescriptions } = useContext(AllowlistToolBuilderContext);
  const operations = validOperations.reduce<AllowlistOperationDescription[]>(
    (acc, operation) => {
      const operationDescription = operationDescriptions.find(
        (o) => o.code === operation
      );
      if (operationDescription) {
        acc.push(operationDescription);
      }
      return acc;
    },
    []
  );

  const [selectedOperation, setSelectedOperation] =
    useState<AllowlistOperationDescription | null>(null);

  const onChange = (operation: AllowlistOperationCode) => {
    setSelectedOperation(
      operationDescriptions.find((o) => o.code === operation) ?? null
    );
  };

  return (
    <div className="tw-mt-5">
      <AllowlistToolBuilderAddModalSelectOperation
        operations={operations}
        onChange={onChange}
        selectedOperation={selectedOperation}
      />
      {selectedOperation && (
        <>
          {(() => {
            switch (selectedOperation.code) {
              case AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS:
                return (
                  <AllowlistToolBuilderAddItemExcludeTokenIdsOperation
                    itemId={itemId}
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS:
                return (
                  <AllowlistToolBuilderAddItemSelectTokenIdsOperation
                    itemId={itemId}
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS:
                return (
                  <AllowlistToolBuilderAddItemRemoveFirstNTokensOperation
                    itemId={itemId}
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS:
                return (
                  <AllowlistToolBuilderAddItemRemoveLastNTokensOperation
                    itemId={itemId}
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS:
                return (
                  <AllowlistToolBuilderAddItemSelectFirstNTokensOperation
                    itemId={itemId}
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS:
                return (
                  <AllowlistToolBuilderAddItemSelectLastNTokensOperation
                    itemId={itemId}
                    onClose={onClose}
                  />
                );
              default:
                return null;
            }
          })()}
        </>
      )}
    </div>
  );
}
