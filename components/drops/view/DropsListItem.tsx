import { DropFull } from "../../../entities/IDrop";

export default function DropsListItem({ drop }: { readonly drop: DropFull }) {
  return <div className="tw-border-solid tw-p-4">{drop.content}</div>;
}
