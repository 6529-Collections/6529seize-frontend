import { useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import ProxyList from "./list/ProxyList";
import ProxyCreate from "./create/ProxyCreate";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";

export enum ProxyMode {
  LIST = "LIST",
  CREATE = "CREATE",
}

export enum ProxyAction {
  ALLOCATE_REP = "ALLOCATE_REP",
  ALLOCATE_CATEGORY_REP = "ALLOCATE_CATEGORY_REP",
  ALLOCATE_CIC = "ALLOCATE_CIC",
}

export default function UserPageProxy({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [mode, setMode] = useState<ProxyMode>(ProxyMode.CREATE);

  const components: Record<ProxyMode, JSX.Element> = {
    [ProxyMode.LIST]: <ProxyList onModeChange={setMode} />,
    [ProxyMode.CREATE]: <ProxyCreate onModeChange={setMode} />,
  };

  return (
    <div>
      <CommonChangeAnimation>{components[mode]}</CommonChangeAnimation>
    </div>
  );
}
