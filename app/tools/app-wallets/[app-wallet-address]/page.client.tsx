"use client";

import AppWalletComponent from "@/components/app-wallets/AppWallet";
import { DELEGATION_PAGE_MAIN_CLASS_NAME } from "@/components/delegation/delegation-ui";
import { useTitle } from "@/contexts/TitleContext";
import { formatAddress } from "@/helpers/Helpers";
import { useEffect } from "react";

export default function AppWalletPage(props: { readonly address: string }) {
  const { setTitle } = useTitle();

  const address = props.address;

  useEffect(() => {
    setTitle(`${formatAddress(address)} | App Wallets | 6529.io`);
  }, [address, setTitle]);

  return (
    <main className={DELEGATION_PAGE_MAIN_CLASS_NAME}>
      <AppWalletComponent address={address} />
    </main>
  );
}
