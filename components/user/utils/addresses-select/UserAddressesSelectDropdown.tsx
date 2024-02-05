import { useRouter } from "next/router";
import { IProfileConsolidation } from "../../../../entities/IProfile";
import { CommonSelectItem } from "../../../utils/select/CommonSelect";
import CommonDropdown from "../../../utils/select/dropdown/CommonDropdown";
import { RefObject, useEffect, useState } from "react";
import { formatAddress } from "../../../../helpers/Helpers";
import UserAddressesSelectDropdownItem from "./UserAddressesSelectDropdownItem";

type SelectedType = string | null;

export default function UserAddressesSelectDropdown({
  addresses,
  containerRef,
  onActiveAddress,
}: {
  readonly addresses: IProfileConsolidation[];
  readonly containerRef?: RefObject<HTMLDivElement>;
  readonly onActiveAddress: (address: SelectedType) => void;
}) {
  const router = useRouter();
  const items: CommonSelectItem<SelectedType, IProfileConsolidation | null>[] =
    [
      {
        label: "All Addresses",
        value: null,
        key: "all",
        childrenProps: null,
      },
      ...addresses.map((address) => ({
        label: address.wallet.ens ?? formatAddress(address.wallet.address),
        value: address.wallet.address.toLowerCase(),
        key: address.wallet.address.toLowerCase(),
        childrenProps: address,
      })),
    ];

  const getAddressFromQuery = (): string | null => {
    if (!router.query.address) {
      return null;
    }
    if (typeof router.query.address === "string") {
      return router.query.address.toLowerCase();
    }

    if (router.query.address.length > 0) {
      return router.query.address[0].toLowerCase();
    }
    return null;
  };

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  useEffect(() => {
    setActiveAddress((router.query.address as string) ?? null);
  }, [router.query.address]);

  useEffect(() => {
    onActiveAddress(activeAddress);
  }, [activeAddress]);

  const onAddressChange = (address: string | null) => {
    if (!address || address === activeAddress) {
      setActiveAddress(null);
      const currentQuery = { ...router.query };
      delete currentQuery.address;
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
      return;
    }
    setActiveAddress(address);
    const currentQuery = { ...router.query };
    currentQuery.address = address;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const getActiveItem = (): SelectedType => {
    return items.find((item) => item.value === activeAddress)?.value ?? null;
  };

  const [activeItem, setActiveItem] = useState<SelectedType>(getActiveItem());

  useEffect(() => {
    setActiveItem(getActiveItem());
  }, [activeAddress]);

  return (
    <CommonDropdown
      items={items}
      filterLabel="Address"
      activeItem={activeItem}
      containerRef={containerRef}
      setSelected={onAddressChange}
      renderItemChildren={(item) =>
        item.childrenProps ? (
          <UserAddressesSelectDropdownItem item={item.childrenProps} />
        ) : (
          <></> // return an empty fragment when item.childrenProps is not available
        )
      }
    />
  );
}
