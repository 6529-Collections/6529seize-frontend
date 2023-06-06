import { useContext, useState } from "react";
import {
  AllowlistOperationCode,
  AllowlistOperationDescription,
} from "../../../../allowlist-tool.types";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import AllowlistToolBuilderAddModalSelectOperation from "../AllowlistToolBuilderAddModalSelectOperation";
import AllowlistToolBuilderAddComponentAddSpotsToAllItemWalletsOperation from "./AllowlistToolBuilderAddComponentAddSpotsToAllItemWalletsOperation";
import AllowlistToolBuilderAddComponentAddItemOperation from "./AllowlistToolBuilderAddComponentAddItemOperation";

export default function AllowlistToolBuilderAddComponentOperationModal({
  componentId,
  defaultOperation,
  onClose,
}: {
  componentId: string;
  defaultOperation: AllowlistOperationCode | null;
  onClose: () => void;
}) {
  const validOperations: AllowlistOperationCode[] = [
    AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
    AllowlistOperationCode.ADD_ITEM,
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

  if (!selectedOperation && defaultOperation) {
    setSelectedOperation(
      operationDescriptions.find((o) => o.code === defaultOperation) ?? null
    );
  }

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
              case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS:
                return (
                  <AllowlistToolBuilderAddComponentAddSpotsToAllItemWalletsOperation
                    componentId={componentId}
                    onClose={onClose}
                  />
                );
              case AllowlistOperationCode.ADD_ITEM:
                return (
                  <AllowlistToolBuilderAddComponentAddItemOperation
                    componentId={componentId}
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
