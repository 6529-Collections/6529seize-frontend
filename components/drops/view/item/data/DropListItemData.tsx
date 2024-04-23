import { useState } from "react";
import { Drop } from "../../../../../entities/IDrop";
import DropListItemDataTrigger from "./DropListItemDataTrigger";
import DropListItemDataContent from "./DropListItemDataContent";

export default function DropListItemData({ drop }: { readonly drop: Drop }) {
  const [showMoreOpen, setShowMoreOpen] = useState<boolean>(false);

  return (
    <div className="tw-mt-2 sm:tw-ml-[3.25rem]">
      <DropListItemDataTrigger open={showMoreOpen} setOpen={setShowMoreOpen} />
      <DropListItemDataContent open={showMoreOpen} drop={drop} />
    </div>
  );
}
