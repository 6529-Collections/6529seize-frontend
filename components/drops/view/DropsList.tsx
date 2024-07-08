
import { Drop } from "../../../generated/models/Drop";
import DropsListItem from "./item/DropsListItem";

export default function DropsList({ drops }: { readonly drops: Drop[] }) {
  return (
    <div className="tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0">
      {drops.map((drop) => (
        <DropsListItem drop={drop} key={drop.id} />
      ))}
    </div>
  );
}
