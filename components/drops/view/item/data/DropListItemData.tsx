import { useState } from "react";
import DropListItemDataTrigger from "./DropListItemDataTrigger";
import DropListItemDataContent from "./DropListItemDataContent";
import { Drop } from "../../../../../generated/models/Drop";

export default function DropListItemData({ drop }: { readonly drop: Drop }) {
  const [showMoreOpen, setShowMoreOpen] = useState<boolean>(false);

  return (
    <div className="tw-mt-2 sm:tw-ml-16">
      <DropListItemDataTrigger open={showMoreOpen} setOpen={setShowMoreOpen} />
      <DropListItemDataContent open={showMoreOpen} drop={drop} />
    </div>
  );
}
