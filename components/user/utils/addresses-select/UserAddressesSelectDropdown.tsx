"use client";

import { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { ApiWallet } from "@/generated/models/ApiWallet";
import { formatAddress } from "@/helpers/Helpers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefObject, useEffect, useState } from "react";
import UserAddressesSelectDropdownItem from "./UserAddressesSelectDropdownItem";

type SelectedType = string | null;

export default function UserAddressesSelectDropdown({
  wallets,
  containerRef,
  onActiveAddress,
}: {
  readonly wallets: ApiWallet[];
  readonly containerRef?: RefObject<HTMLDivElement | null>;
  readonly onActiveAddress: (address: SelectedType) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const items: CommonSelectItem<SelectedType, ApiWallet | null>[] = [
    {
      label: "All Addresses",
      value: null,
      key: "all",
      childrenProps: null,
    },
    ...wallets.map((wallet) => ({
      label: wallet.display ?? formatAddress(wallet.wallet),
      value: wallet.wallet.toLowerCase(),
      key: wallet.wallet.toLowerCase(),
      childrenProps: wallet,
    })),
  ];

  const getAddressFromQuery = (): string | null => {
    const addressParam = searchParams?.get("address");
    if (!addressParam) {
      return null;
    }
    return addressParam.toLowerCase();
  };

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  useEffect(() => {
    setActiveAddress(searchParams?.get("address") ?? null);
  }, [searchParams]);

  useEffect(() => {
    onActiveAddress(activeAddress);
  }, [activeAddress]);

  const onAddressChange = (address: string | null) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (!address || address === activeAddress) {
      setActiveAddress(null);
      params.delete("address");
      const newUrl =
        pathname + (params.toString() ? `?${params.toString()}` : "");
      router.push(newUrl, { scroll: false });
      return;
    }
    setActiveAddress(address);
    params.set("address", address);
    const newUrl =
      pathname + (params.toString() ? `?${params.toString()}` : "");
    router.push(newUrl, { scroll: false });
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
          <UserAddressesSelectDropdownItem wallet={item.childrenProps} />
        ) : (
          <></> // return an empty fragment when item.childrenProps is not available
        )
      }
    />
  );
}
