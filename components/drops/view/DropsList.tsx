import { DropFull } from "../../../entities/IDrop";
import DropsListItem from "./item/DropsListItem";

export default function DropsList({ drops }: { readonly drops: DropFull[] }) {
  return (
    <div className="tw-space-y-4 tw-mt-2 lg:tw-mt-4">
      {drops.map((drop) => (
        <DropsListItem drop={drop} key={drop.id} />
      ))}
    </div>
  );
}