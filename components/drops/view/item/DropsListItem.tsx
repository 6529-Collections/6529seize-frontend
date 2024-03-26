import { DropFull } from "../../../../entities/IDrop";
import DropListItemContent from "./content/DropListItemContent";

export default function DropsListItem({ drop }: { readonly drop: DropFull }) {
  return (
    <div className="tw-border-solid tw-p-4">
      <DropListItemContent drop={drop} />
    </div>
  );
}
