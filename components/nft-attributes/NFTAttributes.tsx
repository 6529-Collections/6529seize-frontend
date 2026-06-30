import styles from "./NFTAttributes.module.scss";
import type { IAttribute } from "@/entities/INFT";
import clsx from "clsx";

export default function NFTAttributes(
  props: Readonly<{
    attributes: IAttribute[];
  }>
) {
  return (
    <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 md:tw-grid-cols-6">
      {props.attributes.map((a: any) => (
        <div key={a.trait_type} className="tw-py-2">
          <div className="tw-px-3">
            <div className={clsx(styles["nftAttribute"], "tw-rounded-md")}>
              <span>{a.trait_type}</span>
              <br />
              <span title={a.value}>{a.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
