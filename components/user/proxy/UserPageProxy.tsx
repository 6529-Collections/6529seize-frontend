import { useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import ProxyList from "./list/ProxyList";
import CommonAnimationWrapper from "../../utils/animation/CommonAnimationWrapper";
import { motion } from "framer-motion";
import ProxyCreate from "./create/ProxyCreate";

export enum ProxyMode {
  LIST = "LIST",
  CREATE = "CREATE",
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
      <CommonAnimationWrapper>
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {components[mode]}
        </motion.div>
      </CommonAnimationWrapper>
    </div>
  );
}
