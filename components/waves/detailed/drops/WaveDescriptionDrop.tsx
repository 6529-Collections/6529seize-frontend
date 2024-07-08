import { Wave } from "../../../../generated/models/Wave";
import DropsListItem from "../../../drops/view/item/DropsListItem";

export default function WaveDescriptionDrop({ wave }: { readonly wave: Wave }) {
  return (
    <div>
      <DropsListItem drop={wave.description_drop} />
    </div>
  );
}
