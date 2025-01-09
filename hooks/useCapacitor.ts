import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { ethers } from "ethers";
import { encryptData } from "../components/app-wallets/app-wallet-helpers";
import { Time } from "../helpers/time";

export enum CapacitorOrientationType {
  PORTRAIT,
  LANDSCAPE,
}

export interface AppWallet {
  name: string;
  created_at: number;
  address: string;
  address_hashed: string;
  mnemonic: string;
  private_key: string;
  imported: boolean;
}

const WALLET_KEY_PREFIX = "app-wallet_";

const useCapacitor = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const [orientation, setOrientation] = useState<CapacitorOrientationType>(
    CapacitorOrientationType.PORTRAIT
  );
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [fetchingWallets, setFetchingWallets] = useState(true);
  const [wallets, setWallets] = useState<AppWallet[]>([]);

  useEffect(() => {
    if (!isCapacitor) {
      return;
    }

    function isPortrait() {
      return window.matchMedia("(orientation: portrait)").matches;
    }

    function handleOrientationchange() {
      if (isPortrait()) {
        setOrientation(CapacitorOrientationType.PORTRAIT);
      } else {
        setOrientation(CapacitorOrientationType.LANDSCAPE);
      }
    }

    handleOrientationchange();

    window.addEventListener("orientationchange", handleOrientationchange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationchange);
    };
  }, []);

  useEffect(() => {
    if (!isCapacitor) {
      return;
    }

    const addPushListeners = async () => {
      await Keyboard.addListener("keyboardWillShow", () => {
        setKeyboardVisible(true);
      });
      await Keyboard.addListener("keyboardWillHide", () => {
        setKeyboardVisible(false);
      });
    };

    const removePushListeners = async () => {
      await Keyboard.removeAllListeners();
    };

    const commonCatch = (error: any) => {
      console.error("Keyboard plugin error:", error);
    };

    addPushListeners().catch(commonCatch);

    return () => {
      removePushListeners().catch(commonCatch);
    };
  }, []);

  const fetchWallets = async () => {
    setFetchingWallets(true);
    try {
      const keysResult = await SecureStoragePlugin.keys();
      const walletKeys = keysResult.value.filter((key) =>
        key.startsWith(WALLET_KEY_PREFIX)
      );

      const walletValues = await Promise.all(
        walletKeys.map(async (key) => {
          const valueResult = await SecureStoragePlugin.get({ key });
          return JSON.parse(valueResult.value);
        })
      );

      walletValues.sort((a, d) => {
        return a.created_at - d.created_at;
      });

      setWallets(walletValues);
    } catch (error) {
      console.error("Error fetching wallets from secure storage:", error);
    } finally {
      setFetchingWallets(false);
    }
  };

  useEffect(() => {
    // if (!isCapacitor) {
    //   return;
    // }

    fetchWallets();
  }, []);

  const createWallet = async (name: string, pass: string): Promise<boolean> => {
    const wallet = ethers.Wallet.createRandom();
    const encryptedAddress = await encryptData(
      wallet.address,
      wallet.address,
      pass
    );
    const encryptedMnemonic = await encryptData(
      wallet.address,
      wallet.mnemonic!.phrase ?? "",
      pass
    );
    const encryptedPrivateKey = await encryptData(
      wallet.address,
      wallet.privateKey,
      pass
    );

    const seedWallet: AppWallet = {
      name: name,
      created_at: Time.now().toSeconds(),
      address: wallet.address,
      address_hashed: encryptedAddress,
      mnemonic: encryptedMnemonic,
      private_key: encryptedPrivateKey,
      imported: false,
    };

    const result = await SecureStoragePlugin.set({
      key: `${WALLET_KEY_PREFIX}${wallet.address}`,
      value: JSON.stringify(seedWallet),
    });

    fetchWallets();

    return result.value;
  };

  const importWallet = async (
    walletName: string,
    walletPass: string,
    address: string,
    mnemonic: string,
    privateKey: string
  ): Promise<boolean> => {
    const encryptedAddress = await encryptData(address, address, walletPass);
    const encryptedMnemonic = await encryptData(address, mnemonic, walletPass);
    const encryptedPrivateKey = await encryptData(
      address,
      privateKey,
      walletPass
    );

    const wallet: AppWallet = {
      name: walletName,
      created_at: Time.now().toSeconds(),
      address: address,
      address_hashed: encryptedAddress,
      mnemonic: encryptedMnemonic,
      private_key: encryptedPrivateKey,
      imported: true,
    };

    const result = await SecureStoragePlugin.set({
      key: `${WALLET_KEY_PREFIX}${address}`,
      value: JSON.stringify(wallet),
    });

    fetchWallets();

    return result.value;
  };

  const deleteWallet = async (address: string): Promise<boolean> => {
    const result = await SecureStoragePlugin.remove({
      key: `${WALLET_KEY_PREFIX}${address}`,
    });
    return result.value;
  };

  return {
    isCapacitor,
    platform,
    orientation,
    keyboardVisible,
    fetchingWallets,
    wallets,
    fetchWallets,
    createWallet,
    importWallet,
    deleteWallet,
  };
};

export default useCapacitor;
