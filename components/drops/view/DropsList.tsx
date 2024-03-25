import { DropFull } from "../../../entities/IDrop";
import DropsListItem from "./item/DropsListItem";

export default function DropsList({ drops }: { readonly drops: DropFull[] }) {
  return (
    <div>
      {drops.map((drop) => (
        <DropsListItem drop={drop} key={drop.id} />
      ))}
    </div>
  );
}
