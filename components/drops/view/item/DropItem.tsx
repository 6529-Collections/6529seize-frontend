import { Drop } from "../../../../generated/models/Drop";
import DropPfp from "../../create/utils/DropPfp";

export default function DropItem({ drop }: { readonly drop: Drop }) {
  return <div><DropPfp pfpUrl={drop.author.pfp}  /></div>;
}
