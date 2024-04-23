import { useState } from "react";
import { ProxyActionType } from "../../../../../../entities/IProxy";
import ProxyCreateActionSelectType from "./select-type/ProxyCreateActionSelectType";
import ProxyCreateActionAllocateRepValues from "./values/ProxyCreateActionAllocateRepValues";
import ProxyCreateActionAllocateRepWithCategoryValues from "./values/ProxyCreateActionAllocateRepWithCategoryValues";
import ProxyCreateActionAllocateCICValues from "./values/ProxyCreateActionAllocateCICValues";
import CommonChangeAnimation from "../../../../../utils/animation/CommonChangeAnimation";

export default function ProxyCreateAction() {
  const [selectedActionType, setSelectedActionType] = useState(
    ProxyActionType.ALLOCATE_REP
  );
  const valuesComponents: Record<ProxyActionType, JSX.Element> = {
    [ProxyActionType.ALLOCATE_REP]: <ProxyCreateActionAllocateRepValues />,
    [ProxyActionType.ALLOCATE_REP_WITH_CATEGORY]: (
      <ProxyCreateActionAllocateRepWithCategoryValues />
    ),
    [ProxyActionType.ALLOCATE_CIC]: <ProxyCreateActionAllocateCICValues />,
    [ProxyActionType.CREATE_WAVE]: <></>,
    [ProxyActionType.READ_WAVE]: <></>,
    [ProxyActionType.CREATE_DROP_TO_WAVE]: <></>,
    [ProxyActionType.RATE_WAVE_DROP]: <></>,
  };
  return (
    <div>
      <ProxyCreateActionSelectType
        selectedActionType={selectedActionType}
        setSelectedActionType={setSelectedActionType}
      />
      <CommonChangeAnimation>
        {valuesComponents[selectedActionType]}
      </CommonChangeAnimation>
    </div>
  );
}
