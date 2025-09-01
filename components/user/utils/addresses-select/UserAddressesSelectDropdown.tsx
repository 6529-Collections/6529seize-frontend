"use client";

import { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { ApiWallet } from "@/generated/models/ApiWallet";
import { formatAddress } from "@/helpers/Helpers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefObject, useEffect, useMemo, useState } from "react";
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

  const items: CommonSelectItem<SelectedType, ApiWallet | null>[] = useMemo(
    () => [
      { label: "All Addresses", value: null, key: "all", childrenProps: null },
      ...wallets.map((wallet) => ({
        label: wallet.display ?? formatAddress(wallet.wallet),
        value: wallet.wallet.toLowerCase(),
        key: wallet.wallet.toLowerCase(),
        childrenProps: wallet,
      })),
    ],
    [wallets]
  );

  const getAddressFromQuery = (): string | null => {
    const addressParam = searchParams?.get("address");
    return addressParam ? addressParam.toLowerCase() : null;
  };

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  useEffect(() => {
    const next = searchParams?.get("address");
    setActiveAddress(next ? next.toLowerCase() : null);
  }, [searchParams]);

  useEffect(() => {
    onActiveAddress(activeAddress);
  }, [activeAddress, onActiveAddress]);

  const onAddressChange = (address: string | null) => {
    // Robust clone of current params (works in tests/mocks)
    const params = new URLSearchParams(
      searchParams?.entries ? Array.from(searchParams.entries()) : []
    );

    if (!address || address === activeAddress) {
      setActiveAddress(null);
      params.delete("address");
      const newUrl =
        pathname + (params.toString() ? `?${params.toString()}` : "");
      router.push(newUrl, { scroll: false });
      return;
    }

    const lower = address.toLowerCase();
    setActiveAddress(lower);
    params.set("address", lower);
    const newUrl =
      pathname + (params.toString() ? `?${params.toString()}` : "");
    router.push(newUrl, { scroll: false });
  };

  const activeItem: SelectedType = useMemo(
    () => items.find((item) => item.value === activeAddress)?.value ?? null,
    [items, activeAddress]
  );

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
          <></>
        )
      }
    />
  );
}
