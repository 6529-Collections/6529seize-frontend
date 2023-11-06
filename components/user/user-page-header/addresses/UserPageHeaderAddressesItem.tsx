import { IProfileConsolidation } from "../../../../entities/IProfile";

export default function UserPageHeaderAddressesItem({
  item,
  activeAddress,
  onActiveAddress,
}: {
  item: IProfileConsolidation;
  activeAddress: string | null;
  onActiveAddress: (address: string) => void;
}) {
  const title = item.wallet.ens ?? item.wallet.address;
  return (
    <li
      className="tw-group tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-neutral-600 tw-transition tw-duration-300 tw-ease-out"
      onClick={() => onActiveAddress(item.wallet.address.toLowerCase())}
    >
      <span className="tw-inline-block tw-text-sm tw-font-medium tw-text-white">
        {title}
      </span>
    </li>
  );
}
