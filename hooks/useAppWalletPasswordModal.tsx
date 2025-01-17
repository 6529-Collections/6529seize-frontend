import React, { useState } from "react";
import { UnlockAppWalletModal } from "../components/app-wallets/AppWalletModal";

export const useAppWalletPasswordModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolve, setResolve] = useState<(password: string) => void>();
  const [reject, setReject] = useState<(reason?: any) => void>();

  const [address, setAddress] = useState("");
  const [addressHashed, setAddressHashed] = useState("");

  const requestPassword = (
    address: string,
    addressHashed: string
  ): Promise<string> => {
    setAddress(address);
    setAddressHashed(addressHashed);
    setIsOpen(true);
    return new Promise<string>((resolve, reject) => {
      setResolve(() => resolve);
      setReject(() => reject);
    });
  };

  const handlePasswordSubmit = (password: string) => {
    if (resolve) resolve(password);
    closeModal();
  };

  const handleCancel = () => {
    if (reject) reject(new Error("Password entry canceled."));
    closeModal();
  };

  const closeModal = () => {
    setAddress("");
    setAddressHashed("");
    setIsOpen(false);
    setResolve(undefined);
    setReject(undefined);
  };

  const modal = (
    <UnlockAppWalletModal
      address={address}
      address_hashed={addressHashed}
      show={isOpen}
      onHide={() => handleCancel()}
      onUnlock={(pass: string) => {
        handlePasswordSubmit(pass);
      }}
    />
  );

  return { requestPassword, modal };
};
