import { useState } from "react";
import CreateDropCompact from "./compact/CreateDropCompact";
import { CreateDropViewType } from "./CreateDrop";
import CreateDropFull from "./full/CreateDropFull";

export default function CreateDropWrapper() {
  const [viewType, setViewType] = useState<CreateDropViewType>(
    CreateDropViewType.COMPACT
  );

  const components: Record<CreateDropViewType, JSX.Element> = {
    [CreateDropViewType.COMPACT]: <CreateDropCompact />,
    [CreateDropViewType.FULL]: <CreateDropFull />,
  };
  return <div></div>;
}
