
import { Drop } from "../../../generated/models/Drop";
import DropsListItem from "./item/DropsListItem";

export default function DropsList({ drops }: { readonly drops: Drop[] }) {
  return (
    <div className="tw-space-y-4">
      {drops.map((drop) => (
        <DropsListItem drop={drop} key={drop.id} />
      ))}
    </div>
  );
}
